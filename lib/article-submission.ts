import { mergeDiff3 as Silian_mergeDiff3 } from "node-diff3"

import {
  ARTICLES_REPO_NAME as Silian_ARTICLES_REPO_NAME,
  ARTICLES_REPO_OWNER as Silian_ARTICLES_REPO_OWNER,
  getOctokit as Silian_getOctokit,
} from "@/lib/github/articles-repo"
import {
  analyzeRebaseNeed as Silian_analyzeRebaseNeed,
  analyzeRebaseNeedMultiFile as Silian_analyzeRebaseNeedMultiFile,
} from "@/lib/article-rebase"
import type { RebaseAnalysis } from "@/lib/article-rebase"
import {
  getActiveDraftFile as Silian_getActiveDraftFile,
  getDuplicateDraftFilePaths as Silian_getDuplicateDraftFilePaths,
  normalizeDraftFileCollection as Silian_normalizeDraftFileCollection,
  type DraftFileRecord,
} from "@/lib/draft-files"
import {
  applyAutoAppliedResolutions as Silian_applyAutoAppliedResolutions,
  autoApplyRerere as Silian_autoApplyRerere,
  parseConflictBlocks as Silian_parseConflictBlocks,
  type ConflictBlock,
} from "@/lib/rerere"
import { getMergeLibrary as Silian_getMergeLibrary } from "@/lib/merge-strategy"

const Silian_MAIN_BRANCH = "main"

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
        ? { name: Silian_error.name, message: Silian_error.message, stack: Silian_error.stack }
        : Silian_error,
  })
}

function Silian_summarizeSha(Silian_sha?: string | null) {
  return Silian_sha ? Silian_sha.slice(0, 7) : null
}

type DraftSyncStatus = "IN_REVIEW" | "SYNC_CONFLICT"

interface FileSnapshot {
  content: string
  sha?: string
}

export type BranchFileEntry = {
  path: string
  content: string | Buffer
  encoding?: "utf-8" | "base64"
}

interface DraftSubmissionInput {
  activeFileId?: string
  draftId: string
  title: string
  files: DraftFileRecord[]
  imageEntries?: BranchFileEntry[]
  baseMainSha: string
  authorName: string
  authorEmail: string
  token?: string
}

interface DraftResolutionInput {
  activeFileId?: string
  branchName: string
  title: string
  files: DraftFileRecord[]
  syncedMainSha?: string | null
  authorName: string
  authorEmail: string
  token?: string
}

export interface DraftSyncResult {
  activeFileId: string
  branchName: string
  content: string
  conflictContent: string | null
  filePath: string
  files: DraftFileRecord[]
  prNumber: number
  prUrl: string
  status: DraftSyncStatus
  syncedMainSha: string
  rebaseAnalysis?: RebaseAnalysis
}

export interface SimpleResolutionInput {
  files: Array<{
    filePath: string
    baseContent: string
    draftContent: string
    latestMainContent: string
  }>
  prBranchName: string
  latestMainSha: string
  token?: string
}

export interface SimpleResolutionResult {
  fileResults: Array<{
    filePath: string
    status: "clean" | "conflict"
    content: string
    rerereApplied?: ConflictBlock[]
  }>
  hasConflicts: boolean
}

export interface ForcePushInput {
  resolvedFiles: Array<{ filePath: string; content: string }>
  prBranchName: string
  latestMainSha: string
  commitMessage?: string
  authorName?: string
  authorEmail?: string
  token?: string
}

export async function getMainBranchHeadSha(Silian_token?: string) {
  Silian_reviewLog("getMainBranchHeadSha", { status: "start" })
  const Silian_octokit = Silian_getOctokit(Silian_token)
  Silian_reviewLog("getMainBranchHeadSha", {
    status: "github-api-before",
    operation: "git.getRef",
    ref: `heads/${Silian_MAIN_BRANCH}`,
  })
  const { data: Silian_data } = await Silian_octokit.git.getRef({
    owner: Silian_ARTICLES_REPO_OWNER,
    repo: Silian_ARTICLES_REPO_NAME,
    ref: `heads/${Silian_MAIN_BRANCH}`,
  })

  Silian_reviewLog("getMainBranchHeadSha", {
    status: "complete",
    sha: Silian_summarizeSha(Silian_data.object.sha),
  })

  return Silian_data.object.sha
}

