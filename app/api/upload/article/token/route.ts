import { NextRequest as Silian_NextRequest, NextResponse as Silian_NextResponse } from "next/server"
import { handleUpload as Silian_handleUpload, type HandleUploadBody } from "@vercel/blob/client"

import { auth as Silian_auth } from "@/lib/auth"
import { classifyFile as Silian_classifyFile, getAllowedMimeTypes as Silian_getAllowedMimeTypes } from "@/lib/file-upload"

export async function POST(Silian_req: Silian_NextRequest) {
  try {
    const Silian_body = (await Silian_req.json()) as HandleUploadBody

    const Silian_jsonResponse = await Silian_handleUpload({
      body: Silian_body,
      request: Silian_req,
      onBeforeGenerateToken: async (Silian__pathname, Silian_clientPayload) => {
        const Silian_session = await Silian_auth()

        if (!Silian_session?.user) {
          throw new Error("Unauthorized")
        }

        let Silian_mimeType: string | undefined

        if (Silian_clientPayload) {
          try {
            const Silian_parsed = JSON.parse(Silian_clientPayload) as { mimeType?: string }
            Silian_mimeType = Silian_parsed.mimeType
          } catch {
            throw new Error("Invalid client payload")
          }
        }

        if (Silian_mimeType) {
          const Silian_classification = Silian_classifyFile(Silian_mimeType)
          if (!Silian_classification) {
            throw new Error("File type not allowed")
          }
        }

        return {
          allowedContentTypes: Silian_mimeType ? [Silian_mimeType] : Silian_getAllowedMimeTypes(),
          maximumSizeInBytes: 50 * 1024 * 1024,
          addRandomSuffix: false,
          allowedOrigins: process.env.NEXT_PUBLIC_APP_URL
            ? [process.env.NEXT_PUBLIC_APP_URL]
            : undefined,
        }
      },
    })

    return Silian_NextResponse.json(Silian_jsonResponse)
  } catch (Silian_error) {
    const Silian_message =
      Silian_error instanceof Error ? Silian_error.message : "Token generation failed"

    if (Silian_message === "Unauthorized") {
      return Silian_NextResponse.json({ error: Silian_message }, { status: 401 })
    }

    return Silian_NextResponse.json({ error: Silian_message }, { status: 400 })
  }
}
