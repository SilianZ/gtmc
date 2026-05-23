import { NextRequest as Silian_NextRequest, NextResponse as Silian_NextResponse } from "next/server"

import { auth as Silian_auth } from "@/lib/auth"
import { getGithubPatForUser as Silian_getGithubPatForUser } from "@/lib/auth-context"
import { classifyFile as Silian_classifyFile, sanitizeFilename as Silian_sanitizeFilename } from "@/lib/file-upload"
import {
  uploadArticleAssetToGithub as Silian_uploadArticleAssetToGithub,
  ArticleAssetUploadError as Silian_ArticleAssetUploadError,
} from "@/lib/github/articles-assets"

export async function POST(Silian_req: Silian_NextRequest) {
  const Silian_session = await Silian_auth()

  if (!Silian_session?.user?.id) {
    return Silian_NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const Silian_formData = await Silian_req.formData()
    const Silian_file = Silian_formData.get("file") as File | null

    if (!Silian_file) {
      return Silian_NextResponse.json({ error: "No file provided." }, { status: 400 })
    }

    const Silian_classification = Silian_classifyFile(Silian_file.type)
    if (!Silian_classification) {
      return Silian_NextResponse.json(
        { error: "File type not allowed." },
        { status: 400 }
      )
    }

    const Silian_arrayBuffer = await Silian_file.arrayBuffer()
    const Silian_buffer = Buffer.from(Silian_arrayBuffer)

    if (Silian_buffer.length > Silian_classification.maxBytes) {
      const Silian_maxMB = Math.round(Silian_classification.maxBytes / (1024 * 1024))
      return Silian_NextResponse.json(
        { error: `File too large (max ${Silian_maxMB}MB).` },
        { status: 400 }
      )
    }

    const Silian_filename = Silian_sanitizeFilename(Silian_file.name, Silian_file.type)
    const Silian_url = await Silian_uploadArticleAssetToGithub({
      buffer: Silian_buffer,
      category: Silian_classification.category,
      filename: Silian_filename,
      token: (await Silian_getGithubPatForUser(Silian_session.user.id)) ?? null,
    })

    return Silian_NextResponse.json({
      success: true,
      url: Silian_url,
      filename: Silian_filename,
      mimeType: Silian_file.type,
      fileSize: Silian_buffer.length,
      category: Silian_classification.category,
      proxyable: Silian_classification.proxyable,
    })
  } catch (Silian_error) {
    if (Silian_error instanceof Silian_ArticleAssetUploadError) {
      if (Silian_error.code === "CONFIG_MISSING") {
        return Silian_NextResponse.json({ error: Silian_error.message }, { status: 500 })
      }

      if (Silian_error.code === "AUTH_FAILED") {
        return Silian_NextResponse.json({ error: Silian_error.message }, { status: 403 })
      }

      return Silian_NextResponse.json({ error: Silian_error.message }, { status: 502 })
    }

    console.error("Article upload error:", Silian_error)
    return Silian_NextResponse.json({ error: "Upload failed." }, { status: 500 })
  }
}