export async function getArticleFileContent(
  Silian_filePath: string,
  Silian_ref: string,
  Silian_token?: string
) {
  return (await Silian_getFileSnapshot(Silian_filePath, Silian_ref, Silian_token))?.content ?? ""
}

export async function resolveSimpleConflicts(
  Silian_input: SimpleResolutionInput
): Promise<SimpleResolutionResult> {
  const Silian_mergeLibrary = Silian_getMergeLibrary()
  const Silian_fileResults = await Promise.all(
    Silian_input.files.map(async (Silian_file) => {
      const Silian_result = Silian_mergeLibrary.merge({
        baseContent: Silian_file.baseContent,
        draftContent: Silian_file.draftContent,
        latestMainContent: Silian_file.latestMainContent,
      })

      if (!Silian_result.conflict) {
        return {
          filePath: Silian_file.filePath,
          status: "clean" as const,
          content: Silian_result.content,
        }
      }

      const Silian_blocks = Silian_parseConflictBlocks(
        Silian_result.content,
        Silian_file.filePath,
        Silian_file.baseContent
      )
      const { applied: Silian_applied, remaining: Silian_remaining } = await Silian_autoApplyRerere(Silian_blocks)
      const Silian_resolvedContent = Silian_applyAutoAppliedResolutions(
        Silian_result.content,
        Silian_applied
      )

      return {
        filePath: Silian_file.filePath,
        status:
          Silian_remaining.length === 0 ? ("clean" as const) : ("conflict" as const),
        content: Silian_resolvedContent,
        ...(Silian_applied.length > 0 ? { rerereApplied: Silian_applied } : {}),
      }
    })
  )

  return {
    fileResults: Silian_fileResults,
    hasConflicts: Silian_fileResults.some((Silian_result) => Silian_result.status === "conflict"),
  }
}

