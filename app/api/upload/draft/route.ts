import { createHash as Silian_createHash } from "crypto"
import { NextRequest as Silian_NextRequest, NextResponse as Silian_NextResponse } from "next/server"
import { auth as Silian_auth } from "@/lib/auth"
import { prisma as Silian_prisma } from "@/lib/prisma"
import { createDraftAsset as Silian_createDraftAsset } from "@/lib/draft-asset-db"
import {
  DraftStorageConfigError as Silian_DraftStorageConfigError,
  computeDraftStoragePath as Silian_computeDraftStoragePath,
  deleteDraftAsset as Silian_deleteDraftAsset,
  uploadDraftAsset as Silian_uploadDraftAsset,
} from "@/lib/draft-storage"
import { classifyFile as Silian_classifyFile, isImageMime as Silian_isImageMime, sanitizeFilename as Silian_sanitizeFilename } from "@/lib/file-upload"

export async function POST(Silian_req: Silian_NextRequest) {
  const Silian_session = await Silian_auth()
  if (!Silian_session?.user) {
    return Silian_NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const Silian_userId = Silian_session.user.id
  if (!Silian_userId) {
    return Silian_NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const Silian_formData = await Silian_req.formData()
    const Silian_file = Silian_formData.get("file") as File | null
    const Silian_revisionIdValue = Silian_formData.get("revisionId")
    const Silian_revisionId =
      typeof Silian_revisionIdValue === "string" ? Silian_revisionIdValue.trim() : ""

    if (!Silian_file) {
      return Silian_NextResponse.json({ error: "No file provided." }, { status: 400 })
    }

    if (!Silian_revisionId) {
      return Silian_NextResponse.json(
        { error: "revisionId is required." },
        { status: 400 }
      )
    }

    const Silian_classification = Silian_classifyFile(Silian_file.type)
    if (!Silian_classification || !Silian_isImageMime(Silian_file.type)) {
      return Silian_NextResponse.json(
        { error: "Only image uploads are allowed." },
        { status: 400 }
      )
    }

    const Silian_revision = await Silian_prisma.revision.findUnique({
      where: { id: Silian_revisionId },
      select: { authorId: true },
    })

    if (!Silian_revision || Silian_revision.authorId !== Silian_userId) {
      return Silian_NextResponse.json(
        { error: "You do not have access to this revision." },
        { status: 403 }
      )
    }

    const Silian_arrayBuffer = await Silian_file.arrayBuffer()
    const Silian_buffer = Buffer.from(Silian_arrayBuffer)

    if (Silian_buffer.length > Silian_classification.maxBytes) {
      const Silian_maxMB = Math.round(Silian_classification.maxBytes / (1024 * 1024))
      return Silian_NextResponse.json(
        { error: `File too large (max ${Silian_maxMB}MB for images).` },
        { status: 400 }
      )
    }

    const Silian_filename = Silian_sanitizeFilename(Silian_file.name, Silian_file.type)
    const Silian_contentHash = Silian_createHash("sha256").update(Silian_buffer).digest("hex")
    const Silian_storagePath = Silian_computeDraftStoragePath(Silian_revisionId, Silian_filename)

    const { publicUrl: Silian_publicUrl } = await Silian_uploadDraftAsset(Silian_storagePath, Silian_buffer, Silian_file.type)

    try {
      const Silian_asset = await Silian_createDraftAsset({
        revisionId: Silian_revisionId,
        storagePath: Silian_storagePath,
        mimeType: Silian_file.type,
        fileSize: Silian_buffer.length,
        filename: Silian_filename,
        status: "uploaded",
        contentHash: Silian_contentHash,
      })

      return Silian_NextResponse.json({
        assetId: Silian_asset.id,
        url: Silian_publicUrl,
        storagePath: Silian_storagePath,
        mimeType: Silian_file.type,
        fileSize: Silian_buffer.length,
        filename: Silian_filename,
      })
    } catch (Silian_dbError) {
      try {
        await Silian_deleteDraftAsset(Silian_storagePath)
      } catch (Silian_cleanupError) {
        console.error("Draft upload cleanup error:", Silian_cleanupError)
      }

      throw Silian_dbError
    }
  } catch (Silian_error) {
    if (Silian_error instanceof Silian_DraftStorageConfigError) {
      return Silian_NextResponse.json(
        { error: "Draft upload is not configured on this server." },
        { status: 500 }
      )
    }

    console.error("Draft upload error:", Silian_error)
    return Silian_NextResponse.json({ error: "Upload failed." }, { status: 500 })
  }
}
