"use server"

import { revalidatePath as Silian_revalidatePath } from "next/cache"
import { Prisma as Silian_Prisma } from "@prisma/client"

import { revalidatePaths as Silian_revalidatePaths } from "@/lib/revalidation"
import {
  forcePushResolvedToPRBranch as Silian_forcePushResolvedToPRBranch,
  getArticleFileContent as Silian_getArticleFileContent,
  getMainBranchHeadSha as Silian_getMainBranchHeadSha,
  resolveDraftSyncConflict as Silian_resolveDraftSyncConflict,
  resolveSimpleConflicts as Silian_resolveSimpleConflicts,
  upsertFileOnBranch as Silian_upsertFileOnBranch,
  upsertFilesOnBranch as Silian_upsertFilesOnBranch,
} from "@/lib/article-submission"
import {
  abortRebase as Silian_abortRebase,
  rebaseArticleContentMultiFile as Silian_rebaseArticleContentMultiFile,
  rebaseArticleContent as Silian_rebaseArticleContent,
  resumeRebase as Silian_resumeRebase,
} from "@/lib/article-rebase"
import { requireAuth as Silian_requireAuth } from "@/lib/auth-helpers"
import { getGithubPatForUser as Silian_getGithubPatForUser, requireAdmin as Silian_requireAdmin } from "@/lib/auth-context"
import {
  decodeStoredDraftFiles as Silian_decodeStoredDraftFiles,
  deserializeDraftFilesPayload as Silian_deserializeDraftFilesPayload,
  getActiveDraftFile as Silian_getActiveDraftFile,
  normalizeDraftFileCollection as Silian_normalizeDraftFileCollection,
  serializeDraftFilesForStorage as Silian_serializeDraftFilesForStorage,
  type DraftFileCollection,
} from "@/lib/draft-files"
import { formatErrorMessage as Silian_formatErrorMessage } from "@/lib/error-handling"
import {
  ARTICLES_REPO_NAME as Silian_ARTICLES_REPO_NAME,
  ARTICLES_REPO_OWNER as Silian_ARTICLES_REPO_OWNER,
  getOctokit as Silian_getOctokit,
} from "@/lib/github/articles-repo"
import { reconcileDraftAssetsForPRCompletion as Silian_reconcileDraftAssetsForPRCompletion } from "@/lib/draft-asset-reconciler"
import { mergePR as Silian_mergePR } from "@/lib/github/pr-manager"
import { prisma as Silian_prisma } from "@/lib/prisma"
import {
  parseConflictBlocks as Silian_parseConflictBlocks,
  SIMPLE_CONFLICT_BLOCK_RE as Silian_SIMPLE_CONFLICT_BLOCK_RE,
  storeRerere as Silian_storeRerere,
} from "@/lib/rerere"
import type { RebaseState } from "@/types/rebase"
import type { ConflictMode, ReviewMergeMethod } from "@/types/review"

const Silian_owner = Silian_ARTICLES_REPO_OWNER
const Silian_repo = Silian_ARTICLES_REPO_NAME
const Silian_SIMPLE_CONFLICT_MARKER_RE = new RegExp(
  Silian_SIMPLE_CONFLICT_BLOCK_RE.source,
  "g"
)

function Silian_reviewLog(Silian_action: string, Silian_details: Record<string, unknown>) {
  console.log(`[review:${Silian_action}]`, Silian_details)
}

function Silian_reviewError(
  Silian_action: string,
  Silian_error: unknown,
  Silian_details: Record<string, unknown>
) {
  console.error(`[review:${Silian_action}]`, {
    ...Silian_details,
    error:
      Silian_error instanceof Error
        ? {
            name: Silian_error.name,
            message: Silian_error.message,
            stack: Silian_error.stack,
          }
        : Silian_error,
  })
}

function Silian_summarizeSha(Silian_sha?: string | null) {
  return Silian_sha ? Silian_sha.slice(0, 7) : null
}

function Silian_hasSimpleConflictMarkers(Silian_content: string) {
  Silian_SIMPLE_CONFLICT_MARKER_RE.lastIndex = 0
  return Silian_SIMPLE_CONFLICT_MARKER_RE.test(Silian_content)
}

type ConflictSection =
  | { type: "ok"; content: string }
  | { type: "conflict"; blockIndex: number }

function Silian_parseConflictSections(Silian_content: string): ConflictSection[] {
  const Silian_regex = new RegExp(Silian_SIMPLE_CONFLICT_BLOCK_RE.source, "g")
  const Silian_sections: ConflictSection[] = []
  let Silian_lastIndex = 0
  let Silian_blockIndex = 0
  let Silian_match = Silian_regex.exec(Silian_content)

  while (Silian_match !== null) {
    if (Silian_match.index > Silian_lastIndex) {
      Silian_sections.push({
        type: "ok",
        content: Silian_content.slice(Silian_lastIndex, Silian_match.index),
      })
    }

    Silian_sections.push({ type: "conflict", blockIndex: Silian_blockIndex })
    Silian_blockIndex += 1
    Silian_lastIndex = Silian_regex.lastIndex
    Silian_match = Silian_regex.exec(Silian_content)
  }

  if (Silian_lastIndex < Silian_content.length) {
    Silian_sections.push({ type: "ok", content: Silian_content.slice(Silian_lastIndex) })
  }

  return Silian_sections
}

function Silian_extractResolvedBlockResolutions(Silian_input: {
  originalConflictContent: string
  resolvedContent: string
  filePath: string
  baseContent: string
}) {
  const Silian_blocks = Silian_parseConflictBlocks(
    Silian_input.originalConflictContent,
    Silian_input.filePath,
    Silian_input.baseContent
  )
  const Silian_sections = Silian_parseConflictSections(Silian_input.originalConflictContent)
  const Silian_resolutions: Array<{
    block: (typeof Silian_blocks)[number]
    resolution: string
  }> = []
  let Silian_cursor = 0

  for (let Silian_i = 0; Silian_i < Silian_sections.length; Silian_i++) {
    const Silian_section = Silian_sections[Silian_i]

    if (Silian_section?.type === "ok") {
      if (!Silian_section.content) {
        continue
      }

      const Silian_index = Silian_input.resolvedContent.indexOf(Silian_section.content, Silian_cursor)
      if (Silian_index === -1) {
        return []
      }

      Silian_cursor = Silian_index + Silian_section.content.length
      continue
    }

    if (!Silian_section || Silian_section.type !== "conflict") {
      continue
    }

    const Silian_nextOk = Silian_sections
      .slice(Silian_i + 1)
      .find(
        (Silian_candidate): Silian_candidate is Extract<ConflictSection, { type: "ok" }> =>
          Silian_candidate.type === "ok" && Silian_candidate.content.length > 0
      )
    const Silian_endIndex = Silian_nextOk
      ? Silian_input.resolvedContent.indexOf(Silian_nextOk.content, Silian_cursor)
      : Silian_input.resolvedContent.length

    if (Silian_endIndex === -1) {
      return []
    }

    const Silian_block = Silian_blocks[Silian_section.blockIndex]
    if (!Silian_block) {
      continue
    }

    Silian_resolutions.push({
      block: Silian_block,
      resolution: Silian_input.resolvedContent.slice(Silian_cursor, Silian_endIndex),
    })
    Silian_cursor = Silian_endIndex
  }

  return Silian_resolutions
}

async function Silian_recordResolvedRerereEntries(Silian_input: {
  token?: string
  storedFiles: DraftFileCollection["files"]
  resolvedFiles: DraftFileCollection["files"]
  baseRef?: string | null
}) {
  if (!Silian_input.baseRef) {
    return
  }

  const Silian_resolvedById = new Map(
    Silian_input.resolvedFiles.map((Silian_file) => [Silian_file.id, Silian_file])
  )

  for (const Silian_storedFile of Silian_input.storedFiles) {
    const Silian_originalConflictContent = Silian_storedFile.conflictContent
    const Silian_resolvedFile = Silian_resolvedById.get(Silian_storedFile.id)

    if (
      !Silian_originalConflictContent ||
      !Silian_resolvedFile ||
      Silian_hasSimpleConflictMarkers(Silian_resolvedFile.content)
    ) {
      continue
    }

    const Silian_baseContent = await Silian_getArticleFileContent(
      Silian_storedFile.filePath,
      Silian_input.baseRef,
      Silian_input.token
    )
    const Silian_resolutions = Silian_extractResolvedBlockResolutions({
      originalConflictContent: Silian_originalConflictContent,
      resolvedContent: Silian_resolvedFile.content,
      filePath: Silian_storedFile.filePath,
      baseContent: Silian_baseContent,
    })

    await Promise.all(
      Silian_resolutions.map(({ block: Silian_block, resolution: Silian_resolution }) =>
        Silian_storeRerere(
          Silian_block.filePath,
          Silian_block.base,
          Silian_block.ours,
          Silian_block.theirs,
          Silian_resolution
        )
      )
    )
  }
}