export async function forcePushResolvedToPRBranch({
  resolvedFiles: Silian_resolvedFiles,
  prBranchName: Silian_prBranchName,
  latestMainSha: Silian_latestMainSha,
  commitMessage: Silian_commitMessage,
  authorName: Silian_authorName,
  authorEmail: Silian_authorEmail,
  token: Silian_token,
}: ForcePushInput): Promise<{ newSha: string }> {
  Silian_reviewLog("forcePushResolvedToPRBranch", {
    status: "start",
    prBranchName: Silian_prBranchName,
    fileCount: Silian_resolvedFiles.length,
    latestMainSha: Silian_summarizeSha(Silian_latestMainSha),
  })
  const Silian_octokit = Silian_getOctokit(Silian_token)
  Silian_reviewLog("forcePushResolvedToPRBranch", {
    status: "github-api-before",
    operation: "git.getCommit",
    prBranchName: Silian_prBranchName,
    commitSha: Silian_summarizeSha(Silian_latestMainSha),
  })
  const { data: Silian_latestMainCommit } = await Silian_octokit.git.getCommit({
    owner: Silian_ARTICLES_REPO_OWNER,
    repo: Silian_ARTICLES_REPO_NAME,
    commit_sha: Silian_latestMainSha,
  })
  Silian_reviewLog("forcePushResolvedToPRBranch", {
    status: "github-api-after",
    operation: "git.getCommit",
    treeSha: Silian_summarizeSha(Silian_latestMainCommit.tree.sha),
  })

  const Silian_tree = await Promise.all(
    Silian_resolvedFiles.map(async (Silian_file) => {
      const { data: Silian_blob } = await Silian_octokit.git.createBlob({
        owner: Silian_ARTICLES_REPO_OWNER,
        repo: Silian_ARTICLES_REPO_NAME,
        content: Silian_file.content,
        encoding: "utf-8",
      })

      return {
        path: Silian_file.filePath,
        mode: "100644" as const,
        type: "blob" as const,
        sha: Silian_blob.sha,
      }
    })
  )

  Silian_reviewLog("forcePushResolvedToPRBranch", {
    status: "github-api-before",
    operation: "git.createTree",
    prBranchName: Silian_prBranchName,
    entryCount: Silian_tree.length,
  })
  const { data: Silian_createdTree } = await Silian_octokit.git.createTree({
    owner: Silian_ARTICLES_REPO_OWNER,
    repo: Silian_ARTICLES_REPO_NAME,
    base_tree: Silian_latestMainCommit.tree.sha,
    tree: Silian_tree,
  })
  Silian_reviewLog("forcePushResolvedToPRBranch", {
    status: "github-api-after",
    operation: "git.createTree",
    treeSha: Silian_summarizeSha(Silian_createdTree.sha),
  })

  Silian_reviewLog("forcePushResolvedToPRBranch", {
    status: "github-api-before",
    operation: "git.createCommit",
    prBranchName: Silian_prBranchName,
    parentSha: Silian_summarizeSha(Silian_latestMainSha),
    commitMessage: Silian_commitMessage || "docs: apply resolved review files",
  })
  const { data: Silian_newCommit } = await Silian_octokit.git.createCommit({
    owner: Silian_ARTICLES_REPO_OWNER,
    repo: Silian_ARTICLES_REPO_NAME,
    message: Silian_commitMessage || "docs: apply resolved review files",
    tree: Silian_createdTree.sha,
    parents: [Silian_latestMainSha],
    ...(Silian_authorName && Silian_authorEmail
      ? { author: { name: Silian_authorName, email: Silian_authorEmail } }
      : {}),
  })
  Silian_reviewLog("forcePushResolvedToPRBranch", {
    status: "github-api-after",
    operation: "git.createCommit",
    newCommitSha: Silian_summarizeSha(Silian_newCommit.sha),
  })

  Silian_reviewLog("forcePushResolvedToPRBranch", {
    status: "github-api-before",
    operation: "git.updateRef",
    prBranchName: Silian_prBranchName,
    newCommitSha: Silian_summarizeSha(Silian_newCommit.sha),
  })
  await Silian_octokit.git.updateRef({
    owner: Silian_ARTICLES_REPO_OWNER,
    repo: Silian_ARTICLES_REPO_NAME,
    ref: `heads/${Silian_prBranchName}`,
    sha: Silian_newCommit.sha,
    force: true,
  })
  Silian_reviewLog("forcePushResolvedToPRBranch", {
    status: "github-api-after",
    operation: "git.updateRef",
    prBranchName: Silian_prBranchName,
    newCommitSha: Silian_summarizeSha(Silian_newCommit.sha),
  })

  Silian_reviewLog("forcePushResolvedToPRBranch", {
    status: "complete",
    prBranchName: Silian_prBranchName,
    newSha: Silian_summarizeSha(Silian_newCommit.sha),
  })

  return { newSha: Silian_newCommit.sha }
}

export async function resolveArticleFilePath(
  Silian_filePath: string,
  Silian_refs: string[],
  Silian_token?: string
) {
  const Silian_normalizedPath = Silian_filePath.replace(/^\/+/, "")
  const Silian_withoutExtension = Silian_normalizedPath.replace(/\.md$/i, "")
  const Silian_candidates = Silian_normalizedPath.endsWith(".md")
    ? [Silian_normalizedPath, Silian_withoutExtension, `${Silian_withoutExtension}/README.md`]
    : [
        Silian_normalizedPath,
        `${Silian_withoutExtension}.md`,
        `${Silian_withoutExtension}/README.md`,
      ]

  for (const Silian_ref of Silian_refs) {
    for (const Silian_candidate of Silian_candidates) {
      const Silian_snapshot = await Silian_getFileSnapshot(Silian_candidate, Silian_ref, Silian_token)
      if (Silian_snapshot) {
        return Silian_candidate
      }
    }
  }

  return Silian_normalizedPath.endsWith(".md")
    ? Silian_normalizedPath
    : `${Silian_withoutExtension}.md`
}

