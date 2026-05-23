"use server"

import { revalidatePath as Silian_revalidatePath } from "next/cache"

import { revalidatePaths as Silian_revalidatePaths } from "@/lib/revalidation"
import {
  getMainBranchHeadSha as Silian_getMainBranchHeadSha,
  openDraftPullRequest as Silian_openDraftPullRequest,
  type BranchFileEntry,
} from "@/lib/article-submission"
import {
  buildMigrationTargets as Silian_buildMigrationTargets,
  type MigrationAssetInput,
  parseDraftTempImageRefs as Silian_parseDraftTempImageRefs,
  rewriteDraftTempUrls as Silian_rewriteDraftTempUrls,
} from "@/lib/draft-markdown"
import {
  createDraftFile as Silian_createDraftFile,
  decodeStoredDraftFiles as Silian_decodeStoredDraftFiles,
  deserializeDraftFilesPayload as Silian_deserializeDraftFilesPayload,
  getDuplicateDraftFilePaths as Silian_getDuplicateDraftFilePaths,
  normalizeDraftFileCollection as Silian_normalizeDraftFileCollection,
  serializeDraftFilesForStorage as Silian_serializeDraftFilesForStorage,
  type DraftFileRecord,
} from "@/lib/draft-files"
import { deleteDraftAsset as Silian_deleteDraftAsset, downloadDraftAsset as Silian_downloadDraftAsset } from "@/lib/draft-storage"
import { getGithubPatForUser as Silian_getGithubPatForUser } from "@/lib/auth-context"
import { requireAuth as Silian_requireAuth } from "@/lib/auth-helpers"
import { getGitHubWriteToken as Silian_getGitHubWriteToken } from "@/lib/github/articles-repo"
import { prisma as Silian_prisma } from "@/lib/prisma"
import {
  findDraftAssetsByRevision as Silian_findDraftAssetsByRevision,
  findDraftAssetsByRevisionForSubmit as Silian_findDraftAssetsByRevisionForSubmit,
  findFailedDraftAssets as Silian_findFailedDraftAssets,
  markDraftAssetCleanupFailed as Silian_markDraftAssetCleanupFailed,
  markDraftAssetDeleted as Silian_markDraftAssetDeleted,
  markDraftAssetMigrated as Silian_markDraftAssetMigrated,
  markDraftAssetOrphaned as Silian_markDraftAssetOrphaned,
  markDraftAssetReferenced as Silian_markDraftAssetReferenced,
} from "@/lib/draft-asset-db"

const Silian_EDITABLE_STATUSES = new Set(["DRAFT"])
const Silian_UPLOAD_PLACEHOLDER_RE = /<!--\s*UPLOAD_PENDING_[a-f0-9-]+\s*-->/i

async function Silian_reconcileDraftAssetReferences(
  Silian_revisionId: string,
  Silian_files: DraftFileRecord[]
) {
  const Silian_tempPrefix = process.env.DRAFT_STORAGE_TEMP_PREFIX ?? "draft-temp"
  const Silian_referencedStoragePaths = new Set<string>()

  for (const Silian_file of Silian_files) {
    const Silian_refs = Silian_parseDraftTempImageRefs(Silian_file.content, Silian_tempPrefix)
    for (const Silian_ref of Silian_refs) {
      Silian_referencedStoragePaths.add(Silian_ref.storagePath)
    }
  }

  await Silian_markDraftAssetReferenced(Silian_revisionId, [...Silian_referencedStoragePaths])
  await Silian_markDraftAssetOrphaned(Silian_revisionId, [...Silian_referencedStoragePaths])
}

