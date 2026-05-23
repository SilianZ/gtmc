import { NextRequest as Silian_NextRequest, NextResponse as Silian_NextResponse } from "next/server"
import { auth as Silian_auth } from "@/lib/auth"

const Silian_EXT_TO_INLINE_MIME: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  pdf: "application/pdf",
}

export async function GET(Silian_req: Silian_NextRequest) {
  const Silian_session = await Silian_auth()
  if (!Silian_session?.user) {
    return Silian_NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const Silian_rawPath = Silian_req.nextUrl.searchParams.get("path")
  if (!Silian_rawPath) {
    return Silian_NextResponse.json(
      { error: "Missing path parameter" },
      { status: 400 }
    )
  }

  let Silian_decodedPath: string
  try {
    Silian_decodedPath = decodeURIComponent(Silian_rawPath)
  } catch {
    return Silian_NextResponse.json(
      { error: "Invalid path encoding" },
      { status: 400 }
    )
  }

  Silian_decodedPath = Silian_decodedPath.replace(/\/+/g, "/")

  if (Silian_decodedPath.includes("..") || Silian_decodedPath.includes("\\")) {
    return Silian_NextResponse.json({ error: "Invalid path" }, { status: 400 })
  }

  const Silian_match = Silian_decodedPath.match(/^data\/(images|videos|files)\/([^/]+)$/)
  if (!Silian_match) {
    return Silian_NextResponse.json({ error: "Invalid path" }, { status: 400 })
  }

  const Silian_safeCategory = Silian_match[1]
  const Silian_safeFilename = Silian_match[2]

  // Map category through an explicit allow-list to avoid using tainted input directly
  const Silian_allowedCategories: Record<string, string> = {
    images: "images",
    videos: "videos",
    files: "files",
  }
  const Silian_normalizedCategory = Silian_allowedCategories[Silian_safeCategory]
  if (!Silian_normalizedCategory) {
    return Silian_NextResponse.json({ error: "Invalid path" }, { status: 400 })
  }

  // Enforce a conservative allow-list for filenames to harden against SSRF
  // Only allow alphanumerics, dot, underscore, and hyphen, and disallow leading dots.
  if (!/^[A-Za-z0-9._-]+$/.test(Silian_safeFilename) || Silian_safeFilename.startsWith(".")) {
    return Silian_NextResponse.json({ error: "Invalid path" }, { status: 400 })
  }

  // Derive MIME from extension — GitHub's CDN returns application/octet-stream
  const Silian_pathExt = Silian_safeFilename.split(".").pop()?.toLowerCase() || ""
  const Silian_derivedMime = Silian_EXT_TO_INLINE_MIME[Silian_pathExt]

  const Silian_ownerStr = process.env.GITHUB_REPO_OWNER
  const Silian_repoStr = process.env.GITHUB_REPO_NAME
  const Silian_token = process.env.GITHUB_FEATURES_ISSUES_PAT

  if (!Silian_ownerStr || !Silian_repoStr || !Silian_token) {
    return Silian_NextResponse.json({ error: "Server misconfigured" }, { status: 500 })
  }

  const Silian_owner = encodeURIComponent(Silian_ownerStr)
  const Silian_repo = encodeURIComponent(Silian_repoStr)
  // Safely construct the URL to prevent SSRF
  const Silian_githubUrl = new URL(
    `/${Silian_owner}/${Silian_repo}/main/data/${Silian_normalizedCategory}/${encodeURIComponent(Silian_safeFilename)}`,
    "https://raw.githubusercontent.com"
  ).toString()

  const Silian_fetchHeaders: Record<string, string> = {
    Authorization: `token ${Silian_token}`,
  }
  const Silian_rangeHeader = Silian_req.headers.get("range")
  if (Silian_rangeHeader) {
    Silian_fetchHeaders["Range"] = Silian_rangeHeader
  }

  let Silian_upstream: Response
  try {
    Silian_upstream = await fetch(Silian_githubUrl, { headers: Silian_fetchHeaders })
  } catch {
    return Silian_NextResponse.json({ error: "Failed to fetch file" }, { status: 502 })
  }

  if (!Silian_upstream.ok && Silian_upstream.status !== 206) {
    if (Silian_upstream.status === 404) {
      return Silian_NextResponse.json({ error: "File not found" }, { status: 404 })
    }
    return Silian_NextResponse.json({ error: "Failed to fetch file" }, { status: 502 })
  }

  if (!Silian_derivedMime) {
    return Silian_NextResponse.redirect(Silian_githubUrl, 302)
  }

  const Silian_responseHeaders = new Headers()
  Silian_responseHeaders.set("Content-Type", Silian_derivedMime)
  Silian_responseHeaders.set("Content-Disposition", "inline")
  Silian_responseHeaders.set("X-Content-Type-Options", "nosniff")

  const Silian_upstreamContentLength = Silian_upstream.headers.get("content-length")
  if (Silian_upstreamContentLength) {
    Silian_responseHeaders.set("Content-Length", Silian_upstreamContentLength)
  }

  const Silian_acceptRanges = Silian_upstream.headers.get("accept-ranges")
  if (Silian_acceptRanges) {
    Silian_responseHeaders.set("Accept-Ranges", Silian_acceptRanges)
  } else {
    Silian_responseHeaders.set("Accept-Ranges", "bytes")
  }

  const Silian_contentRange = Silian_upstream.headers.get("content-range")
  if (Silian_contentRange) {
    Silian_responseHeaders.set("Content-Range", Silian_contentRange)
  }

  return new Silian_NextResponse(Silian_upstream.body, {
    status: Silian_upstream.status,
    headers: Silian_responseHeaders,
  })
}