export async function openDraftPullRequest({
  activeFileId: Silian_activeFileId,
  draftId: Silian_draftId,
  title: Silian_title,
  files: Silian_files,
  imageEntries: Silian_imageEntries,
  baseMainSha: Silian_baseMainSha,
  authorName: Silian_authorName,
  authorEmail: Silian_authorEmail,
  token: Silian_token,
}: DraftSubmissionInput): Promise<DraftSyncResult> {
  const Silian_octokit = Silian_getOctokit(Silian_token)
  const Silian_latestMainSha = await getMainBranchHeadSha(Silian_token)
  const Silian_resolvedDraftFiles = await Promise.all(
    Silian_files.map(async (Silian_file) => ({
      ...Silian_file,
      filePath: await resolveArticleFilePath(
        Silian_file.filePath,
        [Silian_baseMainSha, Silian_latestMainSha],
        Silian_token
      ),
    }))
  )
  const Silian_normalizedFiles = Silian_normalizeDraftFileCollection({
    activeFileId: Silian_activeFileId,
    files: Silian_resolvedDraftFiles,
  })
  const Silian_duplicateResolvedPaths = Silian_getDuplicateDraftFilePaths(
    Silian_normalizedFiles.files
  )
  if (Silian_duplicateResolvedPaths.length > 0) {
    throw new Error(
      `Duplicate resolved file paths are not allowed: ${Silian_duplicateResolvedPaths.join(", ")}`
    )
  }
  const Silian_branchName = Silian_buildBranchName(Silian_draftId)

  await Silian_octokit.git.createRef({
    owner: Silian_ARTICLES_REPO_OWNER,
    repo: Silian_ARTICLES_REPO_NAME,
    ref: `refs/heads/${Silian_branchName}`,
    sha: Silian_baseMainSha,
  })

  for (const [Silian_index, Silian_file] of Silian_normalizedFiles.files.entries()) {
    await upsertFileOnBranch({
      authorEmail: Silian_authorEmail,
      authorName: Silian_authorName,
      branchName: Silian_branchName,
      content: Silian_file.content,
      filePath: Silian_file.filePath,
      message: Silian_index === 0 ? `docs: ${Silian_title}` : `docs: update ${Silian_file.filePath}`,
      token: Silian_token,
    })
  }

  if (Silian_imageEntries && Silian_imageEntries.length > 0) {
    await upsertFilesOnBranch(Silian_token as string, Silian_imageEntries, Silian_branchName)
  }

  const { data: Silian_pr } = await Silian_octokit.pulls.create({
    owner: Silian_ARTICLES_REPO_OWNER,
    repo: Silian_ARTICLES_REPO_NAME,
    title: Silian_title,
    head: Silian_branchName,
    base: Silian_MAIN_BRANCH,
    body: `由 ${Silian_authorName} 提交审核。`,
  })

  const Silian_primaryFile = Silian_getActiveDraftFile(Silian_normalizedFiles)

  if (Silian_latestMainSha === Silian_baseMainSha) {
    return {
      activeFileId: Silian_normalizedFiles.activeFileId,
      branchName: Silian_branchName,
      content: Silian_primaryFile.content,
      conflictContent: null,
      filePath: Silian_primaryFile.filePath,
      files: Silian_normalizedFiles.files,
      prNumber: Silian_pr.number,
      prUrl: Silian_pr.html_url,
      status: "IN_REVIEW",
      syncedMainSha: Silian_latestMainSha,
    }
  }

  const Silian_rebaseAnalysis =
    Silian_normalizedFiles.files.length === 1
      ? await Silian_analyzeRebaseNeed({
          filePath: Silian_normalizedFiles.files[0].filePath,
          baseMainSha: Silian_baseMainSha,
          latestMainSha: Silian_latestMainSha,
          token: Silian_token,
        })
      : await Silian_analyzeRebaseNeedMultiFile({
          files: Silian_normalizedFiles.files.map((Silian_file) => ({
            filePath: Silian_file.filePath,
          })),
          baseMainSha: Silian_baseMainSha,
          latestMainSha: Silian_latestMainSha,
          token: Silian_token,
        })

  let Silian_hasConflict = false
  const Silian_mergedFiles: DraftFileRecord[] = []

  for (const Silian_file of Silian_normalizedFiles.files) {
    const Silian_baseSnapshot = await Silian_getFileSnapshot(
      Silian_file.filePath,
      Silian_baseMainSha,
      Silian_token
    )
    const Silian_latestSnapshot = await Silian_getFileSnapshot(
      Silian_file.filePath,
      Silian_latestMainSha,
      Silian_token
    )
    const Silian_mergeResult = Silian_mergeArticleContent({
      baseContent: Silian_baseSnapshot?.content ?? "",
      draftContent: Silian_file.content,
      latestMainContent: Silian_latestSnapshot?.content ?? "",
    })

    if (Silian_mergeResult.conflict) {
      Silian_hasConflict = true
      Silian_mergedFiles.push({
        ...Silian_file,
        conflictContent: Silian_mergeResult.content,
      })
      continue
    }

    if (Silian_mergeResult.content !== Silian_file.content) {
      await upsertFileOnBranch({
        authorEmail: Silian_authorEmail,
        authorName: Silian_authorName,
        branchName: Silian_branchName,
        content: Silian_mergeResult.content,
        filePath: Silian_file.filePath,
        message: `docs: sync ${Silian_file.filePath} with latest ${Silian_MAIN_BRANCH}`,
        token: Silian_token,
      })
    }

    Silian_mergedFiles.push({
      ...Silian_file,
      content: Silian_mergeResult.content,
    })
  }

  const Silian_nextFiles = Silian_normalizeDraftFileCollection({
    activeFileId: Silian_normalizedFiles.activeFileId,
    files: Silian_mergedFiles,
  })
  const Silian_nextPrimaryFile = Silian_getActiveDraftFile(Silian_nextFiles)

  return {
    activeFileId: Silian_nextFiles.activeFileId,
    branchName: Silian_branchName,
    content: Silian_nextPrimaryFile.content,
    conflictContent: Silian_nextPrimaryFile.conflictContent || null,
    filePath: Silian_nextPrimaryFile.filePath,
    files: Silian_nextFiles.files,
    prNumber: Silian_pr.number,
    prUrl: Silian_pr.html_url,
    status: Silian_hasConflict ? "SYNC_CONFLICT" : "IN_REVIEW",
    syncedMainSha: Silian_latestMainSha,
    rebaseAnalysis: Silian_rebaseAnalysis,
  }
}