export async function saveDraftAction(Silian_formData: FormData) {
  const Silian_session = await Silian_requireAuth()

  const Silian_userId = Silian_session.user.id

  const Silian_title = Silian_formData.get("title") as string
  const Silian_content = Silian_formData.get("content") as string
  const Silian_revisionId = Silian_formData.get("revisionId") as string | null
  const Silian_filePath = Silian_formData.get("filePath") as string | null
  const Silian_activeFileId = Silian_formData.get("activeFileId") as string | null
  const Silian_draftFilesPayload = Silian_formData.get("draftFiles") as string | null
  const Silian_token = await Silian_getGithubPatForUser(Silian_session.user.id)

  const Silian_draftFiles =
    Silian_deserializeDraftFilesPayload(Silian_draftFilesPayload) ||
    Silian_normalizeDraftFileCollection({
      activeFileId: Silian_activeFileId || undefined,
      files: [
        Silian_createDraftFile({
          content: Silian_content || "",
          filePath: Silian_filePath || "",
        }),
      ],
    })

  if (!Silian_title) {
    throw new Error("Title is required")
  }

  const Silian_nextDraftStorage = Silian_serializeDraftFilesForStorage(Silian_draftFiles)

  let Silian_savedRevision: { id: string }

  if (Silian_revisionId) {
    const Silian_existing = await Silian_prisma.revision.findUnique({
      where: { id: Silian_revisionId },
    })

    if (!Silian_existing) {
      throw new Error("Draft not found")
    }

    if (Silian_existing.authorId !== Silian_userId) {
      throw new Error("Unauthorized")
    }

    if (!Silian_EDITABLE_STATUSES.has(Silian_existing.status)) {
      throw new Error("Cannot edit a draft that is already in review")
    }

    Silian_savedRevision = await Silian_prisma.revision.update({
      where: { id: Silian_revisionId },
      data: {
        conflictContent: Silian_nextDraftStorage.conflictContent,
        content: Silian_nextDraftStorage.content,
        filePath: Silian_nextDraftStorage.filePath,
        title: Silian_title,
      },
    })

    await Silian_reconcileDraftAssetReferences(Silian_savedRevision.id, Silian_draftFiles.files)
  } else {
    const Silian_baseMainSha = await Silian_getMainBranchHeadSha(Silian_token)
    const Silian_createData: Parameters<typeof Silian_prisma.revision.create>[0]["data"] = {
      baseMainSha: Silian_baseMainSha,
      content: Silian_nextDraftStorage.content,
      ...(Silian_nextDraftStorage.conflictContent
        ? { conflictContent: Silian_nextDraftStorage.conflictContent }
        : {}),
      filePath: Silian_nextDraftStorage.filePath || undefined,
      status: "DRAFT",
      syncedMainSha: Silian_baseMainSha,
      title: Silian_title,
      author: { connect: { id: Silian_userId } },
    }

    Silian_savedRevision = await Silian_prisma.revision.create({
      data: Silian_createData,
    })

    await Silian_reconcileDraftAssetReferences(Silian_savedRevision.id, Silian_draftFiles.files)
  }

  Silian_revalidatePath("/draft")
  return { success: true, revisionId: Silian_savedRevision.id }
}