function Silian_getReviewRevalidatePaths(
  Silian_revisionId: string,
  Silian_prNumber?: number | null
) {
  return [
    "/draft",
    `/draft/${Silian_revisionId}`,
    "/review",
    Silian_prNumber ? `/review/${Silian_prNumber}` : "",
  ].filter(Boolean)
}

async function Silian_requireReviewAdminContext() {
  const Silian_session = await Silian_requireAuth()
  await Silian_requireAdmin(Silian_session.user.id)

  return {
    session: Silian_session,
    token: await Silian_getGithubPatForUser(Silian_session.user.id),
    authorName: Silian_session.user.name || "GTMC Admin",
    authorEmail: Silian_session.user.email || "admin@gtmc.dev",
  }
}

function Silian_focusDraftFileByPath(
  Silian_draftFiles: DraftFileCollection,
  Silian_filePath?: string | null
) {
  if (!Silian_filePath) {
    return Silian_draftFiles
  }

  const Silian_targetFile = Silian_draftFiles.files.find((Silian_file) => Silian_file.filePath === Silian_filePath)

  if (!Silian_targetFile) {
    return Silian_draftFiles
  }

  return Silian_normalizeDraftFileCollection({
    activeFileId: Silian_targetFile.id,
    folders: Silian_draftFiles.folders || [],
    files: Silian_draftFiles.files,
  })
}

function Silian_getFirstConflictedFilePath(Silian_files: DraftFileCollection["files"]) {
  return (
    Silian_files.find(
      (Silian_file) =>
        Silian_file.conflictContent !== undefined && Silian_file.conflictContent !== null
    )?.filePath ?? null
  )
}

function Silian_buildDraftSnapshot(Silian_draftFiles: DraftFileCollection) {
  return {
    activeFileId: Silian_draftFiles.activeFileId,
    files: Silian_draftFiles.files.map((Silian_file) => ({
      id: Silian_file.id,
      filePath: Silian_file.filePath,
      content: Silian_file.content,
      conflictContent: Silian_file.conflictContent ?? null,
    })),
  }
}

function Silian_applyRebasedFilesToDraft(
  Silian_draftFiles: DraftFileCollection,
  Silian_rebasedFiles?: Array<{ filePath: string; content: string }>,
  Silian_singleFileFallback?: { filePath: string; content: string },
  Silian_conflict?: { filePath?: string; content?: string | null }
) {
  const Silian_rebasedFileMap = new Map(
    (Silian_rebasedFiles ?? []).map((Silian_file) => [Silian_file.filePath, Silian_file.content])
  )

  return Silian_normalizeDraftFileCollection({
    activeFileId: Silian_draftFiles.activeFileId,
    folders: Silian_draftFiles.folders || [],
    files: Silian_draftFiles.files.map((Silian_file) => ({
      ...Silian_file,
      content:
        Silian_rebasedFileMap.get(Silian_file.filePath) ??
        (Silian_singleFileFallback && Silian_file.filePath === Silian_singleFileFallback.filePath
          ? Silian_singleFileFallback.content
          : Silian_file.content),
      conflictContent:
        Silian_conflict?.content && Silian_file.filePath === Silian_conflict.filePath
          ? Silian_conflict.content
          : undefined,
    })),
  })
}

async function Silian_persistRebasedBranchFiles(Silian_input: {
  authorEmail: string
  authorName: string
  branchName: string
  files: Array<{ filePath: string; content: string }>
  message: string
  token?: string
}) {
  if (Silian_input.files.length <= 1) {
    const Silian_file = Silian_input.files[0]
    if (!Silian_file) {
      return
    }

    await Silian_upsertFileOnBranch({
      authorEmail: Silian_input.authorEmail,
      authorName: Silian_input.authorName,
      branchName: Silian_input.branchName,
      content: Silian_file.content,
      filePath: Silian_file.filePath,
      message: Silian_input.message,
      token: Silian_input.token,
    })
    return
  }

  if (!Silian_input.token) {
    throw new Error("GitHub token is required to update multiple files")
  }

  await Silian_upsertFilesOnBranch(
    Silian_input.token,
    Silian_input.files.map((Silian_file) => ({
      path: Silian_file.filePath,
      content: Silian_file.content,
    })),
    Silian_input.branchName
  )
}

export async function mergePRAction(
  Silian_prNumber: number,
  Silian_options?: {
    commitBody?: string
    commitTitle?: string
    mergeMethod?: ReviewMergeMethod
  }
) {
  const Silian_session = await Silian_requireAuth()
  await Silian_requireAdmin(Silian_session.user.id)

  const Silian_token = await Silian_getGithubPatForUser(Silian_session.user.id)

  try {
    Silian_reviewLog("mergePRAction", {
      prNumber: Silian_prNumber,
      status: "start",
      mergeMethod: Silian_options?.mergeMethod ?? "auto",
    })
    Silian_reviewLog("mergePRAction", {
      prNumber: Silian_prNumber,
      status: "merge-dispatch",
      mergeMethod: Silian_options?.mergeMethod ?? "auto",
    })
    await Silian_mergePR(Silian_prNumber, Silian_options, Silian_token)
    Silian_reviewLog("mergePRAction", {
      prNumber: Silian_prNumber,
      status: "github-api-after",
      operation: "mergePR",
      result: "completed",
    })
    try {
      Silian_reviewLog("mergePRAction", {
        prNumber: Silian_prNumber,
        status: "reconcile-start",
        outcome: "PR-merged",
      })
      await Silian_reconcileDraftAssetsForPRCompletion({
        prNumber: Silian_prNumber,
        outcome: "PR-merged",
      })
      Silian_reviewLog("mergePRAction", {
        prNumber: Silian_prNumber,
        status: "reconcile-complete",
        outcome: "PR-merged",
      })
    } catch (Silian_reconcileError) {
      Silian_reviewError("mergePRAction", Silian_reconcileError, {
        prNumber: Silian_prNumber,
        status: "reconcile-error",
        outcome: "PR-merged",
      })
    }
    Silian_revalidatePath("/draft")
    Silian_revalidatePath("/review")
    Silian_reviewLog("mergePRAction", { prNumber: Silian_prNumber, status: "complete" })
    return { success: true }
  } catch (Silian_error) {
    Silian_reviewError("mergePRAction", Silian_error, { prNumber: Silian_prNumber, status: "error" })
    throw new Error(Silian_formatErrorMessage("Merge failed", Silian_error))
  }
}

export async function closePRAction(Silian_prNumber: number) {
  const Silian_session = await Silian_requireAuth()
  await Silian_requireAdmin(Silian_session.user.id)

  const Silian_token = await Silian_getGithubPatForUser(Silian_session.user.id)
  const Silian_octokit = Silian_getOctokit(Silian_token)

  try {
    Silian_reviewLog("closePRAction", { prNumber: Silian_prNumber, status: "start" })
    Silian_reviewLog("closePRAction", {
      prNumber: Silian_prNumber,
      status: "github-api-before",
      operation: "pulls.update",
      nextState: "closed",
    })
    await Silian_octokit.pulls.update({
      owner: Silian_owner,
      repo: Silian_repo,
      pull_number: Silian_prNumber,
      state: "closed",
    })
    Silian_reviewLog("closePRAction", {
      prNumber: Silian_prNumber,
      status: "github-api-after",
      operation: "pulls.update",
      result: "closed",
    })
    try {
      Silian_reviewLog("closePRAction", {
        prNumber: Silian_prNumber,
        status: "reconcile-start",
        outcome: "PR-closed",
      })
      await Silian_reconcileDraftAssetsForPRCompletion({
        prNumber: Silian_prNumber,
        outcome: "PR-closed",
      })
      Silian_reviewLog("closePRAction", {
        prNumber: Silian_prNumber,
        status: "reconcile-complete",
        outcome: "PR-closed",
      })
    } catch (Silian_reconcileError) {
      Silian_reviewError("closePRAction", Silian_reconcileError, {
        prNumber: Silian_prNumber,
        status: "reconcile-error",
        outcome: "PR-closed",
      })
    }
    Silian_revalidatePath("/draft")
    Silian_revalidatePath("/review")
    Silian_reviewLog("closePRAction", { prNumber: Silian_prNumber, status: "complete" })
    return { success: true }
  } catch (Silian_error) {
    Silian_reviewError("closePRAction", Silian_error, { prNumber: Silian_prNumber, status: "error" })
    throw new Error(Silian_formatErrorMessage("Close failed", Silian_error))
  }
}