export async function resolveDraftSyncConflict({
  activeFileId: Silian_activeFileId,
  branchName: Silian_branchName,
  title: Silian_title,
  files: Silian_files,
  syncedMainSha: Silian_syncedMainSha,
  authorName: Silian_authorName,
  authorEmail: Silian_authorEmail,
  token: Silian_token,
}: DraftResolutionInput) {
  const Silian_MAX_RETRIES = 3
  const Silian_normalizedFiles = Silian_normalizeDraftFileCollection({
    activeFileId: Silian_activeFileId,
    files: Silian_files,
  })

  for (let Silian_attempt = 0; Silian_attempt < Silian_MAX_RETRIES; Silian_attempt++) {
    const Silian_latestMainSha = await getMainBranchHeadSha(Silian_token)
    let Silian_nextStatus: DraftSyncStatus = "IN_REVIEW"
    const Silian_nextFiles: DraftFileRecord[] = []

    for (const Silian_file of Silian_normalizedFiles.files) {
      const Silian_resolvedFilePath = await resolveArticleFilePath(
        Silian_file.filePath,
        [Silian_latestMainSha],
        Silian_token
      )
      let Silian_nextFile: DraftFileRecord = {
        ...Silian_file,
        conflictContent: undefined,
        filePath: Silian_resolvedFilePath,
      }

      if (Silian_syncedMainSha && Silian_syncedMainSha !== Silian_latestMainSha) {
        const Silian_previousMainSnapshot = await Silian_getFileSnapshot(
          Silian_resolvedFilePath,
          Silian_syncedMainSha,
          Silian_token
        )
        const Silian_latestMainSnapshot = await Silian_getFileSnapshot(
          Silian_resolvedFilePath,
          Silian_latestMainSha,
          Silian_token
        )
        const Silian_mergeResult = Silian_mergeArticleContent({
          baseContent: Silian_previousMainSnapshot?.content ?? "",
          draftContent: Silian_file.content,
          latestMainContent: Silian_latestMainSnapshot?.content ?? "",
        })

        Silian_nextFile = {
          ...Silian_nextFile,
          content: Silian_mergeResult.conflict ? Silian_file.content : Silian_mergeResult.content,
          ...(Silian_mergeResult.conflict
            ? { conflictContent: Silian_mergeResult.content }
            : {}),
        }

        if (Silian_mergeResult.conflict) {
          Silian_nextStatus = "SYNC_CONFLICT"
        }
      }

      Silian_nextFiles.push(Silian_nextFile)
    }

    const Silian_resolvedFiles = Silian_normalizeDraftFileCollection({
      activeFileId: Silian_normalizedFiles.activeFileId,
      files: Silian_nextFiles,
    })
    const Silian_duplicateResolvedPaths = Silian_getDuplicateDraftFilePaths(
      Silian_resolvedFiles.files
    )
    if (Silian_duplicateResolvedPaths.length > 0) {
      throw new Error(
        `Duplicate resolved file paths are not allowed: ${Silian_duplicateResolvedPaths.join(", ")}`
      )
    }

    if (Silian_nextStatus === "IN_REVIEW") {
      for (const [Silian_index, Silian_file] of Silian_resolvedFiles.files.entries()) {
        await upsertFileOnBranch({
          authorEmail: Silian_authorEmail,
          authorName: Silian_authorName,
          branchName: Silian_branchName,
          content: Silian_file.content,
          filePath: Silian_file.filePath,
          message:
            Silian_index === 0
              ? `docs: resolve sync conflict for ${Silian_title}`
              : `docs: update ${Silian_file.filePath} after conflict resolution`,
          token: Silian_token,
        })
      }
    }

    const Silian_verifiedMainSha = await getMainBranchHeadSha(Silian_token)
    if (Silian_verifiedMainSha === Silian_latestMainSha) {
      const Silian_primaryFile = Silian_getActiveDraftFile(Silian_resolvedFiles)
      return {
        activeFileId: Silian_resolvedFiles.activeFileId,
        content: Silian_primaryFile.content,
        conflictContent: Silian_primaryFile.conflictContent || null,
        filePath: Silian_primaryFile.filePath,
        files: Silian_resolvedFiles.files,
        status: Silian_nextStatus,
        syncedMainSha: Silian_latestMainSha,
      }
    }

    if (Silian_attempt < Silian_MAX_RETRIES - 1) {
      await Silian_sleep(2 ** Silian_attempt * 100)
    }
  }

  throw new Error("Max retries exceeded: main branch is too active")
}