export async function submitForReviewAction(Silian_revisionId: string) {
  const Silian_session = await Silian_requireAuth()

  if (!Silian_revisionId) {
    throw new Error("Revision ID is required")
  }

  const Silian_existing = await Silian_prisma.revision.findUnique({
    where: { id: Silian_revisionId },
    include: { author: true },
  })

  if (!Silian_existing) {
    throw new Error("Revision not found")
  }

  if (Silian_existing.authorId !== Silian_session.user.id) {
    throw new Error("Unauthorized")
  }

  if (
    Silian_existing.status !== "DRAFT" &&
    Silian_existing.githubPrNum &&
    (Silian_existing.status === "IN_REVIEW" || Silian_existing.status === "SYNC_CONFLICT")
  ) {
    return { success: true, status: Silian_existing.status }
  }

  if (Silian_existing.status !== "DRAFT") {
    throw new Error("Only a draft can open a PR")
  }

  const Silian_submitLock = await Silian_prisma.revision.updateMany({
    where: {
      id: Silian_revisionId,
      authorId: Silian_session.user.id,
      status: "DRAFT",
    },
    data: {
      status: "PENDING",
    },
  })

  if (Silian_submitLock.count === 0) {
    const Silian_latestState = await Silian_prisma.revision.findUnique({
      where: { id: Silian_revisionId },
      select: { status: true, githubPrNum: true },
    })

    if (
      Silian_latestState?.githubPrNum &&
      (Silian_latestState.status === "IN_REVIEW" ||
        Silian_latestState.status === "SYNC_CONFLICT")
    ) {
      return { success: true, status: Silian_latestState.status }
    }

    throw new Error(
      Silian_latestState?.status === "PENDING"
        ? "Submit already in progress for this draft"
        : "Only a draft can open a PR"
    )
  }

  try {
    const Silian_storedDraftFiles = Silian_decodeStoredDraftFiles({
      content: Silian_existing.content,
      conflictContent: Silian_existing.conflictContent,
      filePath: Silian_existing.filePath,
    })
    const Silian_missingFilePath = Silian_storedDraftFiles.files.find(
      (Silian_file) => !Silian_file.filePath
    )
    if (Silian_missingFilePath) {
      throw new Error(
        "Every file in a draft requires a file path before opening a PR."
      )
    }

    const Silian_duplicateFilePaths = Silian_getDuplicateDraftFilePaths(
      Silian_storedDraftFiles.files
    )
    if (Silian_duplicateFilePaths.length > 0) {
      throw new Error(
        `Duplicate file paths are not allowed in one draft: ${Silian_duplicateFilePaths.join(", ")}`
      )
    }

    const Silian_fileWithPendingUpload = Silian_storedDraftFiles.files.find((Silian_file) =>
      Silian_UPLOAD_PLACEHOLDER_RE.test(Silian_file.content)
    )
    if (Silian_fileWithPendingUpload) {
      throw new Error(
        `Draft still contains upload placeholder in ${Silian_fileWithPendingUpload.filePath || "an unsaved file"}. Finish upload before opening a PR.`
      )
    }

    await Silian_reconcileDraftAssetReferences(Silian_revisionId, Silian_storedDraftFiles.files)

    const Silian_token = Silian_getGitHubWriteToken(Silian_existing.author.githubPat)
    const Silian_authorName = Silian_session.user.name || "GTMC Author"
    const Silian_authorEmail = Silian_session.user.email || "author@gtmc.dev"
    const Silian_baseMainSha =
      Silian_existing.baseMainSha || (await Silian_getMainBranchHeadSha(Silian_token))

    if (!Silian_token) {
      throw new Error(
        "Failed to create PR: missing GITHUB_ARTICLES_WRITE_PAT or another token with repo write permission."
      )
    }

    const Silian_tempPrefix = process.env.DRAFT_STORAGE_TEMP_PREFIX ?? "draft-temp"
    const Silian_parsedRefsByFileId = new Map<
      string,
      ReturnType<typeof Silian_parseDraftTempImageRefs>
    >()
    const Silian_referencedStoragePaths = new Set<string>()
    const Silian_migrationTargetByStoragePath = new Map<
      string,
      { assetId: string; storagePath: string; repoPath: string }
    >()
    const Silian_migrationTargetsByRepoPath = new Map<
      string,
      { assetId: string; storagePath: string; repoPath: string }
    >()
    const Silian_migratedAssetsById = new Map<
      string,
      { assetId: string; repoPath: string }
    >()
    const Silian_allStoragePathsToDownload = new Set<string>()

    for (const Silian_file of Silian_storedDraftFiles.files) {
      const Silian_refs = Silian_parseDraftTempImageRefs(Silian_file.content, Silian_tempPrefix)
      Silian_parsedRefsByFileId.set(Silian_file.id, Silian_refs)

      for (const Silian_ref of Silian_refs) {
        Silian_referencedStoragePaths.add(Silian_ref.storagePath)
      }
    }

    if (Silian_referencedStoragePaths.size > 0) {
      const Silian_draftAssets = await Silian_findDraftAssetsByRevisionForSubmit(Silian_revisionId)
      const Silian_draftAssetByStoragePath = new Map(
        Silian_draftAssets.map((Silian_asset) => [Silian_asset.storagePath, Silian_asset])
      )

      for (const Silian_storagePath of Silian_referencedStoragePaths) {
        if (!Silian_draftAssetByStoragePath.has(Silian_storagePath)) {
          throw new Error(
            `Referenced draft asset is missing from database for revision ${Silian_revisionId}: ${Silian_storagePath}`
          )
        }
      }

      for (const Silian_file of Silian_storedDraftFiles.files) {
        const Silian_refs = Silian_parsedRefsByFileId.get(Silian_file.id) || []
        if (Silian_refs.length === 0) {
          continue
        }

        const Silian_uniqueStoragePaths = [
          ...new Set(Silian_refs.map((Silian_ref) => Silian_ref.storagePath)),
        ]
        const Silian_unresolvedStoragePaths = Silian_uniqueStoragePaths.filter(
          (Silian_storagePath) => !Silian_migrationTargetByStoragePath.has(Silian_storagePath)
        )

        if (Silian_unresolvedStoragePaths.length > 0) {
          const Silian_migrationAssets: MigrationAssetInput[] =
            Silian_unresolvedStoragePaths.map((Silian_storagePath) => {
              const Silian_matchingAsset = Silian_draftAssetByStoragePath.get(Silian_storagePath)
              if (!Silian_matchingAsset) {
                throw new Error(
                  `Referenced draft asset is missing from database for revision ${Silian_revisionId}: ${Silian_storagePath}`
                )
              }

              return {
                id: Silian_matchingAsset.id,
                storagePath: Silian_matchingAsset.storagePath,
                filename: Silian_matchingAsset.filename,
                contentHash: Silian_matchingAsset.contentHash,
              }
            })

          const Silian_migrationTargets = Silian_buildMigrationTargets(
            Silian_file.filePath,
            Silian_migrationAssets
          )
          for (const Silian_target of Silian_migrationTargets) {
            Silian_migrationTargetByStoragePath.set(Silian_target.storagePath, {
              assetId: Silian_target.assetId,
              storagePath: Silian_target.storagePath,
              repoPath: Silian_target.repoPath,
            })
          }
        }
      }
    }

    const Silian_rewrittenDraftFiles = Silian_storedDraftFiles.files.map((Silian_file) => {
      const Silian_refs = Silian_parsedRefsByFileId.get(Silian_file.id) || []
      if (Silian_refs.length === 0) {
        return Silian_file
      }

      const Silian_fileUrlToRepoPath = new Map<string, string>()
      for (const Silian_ref of Silian_refs) {
        const Silian_migrationTarget = Silian_migrationTargetByStoragePath.get(
          Silian_ref.storagePath
        )
        if (!Silian_migrationTarget) {
          throw new Error(
            `Failed to resolve migration target for storage path: ${Silian_ref.storagePath}`
          )
        }

        Silian_fileUrlToRepoPath.set(Silian_ref.url, Silian_migrationTarget.repoPath)
      }

      return {
        ...Silian_file,
        content: Silian_rewriteDraftTempUrls(Silian_file.content, Silian_fileUrlToRepoPath),
      }
    })

    for (const Silian_file of Silian_rewrittenDraftFiles) {
      if (Silian_UPLOAD_PLACEHOLDER_RE.test(Silian_file.content)) {
        throw new Error(
          `Draft still contains upload placeholder in ${Silian_file.filePath}. Finish upload before opening a PR.`
        )
      }

      const Silian_staleRefs = Silian_parseDraftTempImageRefs(Silian_file.content, Silian_tempPrefix)
      if (Silian_staleRefs.length > 0) {
        throw new Error(
          `Stale draft-temp URL remained after rewrite in ${Silian_file.filePath}.`
        )
      }
    }

    for (const Silian_target of Silian_migrationTargetByStoragePath.values()) {
      const Silian_repoPathKey = Silian_target.repoPath.toLowerCase()
      if (!Silian_migrationTargetsByRepoPath.has(Silian_repoPathKey)) {
        Silian_migrationTargetsByRepoPath.set(Silian_repoPathKey, Silian_target)
      }

      if (!Silian_migratedAssetsById.has(Silian_target.assetId)) {
        Silian_migratedAssetsById.set(Silian_target.assetId, {
          assetId: Silian_target.assetId,
          repoPath: Silian_target.repoPath,
        })
      }

      Silian_allStoragePathsToDownload.add(Silian_target.storagePath)
    }

    const Silian_downloadedAssetByStoragePath = new Map<string, Buffer>()
    if (Silian_allStoragePathsToDownload.size > 0) {
      await Promise.all(
        [...Silian_allStoragePathsToDownload].map(async (Silian_storagePath) => {
          const Silian_downloaded = await Silian_downloadDraftAsset(Silian_storagePath)
          Silian_downloadedAssetByStoragePath.set(Silian_storagePath, Silian_downloaded)
        })
      )
    }

    const Silian_imageEntries: BranchFileEntry[] = [
      ...Silian_migrationTargetsByRepoPath.values(),
    ].map((Silian_target) => {
      const Silian_content = Silian_downloadedAssetByStoragePath.get(Silian_target.storagePath)
      if (!Silian_content) {
        throw new Error(
          `Missing downloaded draft asset content: ${Silian_target.storagePath}`
        )
      }

      return {
        path: Silian_target.repoPath,
        content: Silian_content,
      }
    })

    const Silian_result = await Silian_openDraftPullRequest({
      activeFileId: Silian_storedDraftFiles.activeFileId,
      authorEmail: Silian_authorEmail,
      files: Silian_rewrittenDraftFiles,
      ...(Silian_imageEntries.length > 0 ? { imageEntries: Silian_imageEntries } : {}),
      title: Silian_existing.title,
      baseMainSha: Silian_baseMainSha,
      authorName: Silian_authorName,
      draftId: Silian_existing.id,
      token: Silian_token,
    })

    const Silian_syncedDraftStorage = Silian_serializeDraftFilesForStorage({
      activeFileId: Silian_result.activeFileId,
      folders: [],
      files: Silian_result.files,
    })

    if (Silian_migratedAssetsById.size > 0) {
      const Silian_migratedAt = new Date()
      await Promise.all(
        [...Silian_migratedAssetsById.values()].map((Silian_target) =>
          Silian_markDraftAssetMigrated(
            Silian_target.assetId,
            Silian_target.repoPath,
            Silian_result.prNumber,
            Silian_migratedAt
          )
        )
      )
    }

    await Silian_prisma.revision.update({
      where: { id: Silian_revisionId },
      data: {
        baseMainSha: Silian_baseMainSha,
        conflictContent: Silian_syncedDraftStorage.conflictContent,
        content: Silian_syncedDraftStorage.content,
        filePath: Silian_syncedDraftStorage.filePath,
        githubPrNum: Silian_result.prNumber,
        githubPrUrl: Silian_result.prUrl,
        prBranchName: Silian_result.branchName,
        status: Silian_result.status,
        submittedAt: new Date(),
        syncedMainSha: Silian_result.syncedMainSha,
      },
    })

    Silian_revalidatePaths(["/draft", "/review"])
    return { success: true, status: Silian_result.status }
  } catch (Silian_error) {
    await Silian_prisma.revision.updateMany({
      where: { id: Silian_revisionId, status: "PENDING" },
      data: { status: "DRAFT" },
    })

    const Silian_message = Silian_error instanceof Error ? Silian_error.message : "Unknown error"
    if (Silian_message.includes("Resource not accessible by personal access token")) {
      throw new Error(
        "Failed to create PR: the configured GitHub token cannot create branches in the Articles repo. Set GITHUB_ARTICLES_WRITE_PAT with repo write access on Vercel."
      )
    }
    throw Silian_error
  }
}

