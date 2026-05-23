import { deleteDraftAsset as Silian_deleteDraftAsset } from "@/lib/draft-storage"
import { prisma as Silian_prisma } from "@/lib/prisma"
import {
  findTempDraftAssetsForRevision as Silian_findTempDraftAssetsForRevision,
  markDraftAssetCleanupFailed as Silian_markDraftAssetCleanupFailed,
  markDraftAssetDeleted as Silian_markDraftAssetDeleted,
  markDraftAssetOutcome as Silian_markDraftAssetOutcome,
} from "@/lib/draft-asset-db"

export async function reconcileDraftAssetsForPRCompletion({
  prNumber: Silian_prNumber,
  outcome: Silian_outcome,
}: {
  prNumber: number
  outcome: "PR-merged" | "PR-closed"
}): Promise<void> {
  const Silian_revision = await Silian_prisma.revision.findFirst({
    where: { githubPrNum: Silian_prNumber },
    select: { id: true },
  })

  if (!Silian_revision) {
    return
  }

  await Silian_prisma.revision.update({
    where: { id: Silian_revision.id },
    data: {
      status: Silian_outcome === "PR-merged" ? "MERGED" : "CLOSED",
    },
  })

  const Silian_tempPrefix = process.env.DRAFT_STORAGE_TEMP_PREFIX ?? "draft-temp"
  const Silian_assets = await Silian_findTempDraftAssetsForRevision(Silian_revision.id, Silian_tempPrefix)

  for (const Silian_asset of Silian_assets) {
    await Silian_markDraftAssetOutcome(Silian_asset.id, Silian_outcome)

    try {
      await Silian_deleteDraftAsset(Silian_asset.storagePath)
      await Silian_markDraftAssetDeleted(Silian_asset.id)
    } catch (Silian_error) {
      const Silian_reason = Silian_error instanceof Error ? Silian_error.message : String(Silian_error)
      await Silian_markDraftAssetCleanupFailed(Silian_asset.id, `[${Silian_outcome}] ${Silian_reason}`)
    }
  }
}