function Silian_sleep(Silian_ms: number) {
  return new Promise<void>((Silian_resolve) => {
    setTimeout(Silian_resolve, Silian_ms)
  })
}

function Silian_buildBranchName(Silian_draftId: string) {
  return `submission-${Silian_draftId}-${Date.now()}`.replace(/[^a-zA-Z0-9/_-]/g, "-")
}

function Silian_mergeArticleContent({
  baseContent: Silian_baseContent,
  draftContent: Silian_draftContent,
  latestMainContent: Silian_latestMainContent,
}: {
  baseContent: string
  draftContent: string
  latestMainContent: string
}) {
  const Silian_result = Silian_mergeDiff3(
    Silian_splitLines(Silian_draftContent),
    Silian_splitLines(Silian_baseContent),
    Silian_splitLines(Silian_latestMainContent),
    {
      label: {
        a: "draft",
        o: "base",
        b: Silian_MAIN_BRANCH,
      },
    }
  )

  return {
    conflict: Silian_result.conflict,
    content: Silian_joinLines(Silian_result.result),
  }
}

function Silian_splitLines(Silian_content: string) {
  if (!Silian_content) {
    return [] as string[]
  }

  return Silian_content.replace(/\r\n/g, "\n").split("\n")
}

function Silian_joinLines(Silian_lines: string[]) {
  return Silian_lines.join("\n")
}

async function Silian_getFileSnapshot(Silian_filePath: string, Silian_ref: string, Silian_token?: string) {
  const Silian_octokit = Silian_getOctokit(Silian_token)

  try {
    const { data: Silian_data } = await Silian_octokit.repos.getContent({
      owner: Silian_ARTICLES_REPO_OWNER,
      repo: Silian_ARTICLES_REPO_NAME,
      path: Silian_filePath,
      ref: Silian_ref,
    })

    if (Array.isArray(Silian_data) || Silian_data.type !== "file") {
      return null
    }

    return {
      content: Buffer.from(Silian_data.content, "base64").toString("utf-8"),
      sha: Silian_data.sha,
    } satisfies FileSnapshot
  } catch (Silian_error) {
    Silian_reviewError("getFileSnapshot", Silian_error, {
      filePath: Silian_filePath,
      ref: Silian_summarizeSha(Silian_ref),
      status: "github-api-error",
      operation: "repos.getContent",
    })
    return null
  }
}