export async function deleteDraftAction(Silian_revisionId: string) {
  const Silian_session = await Silian_requireAuth()

  const Silian_userId = Silian_session.user.id
  const Silian_existing = await Silian_prisma.revision.findUnique({
    where: { id: Silian_revisionId },
  })

  if (!Silian_existing) {
    throw new Error("Draft not found")
  }

  if (Silian_existing.authorId !== Silian_userId) {
    throw new Error("Unauthorized to delete this draft")
  }

  if (
    Silian_existing.githubPrNum ||
    Silian_existing.status === "IN_REVIEW" ||
    Silian_existing.status === "SYNC_CONFLICT"
  ) {
    throw new Error("Cannot delete a draft after a PR has been opened")
  }

  const Silian_draftAssets = await Silian_findDraftAssetsByRevision(Silian_revisionId)

  for (const Silian_asset of Silian_draftAssets) {
    try {
      await Silian_deleteDraftAsset(Silian_asset.storagePath)
      await Silian_markDraftAssetDeleted(Silian_asset.id)
    } catch (Silian_error) {
      await Silian_markDraftAssetCleanupFailed(
        Silian_asset.id,
        Silian_error instanceof Error ? Silian_error.message : "Unknown error"
      )
    }
  }

  await Silian_prisma.revision.delete({
    where: { id: Silian_revisionId },
  })

  Silian_revalidatePath("/draft")
  return { success: true }
}

