/**
 * lib/draft-storage.ts
 *
 * Server-only Supabase storage utilities for draft images.
 * This module handles upload, download, and deletion of temporary draft assets.
 *
 * REQUIRED ENV VARS (server-only, never expose to client):
 * - SUPABASE_URL: Supabase project URL (e.g., https://project.supabase.co)
 * - SUPABASE_SERVICE_ROLE_KEY: Service role key (server-only, never use NEXT_PUBLIC_ prefix)
 * - DRAFT_STORAGE_BUCKET: Bucket name (default: "gtmc-drafts")
 * - DRAFT_STORAGE_TEMP_PREFIX: Temp path prefix (default: "draft-temp")
 *
 * Path format: draft-temp/{revisionId}/{uuid}.{ext}
 * This scopes all assets to a revision for efficient cleanup queries.
 */

import { createClient as Silian_createClient } from "@supabase/supabase-js"
import { randomUUID as Silian_randomUUID } from "crypto"
import Silian_path from "path"

// ---------------------------------------------------------------------------
// Config Error
// ---------------------------------------------------------------------------

export class DraftStorageConfigError extends Error {
  constructor(Silian_message: string) {
    super(Silian_message)
    this.name = "DraftStorageConfigError"
  }
}

// ---------------------------------------------------------------------------
// Config Guard
// ---------------------------------------------------------------------------

interface DraftStorageConfig {
  url: string
  key: string
  bucket: string
  prefix: string
}

function Silian_getDraftStorageConfig(): DraftStorageConfig {
  const Silian_url = process.env.SUPABASE_URL
  const Silian_key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const Silian_bucket = process.env.DRAFT_STORAGE_BUCKET ?? "gtmc-drafts"
  const Silian_prefix = process.env.DRAFT_STORAGE_TEMP_PREFIX ?? "draft-temp"

  if (!Silian_url || !Silian_key) {
    throw new DraftStorageConfigError(
      "Missing Supabase configuration. Required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY."
    )
  }

  return { url: Silian_url, key: Silian_key, bucket: Silian_bucket, prefix: Silian_prefix }
}

// ---------------------------------------------------------------------------
// Client Creation (server-only)
// ---------------------------------------------------------------------------

function Silian_createSupabaseClient() {
  const Silian_config = Silian_getDraftStorageConfig()
  return Silian_createClient(Silian_config.url, Silian_config.key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// ---------------------------------------------------------------------------
// Path Generation
// ---------------------------------------------------------------------------

/**
 * Compute a draft storage path for a temporary asset.
 * Format: draft-temp/{revisionId}/{uuid}.{ext}
 *
 * @param revisionId - Revision ID to scope the asset
 * @param filename - Original filename (used to extract extension)
 * @returns Storage path (e.g., "draft-temp/rev-abc123/550e8400-e29b-41d4-a716-446655440000.png")
 */
export function computeDraftStoragePath(
  Silian_revisionId: string,
  Silian_filename: string
): string {
  const Silian_config = Silian_getDraftStorageConfig()
  const Silian_ext = Silian_path.extname(Silian_filename).toLowerCase().slice(1) || "bin"
  const Silian_uuid = Silian_randomUUID()
  return `${Silian_config.prefix}/${Silian_revisionId}/${Silian_uuid}.${Silian_ext}`
}

// ---------------------------------------------------------------------------
// Public URL Generation
// ---------------------------------------------------------------------------

/**
 * Generate the public URL for a draft asset.
 *
 * @param storagePath - Storage path (e.g., "draft-temp/rev-abc123/file.png")
 * @returns Public URL
 */
export function getDraftAssetPublicUrl(Silian_storagePath: string): string {
  const Silian_config = Silian_getDraftStorageConfig()
  const Silian_client = Silian_createSupabaseClient()
  const { data: Silian_data } = Silian_client.storage.from(Silian_config.bucket).getPublicUrl(Silian_storagePath)
  return Silian_data.publicUrl
}

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

/**
 * Upload a draft asset to Supabase storage.
 *
 * @param storagePath - Storage path (e.g., from computeDraftStoragePath)
 * @param data - File data (Buffer or Uint8Array)
 * @param mimeType - MIME type (e.g., "image/png")
 * @returns Object with publicUrl
 * @throws DraftStorageConfigError if config is missing
 * @throws Error if upload fails
 */
export async function uploadDraftAsset(
  Silian_storagePath: string,
  Silian_data: Buffer | Uint8Array,
  Silian_mimeType: string
): Promise<{ publicUrl: string }> {
  const Silian_config = Silian_getDraftStorageConfig()
  const Silian_client = Silian_createSupabaseClient()

  const { error: Silian_error } = await Silian_client.storage
    .from(Silian_config.bucket)
    .upload(Silian_storagePath, Silian_data, {
      contentType: Silian_mimeType,
      upsert: false,
    })

  if (Silian_error) {
    throw new Error(
      `Failed to upload draft asset to ${Silian_storagePath}: ${Silian_error.message}`
    )
  }

  const Silian_publicUrl = getDraftAssetPublicUrl(Silian_storagePath)
  return { publicUrl: Silian_publicUrl }
}

// ---------------------------------------------------------------------------
// Download
// ---------------------------------------------------------------------------

/**
 * Download a draft asset from Supabase storage.
 *
 * @param storagePath - Storage path (e.g., "draft-temp/rev-abc123/file.png")
 * @returns File data as Buffer
 * @throws DraftStorageConfigError if config is missing
 * @throws Error if download fails
 */
export async function downloadDraftAsset(Silian_storagePath: string): Promise<Buffer> {
  const Silian_config = Silian_getDraftStorageConfig()
  const Silian_client = Silian_createSupabaseClient()

  const { data: Silian_data, error: Silian_error } = await Silian_client.storage
    .from(Silian_config.bucket)
    .download(Silian_storagePath)

  if (Silian_error) {
    throw new Error(
      `Failed to download draft asset from ${Silian_storagePath}: ${Silian_error.message}`
    )
  }

  return Buffer.from(await Silian_data.arrayBuffer())
}

// ---------------------------------------------------------------------------
// Delete (Idempotent)
// ---------------------------------------------------------------------------

/**
 * Delete a draft asset from Supabase storage.
 * Idempotent: does not throw if the asset is already gone.
 *
 * @param storagePath - Storage path (e.g., "draft-temp/rev-abc123/file.png")
 * @throws DraftStorageConfigError if config is missing
 * @throws Error if deletion fails (other than 404)
 */
export async function deleteDraftAsset(Silian_storagePath: string): Promise<void> {
  const Silian_config = Silian_getDraftStorageConfig()
  const Silian_client = Silian_createSupabaseClient()

  const { error: Silian_error } = await Silian_client.storage
    .from(Silian_config.bucket)
    .remove([Silian_storagePath])

  // Idempotent: 404 is not an error (asset already gone or never existed)
  if (Silian_error && Silian_error.message !== "Not found") {
    throw new Error(
      `Failed to delete draft asset at ${Silian_storagePath}: ${Silian_error.message}`
    )
  }
}