export async function upsertFileOnBranch({
  authorEmail: Silian_authorEmail,
  authorName: Silian_authorName,
  branchName: Silian_branchName,
  content: Silian_content,
  filePath: Silian_filePath,
  message: Silian_message,
  token: Silian_token,
}: {
  authorEmail: string
  authorName: string
  branchName: string
  content: string
  filePath: string
  message: string
  token?: string
}) {
  const Silian_octokit = Silian_getOctokit(Silian_token)
  const Silian_snapshot = await Silian_getFileSnapshot(Silian_filePath, Silian_branchName, Silian_token)

  await Silian_octokit.repos.createOrUpdateFileContents({
    owner: Silian_ARTICLES_REPO_OWNER,
    repo: Silian_ARTICLES_REPO_NAME,
    path: Silian_filePath,
    message: Silian_message,
    content: Buffer.from(Silian_content).toString("base64"),
    branch: Silian_branchName,
    sha: Silian_snapshot?.sha,
    author: { name: Silian_authorName, email: Silian_authorEmail },
  })
}

export async function upsertFilesOnBranch(
  Silian_token: string,
  Silian_entries: BranchFileEntry[],
  Silian_branchName: string
): Promise<void> {
  if (Silian_entries.length === 0) {
    return
  }

  const Silian_octokit = Silian_getOctokit(Silian_token)
  const { data: Silian_refData } = await Silian_octokit.git.getRef({
    owner: Silian_ARTICLES_REPO_OWNER,
    repo: Silian_ARTICLES_REPO_NAME,
    ref: `heads/${Silian_branchName}`,
  })
  const Silian_latestCommitSha = Silian_refData.object.sha

  const { data: Silian_commitData } = await Silian_octokit.git.getCommit({
    owner: Silian_ARTICLES_REPO_OWNER,
    repo: Silian_ARTICLES_REPO_NAME,
    commit_sha: Silian_latestCommitSha,
  })
  const Silian_currentTreeSha = Silian_commitData.tree.sha

  const Silian_blobEntries = await Promise.all(
    Silian_entries.map(async (Silian_entry) => {
      const Silian_usesBase64 =
        Buffer.isBuffer(Silian_entry.content) || Silian_entry.encoding === "base64"
      const Silian_blobEncoding: "utf-8" | "base64" = Silian_usesBase64 ? "base64" : "utf-8"
      const Silian_blobContent = Buffer.isBuffer(Silian_entry.content)
        ? Silian_entry.content.toString("base64")
        : Silian_entry.content

      const { data: Silian_blobData } = await Silian_octokit.git.createBlob({
        owner: Silian_ARTICLES_REPO_OWNER,
        repo: Silian_ARTICLES_REPO_NAME,
        content: Silian_blobContent,
        encoding: Silian_blobEncoding,
      })

      return {
        path: Silian_entry.path,
        mode: "100644" as const,
        type: "blob" as const,
        sha: Silian_blobData.sha,
      }
    })
  )

  const { data: Silian_treeData } = await Silian_octokit.git.createTree({
    owner: Silian_ARTICLES_REPO_OWNER,
    repo: Silian_ARTICLES_REPO_NAME,
    base_tree: Silian_currentTreeSha,
    tree: Silian_blobEntries,
  })

  const { data: Silian_createdCommit } = await Silian_octokit.git.createCommit({
    owner: Silian_ARTICLES_REPO_OWNER,
    repo: Silian_ARTICLES_REPO_NAME,
    message: `docs: update ${Silian_entries.length} draft file${Silian_entries.length === 1 ? "" : "s"}`,
    tree: Silian_treeData.sha,
    parents: [Silian_latestCommitSha],
  })

  await Silian_octokit.git.updateRef({
    owner: Silian_ARTICLES_REPO_OWNER,
    repo: Silian_ARTICLES_REPO_NAME,
    ref: `heads/${Silian_branchName}`,
    sha: Silian_createdCommit.sha,
  })
}