export async function retryCleanupAction(Silian_revisionId: string) {
  const Silian_session = await Silian_requireAuth()

  if (!Silian_revisionId) {
    throw new Error("Revision ID is required")
  }

  const Silian_existing = await Silian_prisma.revision.findUnique({
    where: { id: Silian_revisionId },
    select: { authorId: true },
  })

  if (!Silian_existing) {
    throw new Error("Revision not found")
  }

  if (Silian_existing.authorId !== Silian_session.user.id) {
    throw new Error("Unauthorized")
  }

  const Silian_failedAssets = await Silian_findFailedDraftAssets(Silian_revisionId)

  let Silian_cleaned = 0
  let Silian_failed = 0

  for (const Silian_asset of Silian_failedAssets) {
    try {
      await Silian_deleteDraftAsset(Silian_asset.storagePath)
      await Silian_markDraftAssetDeleted(Silian_asset.id)
      Silian_cleaned += 1
    } catch (Silian_error) {
      await Silian_markDraftAssetCleanupFailed(
        Silian_asset.id,
        Silian_error instanceof Error ? Silian_error.message : "Unknown error"
      )
      Silian_failed += 1
    }
  }

  Silian_revalidatePath("/draft")
  return { success: true, cleaned: Silian_cleaned, failed: Silian_failed }
}
