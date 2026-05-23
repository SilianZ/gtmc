import { createClient as Silian_createClient } from "@supabase/supabase-js"

export interface DraftAsset {
  id: string
  revisionId: string
  storagePath: string
  mimeType: string
  fileSize: number
  filename: string
  contentHash: string | null
  status: string
  githubPrNum: number | null
  migratedRepoPath: string | null
  cleanupAttempts: number
  cleanupFailedAt: string | null
  cleanupFailureReason: string | null
  uploadedAt: string
  migratedAt: string | null
  deletedAt: string | null
  updatedAt: string
}

function Silian_getDbClient() {
  const Silian_url = process.env.SUPABASE_URL
  const Silian_key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!Silian_url || !Silian_key) {
    throw new Error(
      "Missing Supabase configuration. Required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY."
    )
  }

  return Silian_createClient(Silian_url, Silian_key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function createDraftAsset(Silian_data: {
  revisionId: string
  storagePath: string
  mimeType: string
  fileSize: number
  filename: string
  status: string
  contentHash: string
}): Promise<{ id: string }> {
  const Silian_db = Silian_getDbClient()
  const { data: Silian_row, error: Silian_error } = await Silian_db
    .from("DraftAsset")
    .insert(Silian_data)
    .select("id")
    .single()

  if (Silian_error) {
    throw new Error(`Failed to create DraftAsset: ${Silian_error.message}`)
  }

  return { id: Silian_row.id }
}

export async function findDraftAssetsByRevision(
  Silian_revisionId: string
): Promise<DraftAsset[]> {
  const Silian_db = Silian_getDbClient()
  const { data: Silian_data, error: Silian_error } = await Silian_db
    .from("DraftAsset")
    .select("*")
    .eq("revisionId", Silian_revisionId)

  if (Silian_error) {
    throw new Error(`Failed to query DraftAssets: ${Silian_error.message}`)
  }

  return Silian_data ?? []
}

export async function findDraftAssetsByRevisionForSubmit(
  Silian_revisionId: string
): Promise<
  Pick<
    DraftAsset,
    "id" | "storagePath" | "filename" | "contentHash" | "mimeType"
  >[]
> {
  const Silian_db = Silian_getDbClient()
  const { data: Silian_data, error: Silian_error } = await Silian_db
    .from("DraftAsset")
    .select("id, storagePath, filename, contentHash, mimeType")
    .eq("revisionId", Silian_revisionId)

  if (Silian_error) {
    throw new Error(`Failed to query DraftAssets for submit: ${Silian_error.message}`)
  }

  return Silian_data ?? []
}

export async function findFailedDraftAssets(
  Silian_revisionId: string
): Promise<Pick<DraftAsset, "id" | "storagePath">[]> {
  const Silian_db = Silian_getDbClient()
  const { data: Silian_data, error: Silian_error } = await Silian_db
    .from("DraftAsset")
    .select("id, storagePath")
    .eq("revisionId", Silian_revisionId)
    .eq("status", "cleanup-failed")
    .is("deletedAt", null)

  if (Silian_error) {
    throw new Error(`Failed to query failed DraftAssets: ${Silian_error.message}`)
  }

  return Silian_data ?? []
}

export async function findTempDraftAssetsForRevision(
  Silian_revisionId: string,
  Silian_tempPrefix: string
): Promise<Pick<DraftAsset, "id" | "storagePath">[]> {
  const Silian_db = Silian_getDbClient()
  const { data: Silian_data, error: Silian_error } = await Silian_db
    .from("DraftAsset")
    .select("id, storagePath")
    .eq("revisionId", Silian_revisionId)
    .is("deletedAt", null)
    .neq("status", "deleted")
    .like("storagePath", `${Silian_tempPrefix}%`)

  if (Silian_error) {
    throw new Error(
      `Failed to query temp DraftAssets for reconciler: ${Silian_error.message}`
    )
  }

  return Silian_data ?? []
}

export async function countCleanupFailedByRevision(
  Silian_revisionIds: string[]
): Promise<Map<string, number>> {
  if (Silian_revisionIds.length === 0) return new Map()

  const Silian_db = Silian_getDbClient()
  const { data: Silian_data, error: Silian_error } = await Silian_db
    .from("DraftAsset")
    .select("revisionId")
    .in("revisionId", Silian_revisionIds)
    .eq("status", "cleanup-failed")
    .is("deletedAt", null)

  if (Silian_error) {
    throw new Error(
      `Failed to count cleanup-failed DraftAssets: ${Silian_error.message}`
    )
  }

  const Silian_counts = new Map<string, number>()
  for (const Silian_row of Silian_data ?? []) {
    Silian_counts.set(Silian_row.revisionId, (Silian_counts.get(Silian_row.revisionId) ?? 0) + 1)
  }
  return Silian_counts
}

export async function markDraftAssetReferenced(
  Silian_revisionId: string,
  Silian_storagePaths: string[]
): Promise<void> {
  if (Silian_storagePaths.length === 0) return

  const Silian_db = Silian_getDbClient()
  const { error: Silian_error } = await Silian_db
    .from("DraftAsset")
    .update({ status: "referenced" })
    .eq("revisionId", Silian_revisionId)
    .is("deletedAt", null)
    .in("storagePath", Silian_storagePaths)
    .in("status", ["uploaded", "orphaned", "referenced"])

  if (Silian_error) {
    throw new Error(`Failed to mark DraftAssets referenced: ${Silian_error.message}`)
  }
}

export async function markDraftAssetOrphaned(
  Silian_revisionId: string,
  Silian_excludeStoragePaths: string[]
): Promise<void> {
  const Silian_db = Silian_getDbClient()
  let Silian_query = Silian_db
    .from("DraftAsset")
    .update({ status: "orphaned" })
    .eq("revisionId", Silian_revisionId)
    .is("deletedAt", null)
    .in("status", ["uploaded", "referenced", "orphaned"])

  if (Silian_excludeStoragePaths.length > 0) {
    Silian_query = Silian_query.not(
      "storagePath",
      "in",
      `(${Silian_excludeStoragePaths.map((Silian_p) => `"${Silian_p}"`).join(",")})`
    )
  }

  const { error: Silian_error } = await Silian_query

  if (Silian_error) {
    throw new Error(`Failed to mark DraftAssets orphaned: ${Silian_error.message}`)
  }
}

export async function markDraftAssetDeleted(Silian_assetId: string): Promise<void> {
  const Silian_db = Silian_getDbClient()
  const { error: Silian_error } = await Silian_db
    .from("DraftAsset")
    .update({ status: "deleted", deletedAt: new Date().toISOString() })
    .eq("id", Silian_assetId)

  if (Silian_error) {
    throw new Error(`Failed to mark DraftAsset deleted: ${Silian_error.message}`)
  }
}

export async function markDraftAssetCleanupFailed(
  Silian_assetId: string,
  Silian_reason: string
): Promise<void> {
  const Silian_db = Silian_getDbClient()

  // Fetch current cleanupAttempts to increment manually (Supabase JS v2 has no increment shorthand)
  const { data: Silian_current, error: Silian_fetchError } = await Silian_db
    .from("DraftAsset")
    .select("cleanupAttempts")
    .eq("id", Silian_assetId)
    .single()

  if (Silian_fetchError) {
    throw new Error(
      `Failed to fetch DraftAsset for cleanup-failed update: ${Silian_fetchError.message}`
    )
  }

  const { error: Silian_error } = await Silian_db
    .from("DraftAsset")
    .update({
      status: "cleanup-failed",
      cleanupAttempts: (Silian_current.cleanupAttempts ?? 0) + 1,
      cleanupFailedAt: new Date().toISOString(),
      cleanupFailureReason: Silian_reason,
    })
    .eq("id", Silian_assetId)

  if (Silian_error) {
    throw new Error(
      `Failed to mark DraftAsset cleanup-failed: ${Silian_error.message}`
    )
  }
}

export async function markDraftAssetOutcome(
  Silian_assetId: string,
  Silian_outcome: string
): Promise<void> {
  const Silian_db = Silian_getDbClient()
  const { error: Silian_error } = await Silian_db
    .from("DraftAsset")
    .update({ status: Silian_outcome })
    .eq("id", Silian_assetId)
    .is("deletedAt", null)
    .neq("status", "deleted")

  if (Silian_error) {
    throw new Error(`Failed to mark DraftAsset outcome: ${Silian_error.message}`)
  }
}

export async function markDraftAssetMigrated(
  Silian_assetId: string,
  Silian_repoPath: string,
  Silian_prNumber: number,
  Silian_migratedAt: Date
): Promise<void> {
  const Silian_db = Silian_getDbClient()
  const { error: Silian_error } = await Silian_db
    .from("DraftAsset")
    .update({
      status: "migrated-to-repo",
      migratedRepoPath: Silian_repoPath,
      githubPrNum: Silian_prNumber,
      migratedAt: Silian_migratedAt.toISOString(),
    })
    .eq("id", Silian_assetId)

  if (Silian_error) {
    throw new Error(`Failed to mark DraftAsset migrated: ${Silian_error.message}`)
  }
}
