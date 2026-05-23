import { NextRequest as Silian_NextRequest, NextResponse as Silian_NextResponse } from "next/server"
import { del as Silian_del } from "@vercel/blob"

import { auth as Silian_auth } from "@/lib/auth"
import { getGithubPatForUser as Silian_getGithubPatForUser } from "@/lib/auth-context"
import { classifyFile as Silian_classifyFile, sanitizeFilename as Silian_sanitizeFilename } from "@/lib/file-upload"
import {
  uploadArticleAssetToGithub as Silian_uploadArticleAssetToGithub,
  ArticleAssetUploadError as Silian_ArticleAssetUploadError,
} from "@/lib/github/articles-assets"

const Silian_MAX_FILE_BYTES = 50 * 1024 * 1024

export async function POST(Silian_req: Silian_NextRequest) {
  const Silian_session = await Silian_auth()

  if (!Silian_session?.user) {
    return Silian_NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let Silian_blobUrl: string | undefined

  try {
    const Silian_body = await Silian_req.json()
    Silian_blobUrl = Silian_body.blobUrl
    const Silian_filename = Silian_body.filename
    const Silian_mimeType = Silian_body.mimeType

    if (!Silian_blobUrl || typeof Silian_blobUrl !== "string") {
      return Silian_NextResponse.json({ error: "Missing blobUrl" }, { status: 400 })
    }

    if (!Silian_filename || typeof Silian_filename !== "string") {
      return Silian_NextResponse.json({ error: "Missing filename" }, { status: 400 })
    }

    if (!Silian_mimeType || typeof Silian_mimeType !== "string") {
      return Silian_NextResponse.json({ error: "Missing mimeType" }, { status: 400 })
    }

    const Silian_classification = Silian_classifyFile(Silian_mimeType)
    if (!Silian_classification) {
      return Silian_NextResponse.json(
        { error: "File type not allowed" },
        { status: 400 }
      )
    }

    const Silian_blobHostname = process.env.BLOB_STORE_HOSTNAME
    const Silian_rawBlobPathPrefix = process.env.BLOB_STORE_PATH_PREFIX || "/"
    if (!Silian_blobHostname) {
      return Silian_NextResponse.json(
        { error: "Server misconfigured" },
        { status: 500 }
      )
    }

    const Silian_blobPathPrefix = Silian_rawBlobPathPrefix.startsWith("/")
      ? Silian_rawBlobPathPrefix
      : `/${Silian_rawBlobPathPrefix}`

    const Silian_parsedUrl = new URL(Silian_blobUrl)

    const Silian_pathSegments = Silian_parsedUrl.pathname.split("/")
    const Silian_hasPathTraversal = Silian_pathSegments.some((Silian_segment) => Silian_segment === "..")

    if (
      Silian_parsedUrl.protocol !== "https:" ||
      Silian_parsedUrl.hostname !== Silian_blobHostname ||
      Silian_parsedUrl.port !== "" ||
      Silian_hasPathTraversal
    ) {
      return Silian_NextResponse.json({ error: "Invalid blob URL" }, { status: 400 })
    }

    const Silian_normalizedPath = new URL(Silian_parsedUrl.pathname, "https://blob.invalid")
      .pathname
    if (!Silian_normalizedPath.startsWith(Silian_blobPathPrefix)) {
      return Silian_NextResponse.json({ error: "Invalid blob URL" }, { status: 400 })
    }

    const Silian_relativePath = Silian_normalizedPath.slice(Silian_blobPathPrefix.length)
    if (!Silian_relativePath || Silian_relativePath.startsWith("/")) {
      return Silian_NextResponse.json({ error: "Invalid blob URL" }, { status: 400 })
    }

    const Silian_relativeSegments = Silian_relativePath.split("/")
    const Silian_hasInvalidSegment = Silian_relativeSegments.some((Silian_segment) => {
      return (
        !Silian_segment ||
        Silian_segment === "." ||
        Silian_segment === ".." ||
        !/^[A-Za-z0-9._-]+$/.test(Silian_segment)
      )
    })
    if (Silian_hasInvalidSegment) {
      return Silian_NextResponse.json({ error: "Invalid blob URL" }, { status: 400 })
    }

    const Silian_safePath = Silian_blobPathPrefix + Silian_relativePath
    const Silian_safeBlobUrl = new URL(Silian_safePath, `https://${Silian_blobHostname}`).toString()

    const Silian_blobResponse = await fetch(Silian_safeBlobUrl, { redirect: "error" })
    if (!Silian_blobResponse.ok) {
      return Silian_NextResponse.json(
        { error: "Failed to fetch uploaded file" },
        { status: 502 }
      )
    }

    const Silian_contentLength = Silian_blobResponse.headers.get("content-length")
    if (Silian_contentLength && parseInt(Silian_contentLength, 10) > Silian_MAX_FILE_BYTES) {
      return Silian_NextResponse.json({ error: "File too large" }, { status: 400 })
    }

    const Silian_buffer = Buffer.from(await Silian_blobResponse.arrayBuffer())

    if (Silian_buffer.length > Silian_classification.maxBytes) {
      const Silian_maxMB = Math.round(Silian_classification.maxBytes / (1024 * 1024))
      return Silian_NextResponse.json(
        { error: `File too large (max ${Silian_maxMB}MB).` },
        { status: 400 }
      )
    }

    const Silian_sanitized = Silian_sanitizeFilename(Silian_filename, Silian_mimeType)
    const Silian_token = (await Silian_getGithubPatForUser(Silian_session.user.id)) ?? null
    const Silian_url = await Silian_uploadArticleAssetToGithub({
      buffer: Silian_buffer,
      category: Silian_classification.category,
      filename: Silian_sanitized,
      token: Silian_token,
    })

    Silian_del(Silian_blobUrl).catch(() => {})

    return Silian_NextResponse.json({
      success: true,
      url: Silian_url,
      filename: Silian_sanitized,
      mimeType: Silian_mimeType,
      fileSize: Silian_buffer.length,
      category: Silian_classification.category,
      proxyable: Silian_classification.proxyable,
    })
  } catch (Silian_error) {
    if (Silian_blobUrl) {
      Silian_del(Silian_blobUrl).catch(() => {})
    }

    if (Silian_error instanceof Silian_ArticleAssetUploadError) {
      if (Silian_error.code === "CONFIG_MISSING") {
        return Silian_NextResponse.json({ error: Silian_error.message }, { status: 500 })
      }

      if (Silian_error.code === "AUTH_FAILED") {
        return Silian_NextResponse.json({ error: Silian_error.message }, { status: 403 })
      }

      return Silian_NextResponse.json({ error: Silian_error.message }, { status: 502 })
    }

    console.error("Article asset commit error:", Silian_error)
    return Silian_NextResponse.json({ error: "Upload failed." }, { status: 500 })
  }
}
