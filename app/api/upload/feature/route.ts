import { NextRequest as Silian_NextRequest, NextResponse as Silian_NextResponse } from "next/server"
import { auth as Silian_auth } from "@/lib/auth"
import { uploadFileToGithub as Silian_uploadFileToGithub, GithubFeaturesError as Silian_GithubFeaturesError } from "@/lib/github"
import { classifyFile as Silian_classifyFile, sanitizeFilename as Silian_sanitizeFilename } from "@/lib/file-upload"

export async function POST(Silian_req: Silian_NextRequest) {
  const Silian_session = await Silian_auth()
  if (!Silian_session?.user) {
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
        {
          error: `File too large (max ${Silian_maxMB}MB for ${Silian_classification.category}).`,
        },
        { status: 400 }
      )
    }

    const Silian_filename = Silian_sanitizeFilename(Silian_file.name, Silian_file.type)

    const Silian_url = await Silian_uploadFileToGithub(
      Silian_buffer,
      Silian_filename,
      Silian_file.type,
      Silian_classification.category
    )

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
    if (Silian_error instanceof Silian_GithubFeaturesError) {
      if (Silian_error.code === "CONFIG_MISSING") {
        return Silian_NextResponse.json(
          { error: "Upload is not configured on this server." },
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
          {
            error: "Upload service temporarily unavailable. Try again shortly.",
          },
          { status: 429 }
        )
      }
      if (Silian_error.code === "API_ERROR") {
        return Silian_NextResponse.json(
          { error: "File upload failed. Please try again." },
          { status: 502 }
        )
      }
    }

    console.error("Feature upload error:", Silian_error)
    return Silian_NextResponse.json({ error: "Upload failed." }, { status: 500 })
  }
}