export async function resolveConflictAction(
  Silian_prNumber: number,
  Silian_formData: FormData
) {
  Silian_reviewLog("resolveConflictAction", {
    prNumber: Silian_prNumber,
    status: "start",
    contentProvided: Boolean(Silian_formData.get("content")),
    draftFilesProvided: Boolean(Silian_formData.get("draftFiles")),
  })

  try {
    const { session: Silian_session, token: Silian_token, authorName: Silian_authorName, authorEmail: Silian_authorEmail } =
      await Silian_requireReviewAdminContext()

    const Silian_content = Silian_formData.get("content") as string | null
    const Silian_draftFilesPayload = Silian_formData.get("draftFiles") as string | null

    const Silian_linkedDraft = await Silian_prisma.revision.findFirst({
      where: { githubPrNum: Silian_prNumber },
      include: {
        author: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    if (!Silian_linkedDraft) {
      throw new Error("Linked draft not found")
    }

    if (!Silian_linkedDraft.filePath || !Silian_linkedDraft.prBranchName) {
      throw new Error("The linked draft is missing PR metadata")
    }

    const Silian_submitterName = Silian_linkedDraft.author?.name || Silian_authorName
    const Silian_submitterEmail = Silian_linkedDraft.author?.email || Silian_authorEmail

    const Silian_storedDraftFiles = Silian_decodeStoredDraftFiles({
      content: Silian_linkedDraft.content,
      conflictContent: Silian_linkedDraft.conflictContent,
      filePath: Silian_linkedDraft.filePath,
    })
    const Silian_submittedDraftFiles = Silian_deserializeDraftFilesPayload(Silian_draftFilesPayload)
    const Silian_resolvedDraftFiles =
      Silian_submittedDraftFiles ||
      (Silian_content
        ? Silian_normalizeDraftFileCollection({
            activeFileId: Silian_storedDraftFiles.activeFileId,
            folders: Silian_storedDraftFiles.folders || [],
            files: Silian_storedDraftFiles.files.map((Silian_file) => ({
              ...Silian_file,
              content:
                Silian_file.id === Silian_storedDraftFiles.activeFileId
                  ? Silian_content
                  : Silian_file.content,
            })),
          })
        : null)

    if (!Silian_resolvedDraftFiles) {
      throw new Error("Resolved content is required")
    }

    const Silian_conflictMode = (Silian_linkedDraft as { conflictMode?: ConflictMode | null })
      .conflictMode

    Silian_reviewLog("resolveConflictAction", {
      prNumber: Silian_prNumber,
      revisionId: Silian_linkedDraft.id,
      status: "loaded",
      conflictMode: Silian_conflictMode,
      fileCount: Silian_storedDraftFiles.files.length,
      actorUserId: Silian_session.user.id,
    })

    if (Silian_conflictMode === "SIMPLE") {
      Silian_reviewLog("resolveConflictAction", {
        prNumber: Silian_prNumber,
        status: "branch",
        branch: "SIMPLE",
        fileCount: Silian_resolvedDraftFiles.files.length,
      })
      const Silian_storedFileMap = new Map(
        Silian_storedDraftFiles.files.map((Silian_file) => [Silian_file.id, Silian_file])
      )
      const Silian_nextDraftFiles = Silian_normalizeDraftFileCollection({
        activeFileId: Silian_resolvedDraftFiles.activeFileId,
        folders: Silian_resolvedDraftFiles.folders || [],
        files: Silian_resolvedDraftFiles.files.map((Silian_file) => {
          const Silian_previousFile = Silian_storedFileMap.get(Silian_file.id)
          const Silian_stillHasConflict = Silian_hasSimpleConflictMarkers(Silian_file.content)

          return {
            ...Silian_file,
            content: Silian_stillHasConflict
              ? (Silian_previousFile?.content ?? Silian_file.content)
              : Silian_file.content,
            ...(Silian_stillHasConflict ? { conflictContent: Silian_file.content } : {}),
          }
        }),
      })
      const Silian_focusedNextDraftFiles = Silian_focusDraftFileByPath(
        Silian_nextDraftFiles,
        Silian_getFirstConflictedFilePath(Silian_nextDraftFiles.files)
      )
      const Silian_nextStorage = Silian_serializeDraftFilesForStorage(Silian_focusedNextDraftFiles)
      const Silian_nextStatus = Silian_focusedNextDraftFiles.files.some(
        (Silian_file) =>
          Silian_file.conflictContent !== undefined && Silian_file.conflictContent !== null
      )
        ? "SYNC_CONFLICT"
        : "IN_REVIEW"
      const Silian_focusFilePath = Silian_getFirstConflictedFilePath(
        Silian_focusedNextDraftFiles.files
      )

      await Silian_recordResolvedRerereEntries({
        token: Silian_token,
        storedFiles: Silian_storedDraftFiles.files,
        resolvedFiles: Silian_focusedNextDraftFiles.files,
        baseRef: Silian_linkedDraft.baseMainSha,
      })

      Silian_reviewLog("resolveConflictAction", {
        prNumber: Silian_prNumber,
        status: "db-write-before",
        fields: ["conflictContent", "content", "filePath", "status"],
        nextStatus: Silian_nextStatus,
      })
      await Silian_prisma.revision.update({
        where: { id: Silian_linkedDraft.id },
        data: {
          conflictContent: Silian_nextStorage.conflictContent,
          content: Silian_nextStorage.content,
          filePath: Silian_nextStorage.filePath,
          status: Silian_nextStatus,
        },
      })
      Silian_reviewLog("resolveConflictAction", {
        prNumber: Silian_prNumber,
        status: "db-write-after",
        fields: ["conflictContent", "content", "filePath", "status"],
        nextStatus: Silian_nextStatus,
      })

      const Silian_latestMainSha = await Silian_getMainBranchHeadSha(Silian_token)
      Silian_reviewLog("resolveConflictAction", {
        prNumber: Silian_prNumber,
        status: "force-push-start",
        prBranchName: Silian_linkedDraft.prBranchName,
        fileCount: Silian_focusedNextDraftFiles.files.length,
        latestMainSha: Silian_summarizeSha(Silian_latestMainSha),
      })
      await Silian_forcePushResolvedToPRBranch({
        resolvedFiles: Silian_focusedNextDraftFiles.files.map((Silian_file) => ({
          filePath: Silian_file.filePath,
          content: Silian_file.content,
        })),
        prBranchName: Silian_linkedDraft.prBranchName,
        latestMainSha: Silian_latestMainSha,
        commitMessage: "chore(review): apply conflict resolution",
        authorName: Silian_submitterName,
        authorEmail: Silian_submitterEmail,
        token: Silian_token,
      })
      Silian_reviewLog("resolveConflictAction", {
        prNumber: Silian_prNumber,
        status: "force-push-complete",
        prBranchName: Silian_linkedDraft.prBranchName,
      })

      Silian_revalidatePaths(Silian_getReviewRevalidatePaths(Silian_linkedDraft.id, Silian_prNumber))
      Silian_reviewLog("resolveConflictAction", {
        prNumber: Silian_prNumber,
        status: "complete",
        conflictMode: Silian_conflictMode,
        resultStatus: Silian_nextStatus,
      })
      return {
        success: true,
        status: Silian_nextStatus,
        hasConflicts: Silian_nextStatus === "SYNC_CONFLICT",
        focusFilePath: Silian_focusFilePath,
        draftSnapshot: Silian_buildDraftSnapshot(Silian_focusedNextDraftFiles),
      }
    }

    const Silian_rebaseState = Silian_linkedDraft.rebaseState as RebaseState | null

    if (Silian_rebaseState?.status === "CONFLICT") {
      Silian_reviewLog("resolveConflictAction", {
        prNumber: Silian_prNumber,
        status: "branch",
        branch: "FINE_GRAINED",
        currentCommitIndex: Silian_rebaseState.currentCommitIndex,
      })
      const Silian_resolvedFile = Silian_getActiveDraftFile(Silian_resolvedDraftFiles)
      const Silian_storedFile = Silian_getActiveDraftFile(Silian_storedDraftFiles)
      const Silian_rebaseConflictBaseRef =
        Silian_rebaseState.currentCommitIndex > 0
          ? Silian_rebaseState.commitInfos[Silian_rebaseState.currentCommitIndex - 1]?.sha
          : Silian_linkedDraft.baseMainSha

      await Silian_recordResolvedRerereEntries({
        token: Silian_token,
        storedFiles: Silian_storedDraftFiles.files,
        resolvedFiles: Silian_resolvedDraftFiles.files,
        baseRef: Silian_rebaseConflictBaseRef,
      })

      const Silian_result = await Silian_resumeRebase({
        draftId: Silian_linkedDraft.id,
        resolvedContent: Silian_resolvedFile.content,
        resolvedFiles: Silian_resolvedDraftFiles.files.map((Silian_file) => ({
          filePath: Silian_file.filePath,
          content: Silian_file.content,
        })),
        token: Silian_token,
      })
      Silian_reviewLog("resolveConflictAction", {
        prNumber: Silian_prNumber,
        status: "resume-rebase-result",
        resultStatus: Silian_result.status,
      })

      if (Silian_result.status === "SUCCESS") {
        const Silian_rebasedDraftFiles = Silian_applyRebasedFilesToDraft(
          Silian_storedDraftFiles,
          Silian_result.files,
          { filePath: Silian_storedFile.filePath, content: Silian_result.finalContent }
        )
        Silian_reviewLog("resolveConflictAction", {
          prNumber: Silian_prNumber,
          status: "force-push-start",
          prBranchName: Silian_linkedDraft.prBranchName,
          fileCount: Silian_rebasedDraftFiles.files.length,
        })
        await Silian_persistRebasedBranchFiles({
          authorEmail: Silian_submitterEmail,
          authorName: Silian_submitterName,
          branchName: Silian_linkedDraft.prBranchName,
          files: Silian_rebasedDraftFiles.files.map((Silian_file) => ({
            filePath: Silian_file.filePath,
            content: Silian_file.content,
          })),
          message: `docs: apply rebase for ${Silian_linkedDraft.title}`,
          token: Silian_token,
        })
        Silian_reviewLog("resolveConflictAction", {
          prNumber: Silian_prNumber,
          status: "force-push-complete",
          prBranchName: Silian_linkedDraft.prBranchName,
        })
        const Silian_rebasedDraftStorage =
          Silian_serializeDraftFilesForStorage(Silian_rebasedDraftFiles)
        Silian_reviewLog("resolveConflictAction", {
          prNumber: Silian_prNumber,
          status: "db-write-before",
          fields: [
            "status",
            "conflictContent",
            "content",
            "filePath",
            "rebaseState",
          ],
          nextStatus: "IN_REVIEW",
        })
        await Silian_prisma.revision.update({
          where: { id: Silian_linkedDraft.id },
          data: {
            status: "IN_REVIEW",
            conflictContent: Silian_rebasedDraftStorage.conflictContent,
            content: Silian_rebasedDraftStorage.content,
            filePath: Silian_rebasedDraftStorage.filePath,
            rebaseState: {
              ...Silian_rebaseState,
              status: "COMPLETED",
              resolvedContent: Silian_result.finalContent,
            } as unknown as Silian_Prisma.InputJsonValue,
          },
        })
        Silian_reviewLog("resolveConflictAction", {
          prNumber: Silian_prNumber,
          status: "db-write-after",
          fields: [
            "status",
            "conflictContent",
            "content",
            "filePath",
            "rebaseState",
          ],
          nextStatus: "IN_REVIEW",
        })
      } else if (Silian_result.status === "CONFLICT") {
        const Silian_focusFilePath = Silian_result.conflictFilePath ?? Silian_storedFile.filePath
        const Silian_conflictDraftFiles = Silian_focusDraftFileByPath(
          Silian_applyRebasedFilesToDraft(Silian_storedDraftFiles, Silian_result.files, undefined, {
            filePath: Silian_focusFilePath,
            content: Silian_result.conflictContent,
          }),
          Silian_focusFilePath
        )
        const Silian_conflictDraftStorage =
          Silian_serializeDraftFilesForStorage(Silian_conflictDraftFiles)
        Silian_reviewLog("resolveConflictAction", {
          prNumber: Silian_prNumber,
          status: "branch-decision",
          branch: "CONFLICT",
          conflictFilePath: Silian_focusFilePath,
        })
        Silian_reviewLog("resolveConflictAction", {
          prNumber: Silian_prNumber,
          status: "db-write-before",
          fields: ["status", "conflictContent", "content", "filePath"],
          nextStatus: "SYNC_CONFLICT",
        })
        await Silian_prisma.revision.update({
          where: { id: Silian_linkedDraft.id },
          data: {
            status: "SYNC_CONFLICT",
            conflictContent: Silian_conflictDraftStorage.conflictContent,
            content: Silian_conflictDraftStorage.content,
            filePath: Silian_conflictDraftStorage.filePath,
          },
        })
        Silian_reviewLog("resolveConflictAction", {
          prNumber: Silian_prNumber,
          status: "db-write-after",
          fields: ["status", "conflictContent", "content", "filePath"],
          nextStatus: "SYNC_CONFLICT",
        })
      } else if (Silian_result.status === "FILE_DELETED_CONFLICT") {
        const Silian_deletedConflictDraftStorage = Silian_serializeDraftFilesForStorage(
          Silian_applyRebasedFilesToDraft(Silian_storedDraftFiles, Silian_result.files)
        )
        Silian_reviewLog("resolveConflictAction", {
          prNumber: Silian_prNumber,
          status: "branch-decision",
          branch: "FILE_DELETED_CONFLICT",
        })
        Silian_reviewLog("resolveConflictAction", {
          prNumber: Silian_prNumber,
          status: "db-write-before",
          fields: ["status", "content", "filePath", "conflictContent"],
          nextStatus: "SYNC_CONFLICT",
        })
        await Silian_prisma.revision.update({
          where: { id: Silian_linkedDraft.id },
          data: {
            status: "SYNC_CONFLICT",
            content: Silian_deletedConflictDraftStorage.content,
            filePath: Silian_deletedConflictDraftStorage.filePath,
            conflictContent: Silian_deletedConflictDraftStorage.conflictContent,
          },
        })
        Silian_reviewLog("resolveConflictAction", {
          prNumber: Silian_prNumber,
          status: "db-write-after",
          fields: ["status", "content", "filePath", "conflictContent"],
          nextStatus: "SYNC_CONFLICT",
        })
      } else {
        throw new Error(Silian_formatErrorMessage("Resume rebase failed", Silian_result))
      }

      Silian_revalidatePaths([
        "/draft",
        `/draft/${Silian_linkedDraft.id}`,
        "/review",
        `/review/${Silian_prNumber}`,
      ])
      Silian_reviewLog("resolveConflictAction", {
        prNumber: Silian_prNumber,
        status: "complete",
        conflictMode: Silian_conflictMode,
        resultStatus: Silian_result.status,
      })
      return {
        success: true,
        status: Silian_result.status,
        hasConflicts:
          Silian_result.status === "CONFLICT" ||
          Silian_result.status === "FILE_DELETED_CONFLICT",
        focusFilePath:
          Silian_result.status === "CONFLICT"
            ? (Silian_result.conflictFilePath ?? Silian_storedFile.filePath)
            : null,
      }
    }

    const Silian_result = await Silian_resolveDraftSyncConflict({
      activeFileId: Silian_resolvedDraftFiles.activeFileId,
      authorEmail: Silian_authorEmail,
      authorName: Silian_authorName,
      branchName: Silian_linkedDraft.prBranchName,
      files: Silian_resolvedDraftFiles.files.map((Silian_file) => ({
        ...Silian_file,
        conflictContent: undefined,
      })),
      syncedMainSha: Silian_linkedDraft.syncedMainSha,
      title: Silian_linkedDraft.title,
      token: Silian_token,
    })

    const Silian_syncedDraftFiles = Silian_focusDraftFileByPath(
      {
        activeFileId: Silian_result.activeFileId,
        folders: Silian_storedDraftFiles.folders || [],
        files: Silian_result.files,
      },
      Silian_getFirstConflictedFilePath(Silian_result.files)
    )
    const Silian_syncedDraftStorage = Silian_serializeDraftFilesForStorage(Silian_syncedDraftFiles)
    const Silian_focusFilePath = Silian_getFirstConflictedFilePath(Silian_syncedDraftFiles.files)

    Silian_reviewLog("resolveConflictAction", {
      prNumber: Silian_prNumber,
      status: "db-write-before",
      fields: [
        "conflictContent",
        "content",
        "filePath",
        "status",
        "syncedMainSha",
      ],
      nextStatus: Silian_result.status,
      syncedMainSha: Silian_summarizeSha(Silian_result.syncedMainSha),
    })
    await Silian_prisma.revision.update({
      where: { id: Silian_linkedDraft.id },
      data: {
        conflictContent: Silian_syncedDraftStorage.conflictContent,
        content: Silian_syncedDraftStorage.content,
        filePath: Silian_syncedDraftStorage.filePath,
        status: Silian_result.status,
        syncedMainSha: Silian_result.syncedMainSha,
      },
    })
    Silian_reviewLog("resolveConflictAction", {
      prNumber: Silian_prNumber,
      status: "db-write-after",
      fields: [
        "conflictContent",
        "content",
        "filePath",
        "status",
        "syncedMainSha",
      ],
      nextStatus: Silian_result.status,
      syncedMainSha: Silian_summarizeSha(Silian_result.syncedMainSha),
    })

    Silian_revalidatePaths([
      "/draft",
      `/draft/${Silian_linkedDraft.id}`,
      "/review",
      `/review/${Silian_prNumber}`,
    ])

    Silian_reviewLog("resolveConflictAction", {
      prNumber: Silian_prNumber,
      status: "complete",
      conflictMode: Silian_conflictMode,
      resultStatus: Silian_result.status,
    })
    return {
      success: true,
      status: Silian_result.status,
      hasConflicts: Silian_focusFilePath !== null,
      focusFilePath: Silian_focusFilePath,
      draftSnapshot: Silian_buildDraftSnapshot(Silian_syncedDraftFiles),
    }
  } catch (Silian_error) {
    Silian_reviewError("resolveConflictAction", Silian_error, { prNumber: Silian_prNumber, status: "error" })
    throw Silian_error
  }
}

export async function submitWithRebaseAction(Silian_revisionId: string) {
  const { token: Silian_token, authorName: Silian_authorName, authorEmail: Silian_authorEmail } = await Silian_requireReviewAdminContext()

  const Silian_revision = await Silian_prisma.revision.findUnique({
    where: { id: Silian_revisionId },
  })

  if (!Silian_revision) {
    throw new Error("Revision not found")
  }

  const Silian_storedDraftFiles = Silian_decodeStoredDraftFiles({
    content: Silian_revision.content,
    conflictContent: Silian_revision.conflictContent,
    filePath: Silian_revision.filePath,
  })

  const Silian_draftFile = Silian_getActiveDraftFile(Silian_storedDraftFiles)

  if (!Silian_draftFile.filePath || !Silian_revision.prBranchName) {
    throw new Error("The revision is missing PR metadata")
  }

  if (!Silian_revision.baseMainSha || !Silian_revision.syncedMainSha) {
    throw new Error("The revision is missing main SHA metadata")
  }

  const Silian_result =
    Silian_storedDraftFiles.files.length === 1
      ? await Silian_rebaseArticleContent({
          draftId: Silian_revisionId,
          filePath: Silian_draftFile.filePath,
          baseMainSha: Silian_revision.baseMainSha,
          latestMainSha: Silian_revision.syncedMainSha,
          draftContent: Silian_draftFile.content,
          token: Silian_token,
        })
      : await Silian_rebaseArticleContentMultiFile({
          draftId: Silian_revisionId,
          files: Silian_storedDraftFiles.files.map((Silian_file) => ({
            filePath: Silian_file.filePath,
            content: Silian_file.content,
          })),
          baseMainSha: Silian_revision.baseMainSha,
          latestMainSha: Silian_revision.syncedMainSha,
          token: Silian_token,
        })

  if (Silian_result.status === "SUCCESS") {
    const Silian_rebasedDraftFiles = Silian_applyRebasedFilesToDraft(
      Silian_storedDraftFiles,
      Silian_result.files,
      { filePath: Silian_draftFile.filePath, content: Silian_result.finalContent }
    )
    await Silian_persistRebasedBranchFiles({
      authorEmail: Silian_authorEmail,
      authorName: Silian_authorName,
      branchName: Silian_revision.prBranchName,
      files: Silian_rebasedDraftFiles.files.map((Silian_file) => ({
        filePath: Silian_file.filePath,
        content: Silian_file.content,
      })),
      message: `docs: apply fine-grained rebase for ${Silian_revision.title}`,
      token: Silian_token,
    })
    const Silian_rebasedDraftStorage = Silian_serializeDraftFilesForStorage(Silian_rebasedDraftFiles)
    await Silian_prisma.revision.update({
      where: { id: Silian_revisionId },
      data: {
        status: "IN_REVIEW",
        conflictContent: Silian_rebasedDraftStorage.conflictContent,
        content: Silian_rebasedDraftStorage.content,
        filePath: Silian_rebasedDraftStorage.filePath,
      },
    })
  } else if (Silian_result.status === "CONFLICT") {
    const Silian_conflictDraftStorage = Silian_serializeDraftFilesForStorage(
      Silian_applyRebasedFilesToDraft(Silian_storedDraftFiles, Silian_result.files, undefined, {
        filePath: Silian_result.conflictFilePath ?? Silian_draftFile.filePath,
        content: Silian_result.conflictContent,
      })
    )
    await Silian_prisma.revision.update({
      where: { id: Silian_revisionId },
      data: {
        status: "SYNC_CONFLICT",
        conflictContent: Silian_conflictDraftStorage.conflictContent,
        content: Silian_conflictDraftStorage.content,
        filePath: Silian_conflictDraftStorage.filePath,
      },
    })
  } else if (Silian_result.status === "FILE_DELETED_CONFLICT") {
    const Silian_deletedConflictDraftStorage = Silian_serializeDraftFilesForStorage(
      Silian_applyRebasedFilesToDraft(Silian_storedDraftFiles, Silian_result.files)
    )
    await Silian_prisma.revision.update({
      where: { id: Silian_revisionId },
      data: {
        status: "SYNC_CONFLICT",
        content: Silian_deletedConflictDraftStorage.content,
        filePath: Silian_deletedConflictDraftStorage.filePath,
        conflictContent: Silian_deletedConflictDraftStorage.conflictContent,
      },
    })
  }

  Silian_revalidatePaths(
    [
      "/draft",
      `/draft/${Silian_revisionId}`,
      "/review",
      Silian_revision.githubPrNum ? `/review/${Silian_revision.githubPrNum}` : "",
    ].filter(Boolean)
  )

  return { success: true, status: Silian_result.status }
}

export async function abortRebaseAction(Silian_revisionId: string) {
  const { token: Silian_token } = await Silian_requireReviewAdminContext()

  try {
    const Silian_revision = await Silian_prisma.revision.findUnique({
      where: { id: Silian_revisionId },
    })

    if (!Silian_revision) {
      throw new Error("Revision not found")
    }

    await Silian_abortRebase({
      draftId: Silian_revisionId,
      token: Silian_token,
    })

    Silian_revalidatePaths(
      [
        "/draft",
        `/draft/${Silian_revisionId}`,
        "/review",
        Silian_revision.githubPrNum ? `/review/${Silian_revision.githubPrNum}` : "",
      ].filter(Boolean)
    )

    return { success: true }
  } catch (Silian_error) {
    throw new Error(Silian_formatErrorMessage("Abort rebase failed", Silian_error))
  }
}

export async function keepFileAction(Silian_revisionId: string) {
  const { token: Silian_token, authorName: Silian_authorName, authorEmail: Silian_authorEmail } = await Silian_requireReviewAdminContext()

  const Silian_revision = await Silian_prisma.revision.findUnique({
    where: { id: Silian_revisionId },
  })

  if (!Silian_revision) {
    throw new Error("Revision not found")
  }

  const Silian_storedDraftFiles = Silian_decodeStoredDraftFiles({
    content: Silian_revision.content,
    conflictContent: Silian_revision.conflictContent,
    filePath: Silian_revision.filePath,
  })

  if (Silian_storedDraftFiles.files.length !== 1) {
    throw new Error("Keep file only supports single-file drafts")
  }

  const Silian_draftFile = Silian_getActiveDraftFile(Silian_storedDraftFiles)

  if (!Silian_draftFile.filePath || !Silian_revision.prBranchName) {
    throw new Error("The revision is missing PR metadata")
  }

  await Silian_upsertFileOnBranch({
    authorEmail: Silian_authorEmail,
    authorName: Silian_authorName,
    branchName: Silian_revision.prBranchName,
    content: Silian_draftFile.content,
    filePath: Silian_draftFile.filePath,
    message: `docs: keep file despite deletion in main for ${Silian_revision.title}`,
    token: Silian_token,
  })

  const Silian_keptDraftStorage = Silian_serializeDraftFilesForStorage({
    activeFileId: Silian_storedDraftFiles.activeFileId,
    folders: Silian_storedDraftFiles.folders || [],
    files: [
      {
        ...Silian_draftFile,
        conflictContent: undefined,
      },
    ],
  })

  await Silian_prisma.revision.update({
    where: { id: Silian_revisionId },
    data: {
      status: "IN_REVIEW",
      conflictContent: Silian_keptDraftStorage.conflictContent,
      content: Silian_keptDraftStorage.content,
      filePath: Silian_keptDraftStorage.filePath,
      rebaseState: Silian_Prisma.DbNull,
    },
  })

  Silian_revalidatePaths(
    [
      "/draft",
      `/draft/${Silian_revisionId}`,
      "/review",
      Silian_revision.githubPrNum ? `/review/${Silian_revision.githubPrNum}` : "",
    ].filter(Boolean)
  )

  return { success: true }
}

export async function selectModeAction(Silian_revisionId: string, Silian_mode: ConflictMode) {
  Silian_reviewLog("selectModeAction", { revisionId: Silian_revisionId, status: "start", mode: Silian_mode })

  try {
    const { token: Silian_token, authorName: Silian_authorName, authorEmail: Silian_authorEmail } = await Silian_requireReviewAdminContext()

    const Silian_revision = await Silian_prisma.revision.findUnique({
      where: { id: Silian_revisionId },
      include: {
        author: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    if (!Silian_revision) {
      throw new Error("Revision not found")
    }

    if (!Silian_revision.prBranchName) {
      throw new Error("The revision is missing PR metadata")
    }

    const Silian_submitterName = Silian_revision.author?.name || Silian_authorName
    const Silian_submitterEmail = Silian_revision.author?.email || Silian_authorEmail

    const Silian_storedDraftFiles = Silian_decodeStoredDraftFiles({
      content: Silian_revision.content,
      conflictContent: Silian_revision.conflictContent,
      filePath: Silian_revision.filePath,
    })
    const Silian_draftFile = Silian_getActiveDraftFile(Silian_storedDraftFiles)

    Silian_reviewLog("selectModeAction", {
      revisionId: Silian_revisionId,
      prNumber: Silian_revision.githubPrNum,
      status: "loaded",
      mode: Silian_mode,
      fileCount: Silian_storedDraftFiles.files.length,
    })

    if (Silian_mode === "FINE_GRAINED") {
      Silian_reviewLog("selectModeAction", {
        revisionId: Silian_revisionId,
        prNumber: Silian_revision.githubPrNum,
        status: "branch",
        branch: "FINE_GRAINED",
      })
      if (!Silian_revision.baseMainSha || !Silian_revision.syncedMainSha) {
        throw new Error("The revision is missing main SHA metadata")
      }

      const Silian_result =
        Silian_storedDraftFiles.files.length === 1
          ? await Silian_rebaseArticleContent({
              draftId: Silian_revisionId,
              filePath: Silian_draftFile.filePath,
              baseMainSha: Silian_revision.baseMainSha,
              latestMainSha: Silian_revision.syncedMainSha,
              draftContent: Silian_draftFile.content,
              token: Silian_token,
            })
          : await Silian_rebaseArticleContentMultiFile({
              draftId: Silian_revisionId,
              files: Silian_storedDraftFiles.files.map((Silian_file) => ({
                filePath: Silian_file.filePath,
                content: Silian_file.content,
              })),
              baseMainSha: Silian_revision.baseMainSha,
              latestMainSha: Silian_revision.syncedMainSha,
              token: Silian_token,
            })

      Silian_reviewLog("selectModeAction", {
        revisionId: Silian_revisionId,
        prNumber: Silian_revision.githubPrNum,
        status: "rebase-result",
        mode: Silian_mode,
        resultStatus: Silian_result.status,
      })

      if (Silian_result.status === "SUCCESS") {
        const Silian_rebasedDraftFiles = Silian_applyRebasedFilesToDraft(
          Silian_storedDraftFiles,
          Silian_result.files,
          { filePath: Silian_draftFile.filePath, content: Silian_result.finalContent }
        )
        Silian_reviewLog("selectModeAction", {
          revisionId: Silian_revisionId,
          prNumber: Silian_revision.githubPrNum,
          status: "force-push-start",
          prBranchName: Silian_revision.prBranchName,
          fileCount: Silian_rebasedDraftFiles.files.length,
        })
        await Silian_persistRebasedBranchFiles({
          authorEmail: Silian_submitterEmail,
          authorName: Silian_submitterName,
          branchName: Silian_revision.prBranchName,
          files: Silian_rebasedDraftFiles.files.map((Silian_file) => ({
            filePath: Silian_file.filePath,
            content: Silian_file.content,
          })),
          message: `docs: apply fine-grained rebase for ${Silian_revision.title}`,
          token: Silian_token,
        })
        Silian_reviewLog("selectModeAction", {
          revisionId: Silian_revisionId,
          prNumber: Silian_revision.githubPrNum,
          status: "force-push-complete",
          prBranchName: Silian_revision.prBranchName,
        })
        const Silian_rebasedDraftStorage =
          Silian_serializeDraftFilesForStorage(Silian_rebasedDraftFiles)
        Silian_reviewLog("selectModeAction", {
          revisionId: Silian_revisionId,
          prNumber: Silian_revision.githubPrNum,
          status: "db-write-before",
          fields: [
            "status",
            "conflictMode",
            "conflictContent",
            "content",
            "filePath",
          ],
          nextStatus: "IN_REVIEW",
        })
        await Silian_prisma.revision.update({
          where: { id: Silian_revisionId },
          data: {
            status: "IN_REVIEW",
            conflictMode: Silian_mode,
            conflictContent: Silian_rebasedDraftStorage.conflictContent,
            content: Silian_rebasedDraftStorage.content,
            filePath: Silian_rebasedDraftStorage.filePath,
          },
        })
        Silian_reviewLog("selectModeAction", {
          revisionId: Silian_revisionId,
          prNumber: Silian_revision.githubPrNum,
          status: "db-write-after",
          fields: [
            "status",
            "conflictMode",
            "conflictContent",
            "content",
            "filePath",
          ],
          nextStatus: "IN_REVIEW",
        })
      } else if (Silian_result.status === "CONFLICT") {
        const Silian_conflictDraftStorage = Silian_serializeDraftFilesForStorage(
          Silian_applyRebasedFilesToDraft(Silian_storedDraftFiles, Silian_result.files, undefined, {
            filePath: Silian_result.conflictFilePath ?? Silian_draftFile.filePath,
            content: Silian_result.conflictContent,
          })
        )
        Silian_reviewLog("selectModeAction", {
          revisionId: Silian_revisionId,
          prNumber: Silian_revision.githubPrNum,
          status: "branch-decision",
          branch: "CONFLICT",
        })
        Silian_reviewLog("selectModeAction", {
          revisionId: Silian_revisionId,
          prNumber: Silian_revision.githubPrNum,
          status: "db-write-before",
          fields: ["status", "conflictContent", "content", "filePath"],
          nextStatus: "SYNC_CONFLICT",
        })
        await Silian_prisma.revision.update({
          where: { id: Silian_revisionId },
          data: {
            status: "SYNC_CONFLICT",
            conflictContent: Silian_conflictDraftStorage.conflictContent,
            content: Silian_conflictDraftStorage.content,
            filePath: Silian_conflictDraftStorage.filePath,
          },
        })
        Silian_reviewLog("selectModeAction", {
          revisionId: Silian_revisionId,
          prNumber: Silian_revision.githubPrNum,
          status: "db-write-after",
          fields: ["status", "conflictContent", "content", "filePath"],
          nextStatus: "SYNC_CONFLICT",
        })
      } else if (Silian_result.status === "FILE_DELETED_CONFLICT") {
        const Silian_deletedConflictDraftStorage = Silian_serializeDraftFilesForStorage(
          Silian_applyRebasedFilesToDraft(Silian_storedDraftFiles, Silian_result.files)
        )
        Silian_reviewLog("selectModeAction", {
          revisionId: Silian_revisionId,
          prNumber: Silian_revision.githubPrNum,
          status: "branch-decision",
          branch: "FILE_DELETED_CONFLICT",
        })
        Silian_reviewLog("selectModeAction", {
          revisionId: Silian_revisionId,
          prNumber: Silian_revision.githubPrNum,
          status: "db-write-before",
          fields: ["status", "content", "filePath", "conflictContent"],
          nextStatus: "SYNC_CONFLICT",
        })
        await Silian_prisma.revision.update({
          where: { id: Silian_revisionId },
          data: {
            status: "SYNC_CONFLICT",
            content: Silian_deletedConflictDraftStorage.content,
            filePath: Silian_deletedConflictDraftStorage.filePath,
            conflictContent: Silian_deletedConflictDraftStorage.conflictContent,
          },
        })
        Silian_reviewLog("selectModeAction", {
          revisionId: Silian_revisionId,
          prNumber: Silian_revision.githubPrNum,
          status: "db-write-after",
          fields: ["status", "content", "filePath", "conflictContent"],
          nextStatus: "SYNC_CONFLICT",
        })
      } else if (Silian_result.status === "NO_CHANGE") {
        Silian_reviewLog("selectModeAction", {
          revisionId: Silian_revisionId,
          prNumber: Silian_revision.githubPrNum,
          status: "branch-decision",
          branch: "NO_CHANGE",
        })
        Silian_reviewLog("selectModeAction", {
          revisionId: Silian_revisionId,
          prNumber: Silian_revision.githubPrNum,
          status: "db-write-before",
          fields: ["status", "conflictMode", "conflictContent"],
          nextStatus: "IN_REVIEW",
        })
        await Silian_prisma.revision.update({
          where: { id: Silian_revisionId },
          data: {
            status: "IN_REVIEW",
            conflictMode: Silian_mode,
            conflictContent: null,
          },
        })
        Silian_reviewLog("selectModeAction", {
          revisionId: Silian_revisionId,
          prNumber: Silian_revision.githubPrNum,
          status: "db-write-after",
          fields: ["status", "conflictMode", "conflictContent"],
          nextStatus: "IN_REVIEW",
        })
      }

      Silian_revalidatePaths(
        Silian_getReviewRevalidatePaths(Silian_revisionId, Silian_revision.githubPrNum)
      )
      Silian_reviewLog("selectModeAction", {
        revisionId: Silian_revisionId,
        prNumber: Silian_revision.githubPrNum,
        status: "complete",
        mode: Silian_mode,
        resultStatus: Silian_result.status,
        conflictMode: Silian_mode,
      })
      return {
        success: true,
        status: Silian_result.status,
        conflictMode: Silian_mode,
        hasConflicts:
          Silian_result.status === "CONFLICT" ||
          Silian_result.status === "FILE_DELETED_CONFLICT",
        focusFilePath:
          Silian_result.status === "CONFLICT"
            ? (Silian_result.conflictFilePath ?? Silian_draftFile.filePath)
            : null,
      }
    }

    Silian_reviewLog("selectModeAction", {
      revisionId: Silian_revisionId,
      prNumber: Silian_revision.githubPrNum,
      status: "branch",
      branch: "SIMPLE",
    })
    if (!Silian_revision.baseMainSha || !Silian_revision.syncedMainSha) {
      throw new Error("The revision is missing main SHA metadata")
    }

    const Silian_latestMainSha = await Silian_getMainBranchHeadSha(Silian_token)
    const Silian_fileInputs = await Promise.all(
      Silian_storedDraftFiles.files.map(async (Silian_file) => ({
        filePath: Silian_file.filePath,
        baseContent: await Silian_getArticleFileContent(
          Silian_file.filePath,
          Silian_revision.baseMainSha as string,
          Silian_token
        ),
        draftContent: Silian_file.content,
        latestMainContent: await Silian_getArticleFileContent(
          Silian_file.filePath,
          Silian_latestMainSha,
          Silian_token
        ),
      }))
    )
    Silian_reviewLog("selectModeAction", {
      revisionId: Silian_revisionId,
      prNumber: Silian_revision.githubPrNum,
      status: "simple-sha-debug",
      baseMainSha: Silian_summarizeSha(Silian_revision.baseMainSha as string),
      syncedMainSha: Silian_summarizeSha(Silian_revision.syncedMainSha as string),
      latestMainSha: Silian_summarizeSha(Silian_latestMainSha),
      shaMatch: Silian_revision.baseMainSha === Silian_latestMainSha,
    })
    const Silian_result = await Silian_resolveSimpleConflicts({
      files: Silian_fileInputs,
      prBranchName: Silian_revision.prBranchName,
      latestMainSha: Silian_latestMainSha,
      token: Silian_token,
    })
    Silian_reviewLog("selectModeAction", {
      revisionId: Silian_revisionId,
      prNumber: Silian_revision.githubPrNum,
      status: "simple-merge-result",
      hasConflicts: Silian_result.hasConflicts,
      fileResults: Silian_result.fileResults.map((Silian_file) => ({
        filePath: Silian_file.filePath,
        status: Silian_file.status,
        contentLength: Silian_file.content?.length,
      })),
    })

    Silian_reviewLog("selectModeAction", {
      revisionId: Silian_revisionId,
      prNumber: Silian_revision.githubPrNum,
      status: "force-push-start",
      prBranchName: Silian_revision.prBranchName,
      fileCount: Silian_storedDraftFiles.files.length,
      latestMainSha: Silian_summarizeSha(Silian_latestMainSha),
    })
    await Silian_forcePushResolvedToPRBranch({
      resolvedFiles: Silian_storedDraftFiles.files.map((Silian_file) => ({
        filePath: Silian_file.filePath,
        content: Silian_file.content,
      })),
      prBranchName: Silian_revision.prBranchName,
      latestMainSha: Silian_latestMainSha,
      commitMessage: "chore(review): sync draft to PR branch for review",
      authorName: Silian_submitterName,
      authorEmail: Silian_submitterEmail,
      token: Silian_token,
    })
    Silian_reviewLog("selectModeAction", {
      revisionId: Silian_revisionId,
      prNumber: Silian_revision.githubPrNum,
      status: "force-push-complete",
      prBranchName: Silian_revision.prBranchName,
    })

    const Silian_firstConflictFilePath =
      Silian_result.fileResults.find((Silian_file) => Silian_file.status === "conflict")?.filePath ??
      null
    const Silian_mergedDraftFiles = Silian_focusDraftFileByPath(
      Silian_normalizeDraftFileCollection({
        activeFileId: Silian_storedDraftFiles.activeFileId,
        folders: Silian_storedDraftFiles.folders || [],
        files: Silian_storedDraftFiles.files.map((Silian_file) => {
          const Silian_mergedFile = Silian_result.fileResults.find(
            (Silian_candidate) => Silian_candidate.filePath === Silian_file.filePath
          )

          if (!Silian_mergedFile) {
            return Silian_file
          }

          return {
            ...Silian_file,
            content:
              Silian_mergedFile.status === "clean" ? Silian_mergedFile.content : Silian_file.content,
            ...(Silian_mergedFile.status === "conflict"
              ? { conflictContent: Silian_mergedFile.content }
              : { conflictContent: undefined }),
          }
        }),
      }),
      Silian_firstConflictFilePath
    )
    const Silian_mergedDraftStorage = Silian_serializeDraftFilesForStorage(Silian_mergedDraftFiles)

    Silian_reviewLog("selectModeAction", {
      revisionId: Silian_revisionId,
      prNumber: Silian_revision.githubPrNum,
      status: "db-write-before",
      fields: [
        "conflictContent",
        "content",
        "filePath",
        "status",
        "syncedMainSha",
        "conflictMode",
      ],
      nextStatus: Silian_result.hasConflicts ? "SYNC_CONFLICT" : "IN_REVIEW",
      syncedMainSha: Silian_summarizeSha(Silian_latestMainSha),
    })
    await Silian_prisma.revision.update({
      where: { id: Silian_revisionId },
      data: {
        conflictContent: Silian_mergedDraftStorage.conflictContent,
        content: Silian_mergedDraftStorage.content,
        filePath: Silian_mergedDraftStorage.filePath,
        status: Silian_result.hasConflicts ? "SYNC_CONFLICT" : "IN_REVIEW",
        syncedMainSha: Silian_latestMainSha,
        conflictMode: Silian_mode,
      },
    })
    Silian_reviewLog("selectModeAction", {
      revisionId: Silian_revisionId,
      prNumber: Silian_revision.githubPrNum,
      status: "db-write-after",
      fields: [
        "conflictContent",
        "content",
        "filePath",
        "status",
        "syncedMainSha",
        "conflictMode",
      ],
      nextStatus: Silian_result.hasConflicts ? "SYNC_CONFLICT" : "IN_REVIEW",
      syncedMainSha: Silian_summarizeSha(Silian_latestMainSha),
    })

    Silian_revalidatePaths(Silian_getReviewRevalidatePaths(Silian_revisionId, Silian_revision.githubPrNum))

    Silian_reviewLog("selectModeAction", {
      revisionId: Silian_revisionId,
      prNumber: Silian_revision.githubPrNum,
      status: "complete",
      mode: Silian_mode,
      resultStatus: Silian_result.hasConflicts ? "CONFLICT" : "CLEAN",
      conflictMode: Silian_mode,
    })
    return {
      success: true,
      status: Silian_result.hasConflicts ? "CONFLICT" : "CLEAN",
      conflictMode: Silian_mode,
      hasConflicts: Silian_result.hasConflicts,
      focusFilePath: Silian_firstConflictFilePath,
      draftSnapshot: Silian_buildDraftSnapshot(Silian_mergedDraftFiles),
    }
  } catch (Silian_error) {
    Silian_reviewError("selectModeAction", Silian_error, {
      revisionId: Silian_revisionId,
      mode: Silian_mode,
      status: "error",
    })
    throw Silian_error
  }
}

export async function finalizeReviewAction(
  Silian_prNumber: number,
  Silian_options?: {
    commitTitle?: string
    commitBody?: string
    mergeMethod?: ReviewMergeMethod
  }
) {
  Silian_reviewLog("finalizeReviewAction", {
    prNumber: Silian_prNumber,
    status: "start",
    commitTitleProvided: Boolean(Silian_options?.commitTitle),
    commitBodyProvided: Boolean(Silian_options?.commitBody),
    mergeMethod: Silian_options?.mergeMethod ?? "auto",
  })

  try {
    const { token: Silian_token, authorName: Silian_authorName, authorEmail: Silian_authorEmail } = await Silian_requireReviewAdminContext()

    const Silian_revision = await Silian_prisma.revision.findFirst({
      where: { githubPrNum: Silian_prNumber },
      include: {
        author: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    if (!Silian_revision) {
      throw new Error("Linked draft not found")
    }

    const Silian_submitterName = Silian_revision.author?.name || Silian_authorName
    const Silian_submitterEmail = Silian_revision.author?.email || Silian_authorEmail

    const Silian_conflictMode = (Silian_revision as { conflictMode?: ConflictMode | null })
      .conflictMode
    const Silian_rebaseState = Silian_revision.rebaseState as RebaseState | null
    const Silian_storedDraftFiles = Silian_decodeStoredDraftFiles({
      content: Silian_revision.content,
      conflictContent: Silian_revision.conflictContent,
      filePath: Silian_revision.filePath,
    })

    Silian_reviewLog("finalizeReviewAction", {
      prNumber: Silian_prNumber,
      revisionId: Silian_revision.id,
      status: "loaded",
      conflictMode: Silian_conflictMode,
      fileCount: Silian_storedDraftFiles.files.length,
    })

    if (Silian_conflictMode === "SIMPLE") {
      if (!Silian_revision.prBranchName || !Silian_revision.syncedMainSha) {
        throw new Error("The linked draft is missing PR metadata")
      }

      if (
        Silian_storedDraftFiles.files.some((Silian_file) =>
          Silian_hasSimpleConflictMarkers(Silian_file.content)
        )
      ) {
        throw new Error("Resolve all simple conflicts before finalizing review")
      }

      Silian_reviewLog("finalizeReviewAction", {
        prNumber: Silian_prNumber,
        status: "merge-pr-start",
        mode: Silian_conflictMode,
        mergeMethod: Silian_options?.mergeMethod ?? "auto",
      })
      await Silian_mergePR(
        Silian_prNumber,
        {
          mergeMethod: Silian_options?.mergeMethod,
          commitTitle: Silian_options?.commitTitle,
          commitBody: Silian_options?.commitBody,
        },
        Silian_token
      )
      Silian_reviewLog("finalizeReviewAction", {
        prNumber: Silian_prNumber,
        status: "merge-pr-complete",
        mode: Silian_conflictMode,
      })
    } else {
      if (!Silian_revision.prBranchName) {
        throw new Error("The linked draft is missing PR metadata")
      }

      const Silian_latestMainSha = await Silian_getMainBranchHeadSha(Silian_token)
      const Silian_resolvedFiles =
        Silian_rebaseState?.fileStates &&
        Object.keys(Silian_rebaseState.fileStates).length > 0
          ? Object.values(Silian_rebaseState.fileStates).map((Silian_fileState) => ({
              filePath: Silian_fileState.filePath,
              content: Silian_fileState.currentContent,
            }))
          : Silian_storedDraftFiles.files.map((Silian_file) => ({
              filePath: Silian_file.filePath,
              content: Silian_file.content,
            }))

      Silian_reviewLog("finalizeReviewAction", {
        prNumber: Silian_prNumber,
        status: "force-push-start",
        mode: Silian_conflictMode,
        prBranchName: Silian_revision.prBranchName,
        fileCount: Silian_resolvedFiles.length,
        latestMainSha: Silian_summarizeSha(Silian_latestMainSha),
      })
      await Silian_forcePushResolvedToPRBranch({
        resolvedFiles: Silian_resolvedFiles,
        prBranchName: Silian_revision.prBranchName,
        latestMainSha: Silian_latestMainSha,
        authorName: Silian_submitterName,
        authorEmail: Silian_submitterEmail,
        token: Silian_token,
      })
      Silian_reviewLog("finalizeReviewAction", {
        prNumber: Silian_prNumber,
        status: "force-push-complete",
        mode: Silian_conflictMode,
        prBranchName: Silian_revision.prBranchName,
      })

      Silian_reviewLog("finalizeReviewAction", {
        prNumber: Silian_prNumber,
        status: "merge-pr-start",
        mode: Silian_conflictMode,
        mergeMethod: Silian_options?.mergeMethod ?? "auto",
      })
      await Silian_mergePR(
        Silian_prNumber,
        {
          mergeMethod: Silian_options?.mergeMethod,
          commitTitle: Silian_options?.commitTitle,
          commitBody: Silian_options?.commitBody,
        },
        Silian_token
      )
      Silian_reviewLog("finalizeReviewAction", {
        prNumber: Silian_prNumber,
        status: "merge-pr-complete",
        mode: Silian_conflictMode,
      })
    }

    try {
      Silian_reviewLog("finalizeReviewAction", {
        prNumber: Silian_prNumber,
        status: "db-cleanup-start",
        operation: "reconcileDraftAssetsForPRCompletion",
      })
      await Silian_reconcileDraftAssetsForPRCompletion({
        prNumber: Silian_prNumber,
        outcome: "PR-merged",
      })
      Silian_reviewLog("finalizeReviewAction", {
        prNumber: Silian_prNumber,
        status: "db-cleanup-complete",
        operation: "reconcileDraftAssetsForPRCompletion",
      })
    } catch (Silian_reconcileError) {
      Silian_reviewError("finalizeReviewAction", Silian_reconcileError, {
        prNumber: Silian_prNumber,
        status: "db-cleanup-error",
        operation: "reconcileDraftAssetsForPRCompletion",
      })
    }

    Silian_revalidatePaths(Silian_getReviewRevalidatePaths(Silian_revision.id, Silian_prNumber))
    Silian_reviewLog("finalizeReviewAction", {
      prNumber: Silian_prNumber,
      status: "complete",
      conflictMode: Silian_conflictMode,
    })
    return { success: true }
  } catch (Silian_error) {
    Silian_reviewError("finalizeReviewAction", Silian_error, { prNumber: Silian_prNumber, status: "error" })
    throw Silian_error
  }
}

export async function abortResolutionAction(Silian_revisionId: string) {
  Silian_reviewLog("abortResolutionAction", { revisionId: Silian_revisionId, status: "start" })

  try {
    const { token: Silian_token } = await Silian_requireReviewAdminContext()

    const Silian_revision = await Silian_prisma.revision.findUnique({
      where: { id: Silian_revisionId },
    })

    if (!Silian_revision) {
      throw new Error("Revision not found")
    }

    const Silian_conflictMode = (Silian_revision as { conflictMode?: ConflictMode | null })
      .conflictMode

    Silian_reviewLog("abortResolutionAction", {
      revisionId: Silian_revisionId,
      prNumber: Silian_revision.githubPrNum,
      status: "loaded",
      conflictMode: Silian_conflictMode,
    })

    if (Silian_conflictMode === "FINE_GRAINED") {
      Silian_reviewLog("abortResolutionAction", {
        revisionId: Silian_revisionId,
        prNumber: Silian_revision.githubPrNum,
        status: "abort-rebase-start",
        mode: Silian_conflictMode,
      })
      await Silian_abortRebase({
        draftId: Silian_revisionId,
        token: Silian_token,
      })
      Silian_reviewLog("abortResolutionAction", {
        revisionId: Silian_revisionId,
        prNumber: Silian_revision.githubPrNum,
        status: "abort-rebase-complete",
        mode: Silian_conflictMode,
      })
    }

    Silian_reviewLog("abortResolutionAction", {
      revisionId: Silian_revisionId,
      prNumber: Silian_revision.githubPrNum,
      status: "db-write-before",
      fields:
        Silian_conflictMode === "SIMPLE"
          ? ["conflictContent", "status", "conflictMode"]
          : ["status", "conflictMode"],
      nextStatus: "IN_REVIEW",
      nextConflictMode: null,
    })
    await Silian_prisma.revision.update({
      where: { id: Silian_revisionId },
      data: {
        ...(Silian_conflictMode === "SIMPLE" ? { conflictContent: null } : {}),
        status: "IN_REVIEW",
        conflictMode: null,
      } as Silian_Prisma.RevisionUpdateInput,
    })
    Silian_reviewLog("abortResolutionAction", {
      revisionId: Silian_revisionId,
      prNumber: Silian_revision.githubPrNum,
      status: "db-write-after",
      fields:
        Silian_conflictMode === "SIMPLE"
          ? ["conflictContent", "status", "conflictMode"]
          : ["status", "conflictMode"],
      nextStatus: "IN_REVIEW",
      nextConflictMode: null,
    })

    // Decode original draft files and force-push back to PR branch
    Silian_reviewLog("abortResolutionAction", {
      revisionId: Silian_revisionId,
      prNumber: Silian_revision.githubPrNum,
      status: "force-push-start",
    })

    const Silian_storedDraftFiles = Silian_decodeStoredDraftFiles({
      content: Silian_revision.content,
      conflictContent: null,
      filePath: Silian_revision.filePath,
    })

    const Silian_revisionWithAuthor = await Silian_prisma.revision.findFirst({
      where: { id: Silian_revisionId },
      include: { author: { select: { name: true, email: true } } },
    })
    const Silian_submitterName = Silian_revisionWithAuthor?.author?.name ?? "gtmc-bot"
    const Silian_submitterEmail =
      Silian_revisionWithAuthor?.author?.email ?? "gtmc-bot@gtmc.dev"

    const Silian_latestMainSha = await Silian_getMainBranchHeadSha(Silian_token)

    if (Silian_revision.prBranchName) {
      await Silian_forcePushResolvedToPRBranch({
        resolvedFiles: Silian_storedDraftFiles.files.map((Silian_f) => ({
          filePath: Silian_f.filePath,
          content: Silian_f.content,
        })),
        prBranchName: Silian_revision.prBranchName,
        latestMainSha: Silian_latestMainSha,
        commitMessage:
          "chore(review): restore draft branch after resolution abort",
        authorName: Silian_submitterName,
        authorEmail: Silian_submitterEmail,
        token: Silian_token,
      })

      Silian_reviewLog("abortResolutionAction", {
        revisionId: Silian_revisionId,
        prNumber: Silian_revision.githubPrNum,
        status: "force-push-complete",
        prBranchName: Silian_revision.prBranchName,
      })
    }

    Silian_revalidatePaths(Silian_getReviewRevalidatePaths(Silian_revisionId, Silian_revision.githubPrNum))
    Silian_reviewLog("abortResolutionAction", {
      revisionId: Silian_revisionId,
      prNumber: Silian_revision.githubPrNum,
      status: "complete",
      conflictMode: Silian_conflictMode,
    })
    return { success: true }
  } catch (Silian_error) {
    Silian_reviewError("abortResolutionAction", Silian_error, { revisionId: Silian_revisionId, status: "error" })
    throw Silian_error
  }
}
