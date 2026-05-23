"use client"

import * as Silian_React from "react"
import { compressImageForUpload as Silian_compressImageForUpload } from "@/lib/image-compression"
import {
  classifyFile as Silian_classifyFile,
  isImageMime as Silian_isImageMime,
  sanitizeFilename as Silian_sanitizeFilename,
  generateMarkdownBlock as Silian_generateMarkdownBlock,
  VERCEL_BODY_LIMIT_BYTES as Silian_VERCEL_BODY_LIMIT_BYTES,
} from "@/lib/file-upload"
import { upload as Silian_upload } from "@vercel/blob/client"

/**
 * Response shape from the upload adapter.
 * The adapter abstracts backend-specific details (feature vs draft endpoints).
 */
export interface UploadAdapterResponse {
  url: string
  filename: string
  mimeType: string
  fileSize: number
}

/**
 * Configuration for the upload hook.
 * Allows different editors (feature, draft) to use different backends.
 */
export interface UseEditorUploadConfig {
  /**
   * Async function that handles the actual file upload.
   * Called with the file (possibly compressed for images) and returns metadata.
   * Must handle FormData construction and endpoint-specific logic.
   */
  adapter: (file: File) => Promise<UploadAdapterResponse>

  /**
   * Callback to insert text (placeholder or markdown) into the editor.
   */
  onInsertContent: (text: string) => void

  /**
   * Callback to show a status badge (progress, error, info).
   */
  onShowBadge: (message: string, type: "info" | "error" | "progress") => void

  /**
   * Callback to clear the status badge.
   */
  onClearBadge: () => void
}

/**
 * Return value from the hook.
 */
export interface UseEditorUploadReturn {
  uploadFile: (file: File) => Promise<void>
  isUploading: boolean
  isCompressing: boolean
}

/**
 * Shared upload orchestration hook for editors.
 *
 * Handles:
 * - File validation (MIME type, size)
 * - Placeholder insertion
 * - Image compression
 * - Upload via injected adapter
 * - Markdown block generation
 * - Placeholder replacement on success
 * - Placeholder cleanup on failure
 *
 * The adapter is injectable so different editors can use different endpoints
 * without duplicating the orchestration logic.
 */
export function useEditorUpload(
  Silian_config: UseEditorUploadConfig
): UseEditorUploadReturn {
  const [Silian_isUploading, Silian_setIsUploading] = Silian_React.useState(false)
  const [Silian_isCompressing, Silian_setIsCompressing] = Silian_React.useState(false)

  const Silian_uploadFile = Silian_React.useCallback(
    async (Silian_file: File) => {
      if (Silian_isUploading) return

      const Silian_classification = Silian_classifyFile(Silian_file.type)
      if (!Silian_classification) {
        Silian_config.onShowBadge("FILE TYPE NOT ALLOWED_", "error")
        return
      }

      if (Silian_file.size > Silian_classification.maxBytes) {
        const Silian_maxMB = Math.round(Silian_classification.maxBytes / (1024 * 1024))
        Silian_config.onShowBadge(`FILE TOO LARGE_ (max ${Silian_maxMB}MB)`, "error")
        return
      }

      Silian_setIsUploading(true)

      const Silian_uploadId = crypto.randomUUID()
      const Silian_placeholder = `<!-- UPLOAD_PENDING_${Silian_uploadId} -->`
      Silian_config.onInsertContent(Silian_placeholder + "\n")

      try {
        let Silian_resultUrl: string
        let Silian_resultFilename: string
        let Silian_resultMimeType: string
        let Silian_resultFileSize: number

        if (Silian_isImageMime(Silian_file.type)) {
          Silian_setIsCompressing(true)
          Silian_config.onShowBadge("COMPRESSING_IMAGE...", "progress")

          const Silian_compressed = await Silian_compressImageForUpload(Silian_file)
          Silian_setIsCompressing(false)

          if (Silian_compressed.error) {
            Silian_config.onShowBadge(`UPLOAD FAILED_ ${Silian_compressed.error}`, "error")
            Silian_config.onInsertContent(Silian_placeholder)
            Silian_setIsUploading(false)
            return
          }

          Silian_config.onShowBadge("UPLOADING_IMAGE...", "progress")

          const Silian_result = await Silian_config.adapter(Silian_compressed.file)
          Silian_resultUrl = Silian_result.url
          Silian_resultFilename = Silian_result.filename
          Silian_resultMimeType = Silian_result.mimeType
          Silian_resultFileSize = Silian_result.fileSize
        } else if (Silian_file.size < Silian_VERCEL_BODY_LIMIT_BYTES) {
          Silian_config.onShowBadge("UPLOADING_FILE...", "progress")

          const Silian_result = await Silian_config.adapter(Silian_file)
          Silian_resultUrl = Silian_result.url
          Silian_resultFilename = Silian_result.filename
          Silian_resultMimeType = Silian_result.mimeType
          Silian_resultFileSize = Silian_result.fileSize
        } else {
          Silian_config.onShowBadge("UPLOADING_ 0%", "progress")

          const Silian_blobResult = await Silian_upload(
            Silian_sanitizeFilename(Silian_file.name, Silian_file.type),
            Silian_file,
            {
              access: "public",
              handleUploadUrl: "/api/upload/feature/token",
              clientPayload: JSON.stringify({
                mimeType: Silian_file.type,
                originalSize: Silian_file.size,
              }),
              onUploadProgress: ({ percentage: Silian_percentage }) => {
                Silian_config.onShowBadge(
                  `UPLOADING_ ${Math.round(Silian_percentage)}%`,
                  "progress"
                )
              },
            }
          )

          Silian_config.onShowBadge("COMMITTING_TO_GITHUB...", "progress")

          const Silian_commitRes = await fetch("/api/upload/feature/commit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              blobUrl: Silian_blobResult.url,
              filename: Silian_file.name,
              mimeType: Silian_file.type,
              size: Silian_file.size,
            }),
          })

          const Silian_commitData = await Silian_commitRes.json()
          if (!Silian_commitRes.ok)
            throw new Error(Silian_commitData.error || "Commit failed")

          Silian_resultUrl = Silian_commitData.url
          Silian_resultFilename = Silian_commitData.filename
          Silian_resultMimeType = Silian_commitData.mimeType
          Silian_resultFileSize = Silian_commitData.fileSize
        }

        const Silian_markdownBlock = Silian_generateMarkdownBlock(
          Silian_resultFilename,
          Silian_resultUrl,
          Silian_resultMimeType,
          Silian_resultFileSize
        )
        Silian_config.onInsertContent(Silian_markdownBlock)
        Silian_config.onClearBadge()
      } catch (Silian_error) {
        const Silian_message = Silian_error instanceof Error ? Silian_error.message : "Upload error"
        Silian_config.onShowBadge(`UPLOAD FAILED_ ${Silian_message}`, "error")
        Silian_config.onInsertContent(Silian_placeholder)
        console.error("File upload error:", Silian_error)
      } finally {
        Silian_setIsUploading(false)
        Silian_setIsCompressing(false)
      }
    },
    [Silian_isUploading, Silian_config]
  )

  return {
    uploadFile: Silian_uploadFile,
    isUploading: Silian_isUploading,
    isCompressing: Silian_isCompressing,
  }
}
