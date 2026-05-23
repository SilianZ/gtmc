import { NextRequest as Silian_NextRequest, NextResponse as Silian_NextResponse } from "next/server"
import { del as Silian_del } from "@vercel/blob"
import { auth as Silian_auth } from "@/lib/auth"
import { uploadFileToGithub as Silian_uploadFileToGithub, GithubFeaturesError as Silian_GithubFeaturesError } from "@/lib/github"
import { classifyFile as Silian_classifyFile, isImageMime as Silian_isImageMime, sanitizeFilename as Silian_sanitizeFilename } from "@/lib/file-upload"

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

    if (!Silian_blobUrl || typeof Silian_blobUrl !== "string") {
      return Silian_NextResponse.json({ error: "Missing blobUrl" }, { status: 400 })
    }
    if (!Silian_filename || typeof Silian_filename !== "string") {
      return Silian_NextResponse.json({ error: "Missing filename" }, { status: 400 })
    }

    const Silian_blobHostname = process.env.BLOB_STORE_HOSTNAME
    const Silian_rawBlobPathPrefix = process.env.BLOB_STORE_PATH_PREFIX || "/"
    if (!Silian_blobHostname) {
      console.error("BLOB_STORE_HOSTNAME not configured")
      return Silian_NextResponse.json(
        { error: "Server misconfigured" },
        { status: 500 }
      )
    }
    // Normalize the configured path prefix to always start with a single "/"
    const Silian_blobPathPrefix = Silian_rawBlobPathPrefix.startsWith("/")
      ? Silian_rawBlobPathPrefix
      : `/${Silian_rawBlobPathPrefix}`

    let Silian_parsedUrl: URL
    try {
      Silian_parsedUrl = new URL(Silian_blobUrl)
    } catch {
      return Silian_NextResponse.json({ error: "Invalid blob URL" }, { status: 400 })
    }

    // Ensure the URL points to the expected HTTPS blob host only,
    // with no custom port or path traversal, and under an allowed path prefix.
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

    // Normalize the path to eliminate any implicit traversal (e.g. "/a/../b")
    // and ensure it stays within the allowed prefix.
    const Silian_normalizedPath = new URL(Silian_parsedUrl.pathname, "https://blob.invalid")
      .pathname
    if (!Silian_normalizedPath.startsWith(Silian_blobPathPrefix)) {
      return Silian_NextResponse.json({ error: "Invalid blob URL" }, { status: 400 })
    }

    // Derive the blob path relative to the configured prefix and validate it.
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
        // Only allow safe path characters in each segment
        !/^[A-Za-z0-9._-]+$/.test(Silian_segment)
      )
    })
    if (Silian_hasInvalidSegment) {
      return Silian_NextResponse.json({ error: "Invalid blob URL" }, { status: 400 })
    }

    // Rebuild a safe URL from validated components, dropping any user-controlled
    // query string to avoid influencing the blob backend via arbitrary parameters.
    const Silian_safePath = Silian_blobPathPrefix + Silian_relativePath
    const Silian_safeBlobUrlObj = new URL(Silian_safePath, `https://${Silian_blobHostname}`)
    const Silian_safeBlobUrl = Silian_safeBlobUrlObj.toString()

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

    const Silian_reader = Silian_blobResponse.body?.getReader()
    if (!Silian_reader) {
      return Silian_NextResponse.json(
        { error: "Failed to read uploaded file" },
        { status: 502 }
      )
    }

    const Silian_chunks: Uint8Array[] = []
    let Silian_totalBytes = 0

    while (true) {
      const { done: Silian_done, value: Silian_value } = await Silian_reader.read()
      if (Silian_done) break
      Silian_totalBytes += Silian_value.byteLength
      if (Silian_totalBytes > Silian_MAX_FILE_BYTES) {
        Silian_reader.cancel()
        return Silian_NextResponse.json({ error: "File too large" }, { status: 400 })
      }
      Silian_chunks.push(Silian_value)
    }

    const Silian_arrayBuffer = new Uint8Array(Silian_totalBytes)
    let Silian_offset = 0
    for (const Silian_chunk of Silian_chunks) {
      Silian_arrayBuffer.set(Silian_chunk, Silian_offset)
      Silian_offset += Silian_chunk.byteLength
    }

    const Silian_rawContentType = Silian_blobResponse.headers.get("content-type") || ""
    const Silian_derivedMime = Silian_rawContentType.split(";")[0].trim().toLowerCase()

    if (!Silian_derivedMime) {
      return Silian_NextResponse.json(
        { error: "Unable to determine file type" },
        { status: 400 }
      )
    }

    if (Silian_isImageMime(Silian_derivedMime)) {
      return Silian_NextResponse.json(
        { error: "Images must use direct upload" },
        { status: 400 }
      )
    }

    const Silian_classification = Silian_classifyFile(Silian_derivedMime)
    if (!Silian_classification) {
      return Silian_NextResponse.json(
        { error: "File type not allowed" },
        { status: 400 }
      )
    }

    if (Silian_totalBytes > Silian_classification.maxBytes) {
      const Silian_maxMB = Math.round(Silian_classification.maxBytes / (1024 * 1024))
      return Silian_NextResponse.json(
        { error: `File too large (max ${Silian_maxMB}MB).` },
        { status: 400 }
      )
    }

    const Silian_sanitized = Silian_sanitizeFilename(Silian_filename, Silian_derivedMime)

    const Silian_buffer = Buffer.from(Silian_arrayBuffer)
    const Silian_url = await Silian_uploadFileToGithub(
      Silian_buffer,
      Silian_sanitized,
      Silian_derivedMime,
      Silian_classification.category
    )

    Silian_del(Silian_blobUrl).catch((Silian_err) => {
      console.error("Failed to delete blob:", Silian_err)
    })

    return Silian_NextResponse.json({
      success: true,
      url: Silian_url,
      filename: Silian_sanitized,
      mimeType: Silian_derivedMime,
      fileSize: Silian_totalBytes,
      category: Silian_classification.category,
      proxyable: Silian_classification.proxyable,
    })
  } catch (Silian_error) {
    if (Silian_blobUrl) {
      Silian_del(Silian_blobUrl).catch(() => {})
    }

    if (Silian_error instanceof Silian_GithubFeaturesError) {
      if (Silian_error.code === "CONFIG_MISSING") {
        return Silian_NextResponse.json(
          { error: "Upload not configured." },
          { status: 500 }
        )
      }
      if (Silian_error.code === "AUTH_FAILED") {
        return Silian_NextResponse.json(
          { error: "Upload authorization failed." },
          { status: 403 }
        )
      }
      if (Silian_error.code === "RATE_LIMITED") {
        return Silian_NextResponse.json(
          { error: "Rate limited. Try again shortly." },
          { status: 429 }
        )
      }
    }

    console.error("Commit route error:", Silian_error)
    return Silian_NextResponse.json({ error: "Upload failed." }, { status: 500 })
  }
}
