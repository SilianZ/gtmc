import {
  ARTICLES_REPO_NAME as Silian_ARTICLES_REPO_NAME,
  ARTICLES_REPO_OWNER as Silian_ARTICLES_REPO_OWNER,
  getOctokit as Silian_getOctokit,
} from "@/lib/github/articles-repo"
import { serializeDraftFilesForStorage as Silian_serializeDraftFilesForStorage } from "@/lib/draft-files"
import {
  applyAutoAppliedResolutions as Silian_applyAutoAppliedResolutions,
  autoApplyRerere as Silian_autoApplyRerere,
  parseConflictBlocks as Silian_parseConflictBlocks,
  type ConflictBlock,
} from "@/lib/rerere"
import { Prisma as Silian_Prisma } from "@prisma/client"
import { getMergeLibrary as Silian_getMergeLibrary, type MergeConflictBlock } from "./merge-strategy"
import type {
  FileRebaseState,
  RebaseCommitInfo,
  RebaseState,
} from "../types/rebase"
import { prisma as Silian_prisma } from "@/lib/prisma"

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

export type RebaseRecommendation = "REBASE_RECOMMENDED" | "QUICK_MERGE_OK"

export interface RebaseAnalysis {
  recommendation: RebaseRecommendation
  totalCommits: number
  fileEditCount: number
  commitInfos: RebaseCommitInfo[]
  adminMessage: string
  fileAnalyses?: RebaseFileAnalysis[]
}

export interface RebaseFileAnalysis {
  filePath: string
  fileEditCount: number
  commitInfos: RebaseCommitInfo[]
}

export interface AnalyzeRebaseInput {
  filePath: string
  baseMainSha: string
  latestMainSha: string
  token?: string
}

export interface RebaseInput {
  draftId: string
  filePath: string
  baseMainSha: string
  latestMainSha: string
  draftContent: string
  token?: string
}

export interface MultiFileRebaseInput {
  draftId: string
  files: Array<{ filePath: string; content: string }>
  baseMainSha: string
  latestMainSha: string
  token?: string
}

export interface MultiFileAnalyzeInput {
  files: Array<{ filePath: string }>
  baseMainSha: string
  latestMainSha: string
  token?: string
}

export interface RebasedFileContent {
  filePath: string
  content: string
}

export type RebaseOutcome =
  | {
      status: "SUCCESS"
      finalContent: string
      appliedCommits: RebaseCommitInfo[]
      files?: RebasedFileContent[]
    }
  | {
      status: "CONFLICT"
      conflictContent: string
      conflictBlock: MergeConflictBlock
      conflictCommit: RebaseCommitInfo
      appliedCommits: RebaseCommitInfo[]
      remainingCommitShas: string[]
      files?: RebasedFileContent[]
      conflictFilePath?: string
      rerereApplied?: ConflictBlock[]
    }
  | {
      status: "FILE_DELETED_CONFLICT"
      draftContent: string
      deletedAtCommit: RebaseCommitInfo
      appliedCommits: RebaseCommitInfo[]
      files?: RebasedFileContent[]
      deletedFilePath?: string
    }
  | { status: "NO_CHANGE"; message: string }

export interface AbortRebaseInput {
  draftId: string
  token?: string
}

export type AbortRebaseOutcome =
  | { status: "ABORTED"; originalContent: string }
  | { status: "ERROR"; message: string }

export interface ResumeRebaseInput {
  draftId: string
  resolvedContent?: string
  resolvedFiles?: Array<{ filePath: string; content: string }>
  token?: string
}

export type ResumeRebaseOutcome =
  | {
      status: "SUCCESS"
      finalContent: string
      appliedCommits: RebaseCommitInfo[]
      files?: RebasedFileContent[]
    }
  | {
      status: "CONFLICT"
      conflictContent: string
      conflictBlock: MergeConflictBlock
      conflictCommit: RebaseCommitInfo
      appliedCommits: RebaseCommitInfo[]
      remainingCommitShas: string[]
      files?: RebasedFileContent[]
      conflictFilePath?: string
      rerereApplied?: ConflictBlock[]
    }
  | {
      status: "FILE_DELETED_CONFLICT"
      draftContent: string
      deletedAtCommit: RebaseCommitInfo
      appliedCommits: RebaseCommitInfo[]
      files?: RebasedFileContent[]
      deletedFilePath?: string
    }
  | { status: "ERROR"; message: string }

interface CompareCommitFileInfo {
  sha: string
  info: RebaseCommitInfo
  touchedFilePaths: string[]
}

async function Silian_getFileSnapshot(
  Silian_filePath: string,
  Silian_ref: string,
  Silian_token?: string
): Promise<{ content: string; sha?: string } | null> {
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
    }
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

function Silian_buildFileStates(
  Silian_files: Array<{ filePath: string; content: string }>
): Record<string, FileRebaseState> {
  return Object.fromEntries(
    Silian_files.map((Silian_file) => [
      Silian_file.filePath,
      {
        filePath: Silian_file.filePath,
        status: "pending",
        currentContent: Silian_file.content,
        originalContent: Silian_file.content,
      } satisfies FileRebaseState,
    ])
  )
}

function Silian_fileStatesToFiles(
  Silian_fileStates: Record<string, FileRebaseState> | undefined
): RebasedFileContent[] {
  return Object.values(Silian_fileStates ?? {}).map((Silian_fileState) => ({
    filePath: Silian_fileState.filePath,
    content: Silian_fileState.currentContent,
  }))
}

async function Silian_autoResolveConflictContent(Silian_input: {
  content: string
  filePath: string
  baseContent: string
}): Promise<{
  content: string
  applied: ConflictBlock[]
  remaining: ConflictBlock[]
}> {
  const Silian_blocks = Silian_parseConflictBlocks(
    Silian_input.content,
    Silian_input.filePath,
    Silian_input.baseContent
  )

  Silian_reviewLog("applyRerere", {
    filePath: Silian_input.filePath,
    status: "start",
    blockCount: Silian_blocks.length,
  })

  if (Silian_blocks.length === 0) {
    Silian_reviewLog("applyRerere", {
      filePath: Silian_input.filePath,
      status: "complete",
      matchesFound: 0,
      remainingCount: 0,
    })
    return { content: Silian_input.content, applied: [], remaining: [] }
  }

  const { applied: Silian_applied, remaining: Silian_remaining } = await Silian_autoApplyRerere(Silian_blocks)

  Silian_reviewLog("applyRerere", {
    filePath: Silian_input.filePath,
    status: "complete",
    matchesFound: Silian_applied.length,
    remainingCount: Silian_remaining.length,
  })

  return {
    content: Silian_applyAutoAppliedResolutions(Silian_input.content, Silian_applied),
    applied: Silian_applied,
    remaining: Silian_remaining,
  }
}

function Silian_conflictBlockFromRerere(Silian_block: ConflictBlock): MergeConflictBlock {
  return {
    type: "conflict",
    ours: Silian_block.ours.replace(/\n$/, "").split("\n"),
    base: Silian_block.base.replace(/\n$/, "").split("\n"),
    theirs: Silian_block.theirs.replace(/\n$/, "").split("\n"),
  }
}

async function Silian_getCompareCommitFileInfos(Silian_input: {
  filePaths: string[]
  baseMainSha: string
  latestMainSha: string
  token?: string
}): Promise<{
  totalCommits: number
  commitFileInfos: CompareCommitFileInfo[]
}> {
  const { filePaths: Silian_filePaths, baseMainSha: Silian_baseMainSha, latestMainSha: Silian_latestMainSha, token: Silian_token } = Silian_input

  if (Silian_baseMainSha === Silian_latestMainSha) {
    return { totalCommits: 0, commitFileInfos: [] }
  }

  const Silian_trackedPaths = new Set(Silian_filePaths)
  const Silian_octokit = Silian_getOctokit(Silian_token)

  const { data: Silian_compareData } = await Silian_octokit.repos.compareCommits({
    owner: Silian_ARTICLES_REPO_OWNER,
    repo: Silian_ARTICLES_REPO_NAME,
    base: Silian_baseMainSha,
    head: Silian_latestMainSha,
  })

  const Silian_commitFileInfos: CompareCommitFileInfo[] = []

  for (const Silian_commit of Silian_compareData.commits) {
    const { data: Silian_commitData } = await Silian_octokit.repos.getCommit({
      owner: Silian_ARTICLES_REPO_OWNER,
      repo: Silian_ARTICLES_REPO_NAME,
      ref: Silian_commit.sha,
    })

    const Silian_touchedFilePaths =
      Silian_commitData.files
        ?.map((Silian_file) => Silian_file.filename)
        .filter((Silian_filePath): Silian_filePath is string => Silian_trackedPaths.has(Silian_filePath)) ??
      []

    if (Silian_touchedFilePaths.length === 0) {
      continue
    }

    Silian_commitFileInfos.push({
      sha: Silian_commit.sha,
      info: {
        sha: Silian_commit.sha,
        message: Silian_commit.commit.message,
        author: Silian_commit.commit.author?.name || "Unknown",
        timestamp: Silian_commit.commit.author?.date || new Date().toISOString(),
      },
      touchedFilePaths: Silian_touchedFilePaths,
    })
  }

  return {
    totalCommits: Silian_compareData.commits.length,
    commitFileInfos: Silian_commitFileInfos,
  }
}

async function Silian_analyzeRebaseNeedInternal(Silian_input: {
  filePaths: string[]
  baseMainSha: string
  latestMainSha: string
  token?: string
}): Promise<RebaseAnalysis> {
  const { filePaths: Silian_filePaths, baseMainSha: Silian_baseMainSha, latestMainSha: Silian_latestMainSha, token: Silian_token } = Silian_input

  if (Silian_baseMainSha === Silian_latestMainSha) {
    return {
      recommendation: "QUICK_MERGE_OK",
      totalCommits: 0,
      fileEditCount: 0,
      commitInfos: [],
      adminMessage: "No changes in main since draft was created.",
      fileAnalyses: Silian_filePaths.map((Silian_filePath) => ({
        filePath: Silian_filePath,
        fileEditCount: 0,
        commitInfos: [],
      })),
    }
  }

  const { totalCommits: Silian_totalCommits, commitFileInfos: Silian_commitFileInfos } = await Silian_getCompareCommitFileInfos({
    filePaths: Silian_filePaths,
    baseMainSha: Silian_baseMainSha,
    latestMainSha: Silian_latestMainSha,
    token: Silian_token,
  })

  const Silian_perFileCommits = new Map<string, RebaseCommitInfo[]>()
  for (const Silian_filePath of Silian_filePaths) {
    Silian_perFileCommits.set(Silian_filePath, [])
  }

  for (const Silian_commit of Silian_commitFileInfos) {
    for (const Silian_filePath of Silian_commit.touchedFilePaths) {
      Silian_perFileCommits.get(Silian_filePath)?.push(Silian_commit.info)
    }
  }

  const Silian_fileAnalyses = Silian_filePaths.map((Silian_filePath) => ({
    filePath: Silian_filePath,
    fileEditCount: Silian_perFileCommits.get(Silian_filePath)?.length ?? 0,
    commitInfos: Silian_perFileCommits.get(Silian_filePath) ?? [],
  }))

  const Silian_fileEditCount = Silian_fileAnalyses.reduce(
    (Silian_sum, Silian_analysis) => Silian_sum + Silian_analysis.fileEditCount,
    0
  )
  const Silian_recommendation: RebaseRecommendation = Silian_fileAnalyses.some(
    (Silian_analysis) => Silian_analysis.fileEditCount >= 2
  )
    ? "REBASE_RECOMMENDED"
    : "QUICK_MERGE_OK"

  const Silian_adminMessage =
    Silian_recommendation === "REBASE_RECOMMENDED"
      ? `Main modified ${Silian_fileAnalyses.filter((Silian_analysis) => Silian_analysis.fileEditCount > 0).length || "no"} tracked file${Silian_fileAnalyses.filter((Silian_analysis) => Silian_analysis.fileEditCount > 0).length === 1 ? "" : "s"} across ${Silian_fileEditCount} file-level edit${Silian_fileEditCount === 1 ? "" : "s"}. Fine-grained rebase is recommended.`
      : `Main modified the tracked files in ${Silian_fileEditCount === 0 ? "no" : Silian_fileEditCount} file-level edit${Silian_fileEditCount === 1 ? "" : "s"}. A quick merge should suffice.`

  return {
    recommendation: Silian_recommendation,
    totalCommits: Silian_totalCommits,
    fileEditCount: Silian_fileEditCount,
    commitInfos: Silian_commitFileInfos.map((Silian_commit) => Silian_commit.info),
    adminMessage: Silian_adminMessage,
    fileAnalyses: Silian_fileAnalyses,
  }
}

async function Silian_applyRebaseCommits(Silian_input: {
  draftId: string
  filePath: string
  token?: string
  rebaseState: RebaseState
  startIndex: number
  startingContent: string
  previousSha: string
  appliedCommitsBefore: RebaseCommitInfo[]
}): Promise<
  Extract<
    RebaseOutcome | ResumeRebaseOutcome,
    { status: "SUCCESS" | "CONFLICT" | "FILE_DELETED_CONFLICT" }
  >
> {
  const {
    draftId: Silian_draftId,
    filePath: Silian_filePath,
    token: Silian_token,
    rebaseState: Silian_rebaseState,
    startIndex: Silian_startIndex,
    startingContent: Silian_startingContent,
    previousSha: Silian_initialPreviousSha,
    appliedCommitsBefore: Silian_appliedCommitsBefore,
  } = Silian_input

  let Silian_currentContent = Silian_startingContent
  let Silian_previousSha = Silian_initialPreviousSha
  const Silian_appliedCommits = [...Silian_appliedCommitsBefore]

  for (let Silian_i = Silian_startIndex; Silian_i < Silian_rebaseState.commitInfos.length; Silian_i++) {
    const Silian_commit = Silian_rebaseState.commitInfos[Silian_i]
    Silian_reviewLog("rebaseArticleContent", {
      draftId: Silian_draftId,
      filePath: Silian_filePath,
      status: "process-commit",
      commitIndex: Silian_i,
      commitSha: Silian_summarizeSha(Silian_commit.sha),
    })
    const Silian_baseSnapshot = await Silian_getFileSnapshot(Silian_filePath, Silian_previousSha, Silian_token)
    const Silian_latestSnapshot = await Silian_getFileSnapshot(Silian_filePath, Silian_commit.sha, Silian_token)

    if (!Silian_baseSnapshot) {
      // Missing base is unexpected — skip this commit
      continue
    }

    if (!Silian_latestSnapshot) {
      // File was deleted in this commit but draft has content — deletion conflict
      const Silian_deletedState: RebaseState = {
        ...Silian_rebaseState,
        status: "CONFLICT",
        currentCommitIndex: Silian_i,
        conflictedCommitSha: Silian_commit.sha,
      }
      Silian_reviewLog("rebaseArticleContent", {
        draftId: Silian_draftId,
        filePath: Silian_filePath,
        status: "db-write-before",
        branch: "FILE_DELETED_CONFLICT",
        commitSha: Silian_summarizeSha(Silian_commit.sha),
      })
      await Silian_prisma.revision.update({
        where: { id: Silian_draftId },
        data: { rebaseState: Silian_deletedState as unknown as Silian_Prisma.InputJsonValue },
      })
      Silian_reviewLog("rebaseArticleContent", {
        draftId: Silian_draftId,
        filePath: Silian_filePath,
        status: "db-write-after",
        branch: "FILE_DELETED_CONFLICT",
        commitSha: Silian_summarizeSha(Silian_commit.sha),
      })
      return {
        status: "FILE_DELETED_CONFLICT",
        draftContent: Silian_currentContent,
        deletedAtCommit: Silian_commit,
        appliedCommits: Silian_appliedCommits,
      }
    }

    const Silian_mergeResult = Silian_getMergeLibrary().merge({
      baseContent: Silian_baseSnapshot.content,
      draftContent: Silian_currentContent,
      latestMainContent: Silian_latestSnapshot.content,
    })

    if (Silian_mergeResult.conflict) {
      const Silian_conflictBlock = Silian_mergeResult.blocks.find(
        (Silian_b) => Silian_b.type === "conflict"
      ) as MergeConflictBlock
      const Silian_rerereResult = await Silian_autoResolveConflictContent({
        content: Silian_mergeResult.content,
        filePath: Silian_filePath,
        baseContent: Silian_baseSnapshot.content,
      })

      if (
        Silian_rerereResult.remaining.length === 0 &&
        Silian_rerereResult.applied.length > 0
      ) {
        Silian_reviewLog("rebaseArticleContent", {
          draftId: Silian_draftId,
          filePath: Silian_filePath,
          status: "commit-auto-resolved",
          commitSha: Silian_summarizeSha(Silian_commit.sha),
          matchesFound: Silian_rerereResult.applied.length,
        })
        Silian_currentContent = Silian_rerereResult.content
        Silian_appliedCommits.push(Silian_commit)
        Silian_previousSha = Silian_commit.sha
        continue
      }

      const Silian_remainingCommitShas = Silian_rebaseState.commitInfos
        .slice(Silian_i + 1)
        .map((Silian_c) => Silian_c.sha)

      const Silian_conflictState: RebaseState = {
        ...Silian_rebaseState,
        status: "CONFLICT",
        currentCommitIndex: Silian_i,
        conflictedCommitSha: Silian_commit.sha,
        resolvedContent: undefined,
        rerereApplied: Silian_rerereResult.applied,
      }

      Silian_reviewLog("rebaseArticleContent", {
        draftId: Silian_draftId,
        filePath: Silian_filePath,
        status: "db-write-before",
        branch: "CONFLICT",
        commitSha: Silian_summarizeSha(Silian_commit.sha),
      })
      await Silian_prisma.revision.update({
        where: { id: Silian_draftId },
        data: {
          rebaseState: Silian_conflictState as unknown as Silian_Prisma.InputJsonValue,
        },
      })
      Silian_reviewLog("rebaseArticleContent", {
        draftId: Silian_draftId,
        filePath: Silian_filePath,
        status: "db-write-after",
        branch: "CONFLICT",
        commitSha: Silian_summarizeSha(Silian_commit.sha),
      })

      Silian_reviewLog("rebaseArticleContent", {
        draftId: Silian_draftId,
        filePath: Silian_filePath,
        status: "conflict-detected",
        commitSha: Silian_summarizeSha(Silian_commit.sha),
        rerereAppliedCount: Silian_rerereResult.applied.length,
      })

      return {
        status: "CONFLICT",
        conflictContent: Silian_rerereResult.content,
        conflictBlock:
          Silian_rerereResult.remaining[0] !== undefined
            ? Silian_conflictBlockFromRerere(Silian_rerereResult.remaining[0])
            : Silian_conflictBlock,
        conflictCommit: Silian_commit,
        appliedCommits: Silian_appliedCommits,
        remainingCommitShas: Silian_remainingCommitShas,
        rerereApplied: Silian_rerereResult.applied,
      }
    }

    Silian_currentContent = Silian_mergeResult.content
    Silian_appliedCommits.push(Silian_commit)
    Silian_previousSha = Silian_commit.sha
  }

  const Silian_completedState: RebaseState = {
    ...Silian_rebaseState,
    status: "COMPLETED",
    currentCommitIndex: Silian_rebaseState.commitInfos.length,
    conflictedCommitSha: undefined,
    resolvedContent: Silian_currentContent,
  }

  Silian_reviewLog("rebaseArticleContent", {
    draftId: Silian_draftId,
    filePath: Silian_filePath,
    status: "db-write-before",
    branch: "COMPLETED",
    commitCount: Silian_rebaseState.commitInfos.length,
  })
  await Silian_prisma.revision.update({
    where: { id: Silian_draftId },
    data: {
      rebaseState: Silian_completedState as unknown as Silian_Prisma.InputJsonValue,
    },
  })
  Silian_reviewLog("rebaseArticleContent", {
    draftId: Silian_draftId,
    filePath: Silian_filePath,
    status: "db-write-after",
    branch: "COMPLETED",
    commitCount: Silian_rebaseState.commitInfos.length,
  })

  Silian_reviewLog("rebaseArticleContent", {
    draftId: Silian_draftId,
    filePath: Silian_filePath,
    status: "complete",
    resultStatus: "SUCCESS",
    appliedCommitCount: Silian_appliedCommits.length,
  })

  return {
    status: "SUCCESS",
    finalContent: Silian_currentContent,
    appliedCommits: Silian_appliedCommits,
  }
}

async function Silian_applyRebaseCommitsMultiFile(Silian_input: {
  draftId: string
  token?: string
  rebaseState: RebaseState
  startIndex: number
  previousSha: string
  appliedCommitsBefore: RebaseCommitInfo[]
}): Promise<
  Extract<
    RebaseOutcome | ResumeRebaseOutcome,
    { status: "SUCCESS" | "CONFLICT" | "FILE_DELETED_CONFLICT" }
  >
> {
  const {
    draftId: Silian_draftId,
    token: Silian_token,
    rebaseState: Silian_rebaseState,
    startIndex: Silian_startIndex,
    previousSha: Silian_initialPreviousSha,
  } = Silian_input

  const Silian_fileStates = Object.fromEntries(
    Object.entries(Silian_rebaseState.fileStates ?? {}).map(
      ([Silian_filePath, Silian_fileState]) => [Silian_filePath, { ...Silian_fileState }]
    )
  )
  const Silian_trackedFilePaths = Object.keys(Silian_fileStates)
  const Silian_appliedCommits = [...Silian_input.appliedCommitsBefore]
  const Silian_octokit = Silian_getOctokit(Silian_token)
  let Silian_previousSha = Silian_initialPreviousSha

  for (let Silian_i = Silian_startIndex; Silian_i < Silian_rebaseState.commitInfos.length; Silian_i++) {
    const Silian_commit = Silian_rebaseState.commitInfos[Silian_i]
    const { data: Silian_commitData } = await Silian_octokit.repos.getCommit({
      owner: Silian_ARTICLES_REPO_OWNER,
      repo: Silian_ARTICLES_REPO_NAME,
      ref: Silian_commit.sha,
    })

    const Silian_touchedFilePaths =
      Silian_commitData.files
        ?.map((Silian_file) => Silian_file.filename)
        .filter((Silian_filePath): Silian_filePath is string =>
          Silian_trackedFilePaths.includes(Silian_filePath)
        ) ?? []

    for (const Silian_filePath of Silian_touchedFilePaths) {
      Silian_fileStates[Silian_filePath] = {
        ...Silian_fileStates[Silian_filePath],
        status: "in_progress",
      }
    }

    for (const Silian_filePath of Silian_touchedFilePaths) {
      const Silian_currentFileState = Silian_fileStates[Silian_filePath]
      const Silian_baseSnapshot = await Silian_getFileSnapshot(Silian_filePath, Silian_previousSha, Silian_token)
      const Silian_latestSnapshot = await Silian_getFileSnapshot(Silian_filePath, Silian_commit.sha, Silian_token)

      if (!Silian_latestSnapshot) {
        const Silian_nextFileStates: Record<string, FileRebaseState> = {
          ...Silian_fileStates,
          [Silian_filePath]: {
            ...Silian_currentFileState,
            status: "conflict" as const,
          },
        }
        const Silian_deletedState: RebaseState = {
          ...Silian_rebaseState,
          status: "CONFLICT",
          currentCommitIndex: Silian_i,
          conflictedCommitSha: Silian_commit.sha,
          fileStates: Silian_nextFileStates,
        }
        await Silian_prisma.revision.update({
          where: { id: Silian_draftId },
          data: {
            rebaseState: Silian_deletedState as unknown as Silian_Prisma.InputJsonValue,
          },
        })
        return {
          status: "FILE_DELETED_CONFLICT",
          draftContent: Silian_currentFileState.currentContent,
          deletedAtCommit: Silian_commit,
          appliedCommits: Silian_appliedCommits,
          files: Silian_fileStatesToFiles(Silian_nextFileStates),
          deletedFilePath: Silian_filePath,
        }
      }

      const Silian_mergeResult = Silian_getMergeLibrary().merge({
        baseContent: Silian_baseSnapshot?.content ?? "",
        draftContent: Silian_currentFileState.currentContent,
        latestMainContent: Silian_latestSnapshot.content,
      })

      if (Silian_mergeResult.conflict) {
        const Silian_conflictBlock = Silian_mergeResult.blocks.find(
          (Silian_block) => Silian_block.type === "conflict"
        ) as MergeConflictBlock
        const Silian_rerereResult = await Silian_autoResolveConflictContent({
          content: Silian_mergeResult.content,
          filePath: Silian_filePath,
          baseContent: Silian_baseSnapshot?.content ?? "",
        })

        if (
          Silian_rerereResult.remaining.length === 0 &&
          Silian_rerereResult.applied.length > 0
        ) {
          Silian_fileStates[Silian_filePath] = {
            ...Silian_currentFileState,
            status: "completed",
            currentContent: Silian_rerereResult.content,
          }
          continue
        }

        const Silian_remainingCommitShas = Silian_rebaseState.commitInfos
          .slice(Silian_i + 1)
          .map((Silian_nextCommit) => Silian_nextCommit.sha)
        const Silian_nextFileStates: Record<string, FileRebaseState> = {
          ...Silian_fileStates,
          [Silian_filePath]: {
            ...Silian_currentFileState,
            status: "conflict" as const,
          },
        }
        const Silian_conflictState: RebaseState = {
          ...Silian_rebaseState,
          status: "CONFLICT",
          currentCommitIndex: Silian_i,
          conflictedCommitSha: Silian_commit.sha,
          resolvedContent: undefined,
          fileStates: Silian_nextFileStates,
          rerereApplied: Silian_rerereResult.applied,
        }

        await Silian_prisma.revision.update({
          where: { id: Silian_draftId },
          data: {
            rebaseState: Silian_conflictState as unknown as Silian_Prisma.InputJsonValue,
          },
        })

        return {
          status: "CONFLICT",
          conflictContent: Silian_rerereResult.content,
          conflictBlock:
            Silian_rerereResult.remaining[0] !== undefined
              ? Silian_conflictBlockFromRerere(Silian_rerereResult.remaining[0])
              : Silian_conflictBlock,
          conflictCommit: Silian_commit,
          appliedCommits: Silian_appliedCommits,
          remainingCommitShas: Silian_remainingCommitShas,
          files: Silian_fileStatesToFiles(Silian_nextFileStates),
          conflictFilePath: Silian_filePath,
          rerereApplied: Silian_rerereResult.applied,
        }
      }

      Silian_fileStates[Silian_filePath] = {
        ...Silian_currentFileState,
        status: "completed",
        currentContent: Silian_mergeResult.content,
      }
    }

    Silian_appliedCommits.push(Silian_commit)
    Silian_previousSha = Silian_commit.sha
  }

  const Silian_completedState: RebaseState = {
    ...Silian_rebaseState,
    status: "COMPLETED",
    currentCommitIndex: Silian_rebaseState.commitInfos.length,
    conflictedCommitSha: undefined,
    resolvedContent: Silian_serializeDraftFilesForStorage({
      activeFileId: Object.values(Silian_fileStates)[0]?.filePath ?? "",
      folders: [],
      files: Silian_fileStatesToFiles(Silian_fileStates).map((Silian_file) => ({
        id: Silian_file.filePath,
        filePath: Silian_file.filePath,
        content: Silian_file.content,
      })),
    }).content,
    fileStates: Silian_fileStates,
  }

  await Silian_prisma.revision.update({
    where: { id: Silian_draftId },
    data: {
      rebaseState: Silian_completedState as unknown as Silian_Prisma.InputJsonValue,
    },
  })

  return {
    status: "SUCCESS",
    finalContent: Object.values(Silian_fileStates)[0]?.currentContent ?? "",
    appliedCommits: Silian_appliedCommits,
    files: Silian_fileStatesToFiles(Silian_fileStates),
  }
}

export async function rebaseArticleContent(
  Silian_input: RebaseInput
): Promise<RebaseOutcome> {
  const { draftId: Silian_draftId, filePath: Silian_filePath, baseMainSha: Silian_baseMainSha, latestMainSha: Silian_latestMainSha, draftContent: Silian_draftContent, token: Silian_token } =
    Silian_input

  Silian_reviewLog("rebaseArticleContent", {
    draftId: Silian_draftId,
    filePath: Silian_filePath,
    status: "start",
    fileCount: 1,
    baseMainSha: Silian_summarizeSha(Silian_baseMainSha),
    latestMainSha: Silian_summarizeSha(Silian_latestMainSha),
  })

  if (Silian_baseMainSha === Silian_latestMainSha) {
    Silian_reviewLog("rebaseArticleContent", {
      draftId: Silian_draftId,
      filePath: Silian_filePath,
      status: "branch-decision",
      branch: "NO_CHANGE",
      reason: "same-main-sha",
    })
    return { status: "NO_CHANGE", message: "No commits to rebase" }
  }

  const Silian_octokit = Silian_getOctokit(Silian_token)

  const { data: Silian_compareData } = await Silian_octokit.repos.compareCommits({
    owner: Silian_ARTICLES_REPO_OWNER,
    repo: Silian_ARTICLES_REPO_NAME,
    base: Silian_baseMainSha,
    head: Silian_latestMainSha,
  })

  const Silian_relevantCommits: RebaseCommitInfo[] = []
  for (const Silian_commit of Silian_compareData.commits) {
    const { data: Silian_commitData } = await Silian_octokit.repos.getCommit({
      owner: Silian_ARTICLES_REPO_OWNER,
      repo: Silian_ARTICLES_REPO_NAME,
      ref: Silian_commit.sha,
    })

    const Silian_modifiedFile = Silian_commitData.files?.some((Silian_f) => Silian_f.filename === Silian_filePath)
    if (Silian_modifiedFile) {
      Silian_relevantCommits.push({
        sha: Silian_commit.sha,
        message: Silian_commit.commit.message,
        author: Silian_commit.commit.author?.name || "Unknown",
        timestamp: Silian_commit.commit.author?.date || new Date().toISOString(),
      })
    }
  }

  if (Silian_relevantCommits.length === 0) {
    Silian_reviewLog("rebaseArticleContent", {
      draftId: Silian_draftId,
      filePath: Silian_filePath,
      status: "branch-decision",
      branch: "NO_CHANGE",
      reason: "no-relevant-commits",
      commitCount: Silian_compareData.commits.length,
    })
    return { status: "NO_CHANGE", message: "No commits modified this file" }
  }

  const Silian_initialState: RebaseState = {
    status: "IN_PROGRESS",
    commitShas: Silian_relevantCommits.map((Silian_c) => Silian_c.sha),
    currentCommitIndex: 0,
    originalContent: Silian_draftContent,
    commitInfos: Silian_relevantCommits,
  }

  Silian_reviewLog("rebaseArticleContent", {
    draftId: Silian_draftId,
    filePath: Silian_filePath,
    status: "db-write-before",
    branch: "IN_PROGRESS",
    commitCount: Silian_relevantCommits.length,
  })
  await Silian_prisma.revision.update({
    where: { id: Silian_draftId },
    data: {
      rebaseState: Silian_initialState as unknown as Silian_Prisma.InputJsonValue,
    },
  })
  Silian_reviewLog("rebaseArticleContent", {
    draftId: Silian_draftId,
    filePath: Silian_filePath,
    status: "db-write-after",
    branch: "IN_PROGRESS",
    commitCount: Silian_relevantCommits.length,
  })

  return Silian_applyRebaseCommits({
    draftId: Silian_draftId,
    filePath: Silian_filePath,
    token: Silian_token,
    rebaseState: Silian_initialState,
    startIndex: 0,
    startingContent: Silian_draftContent,
    previousSha: Silian_baseMainSha,
    appliedCommitsBefore: [],
  })
}

export async function rebaseArticleContentMultiFile(
  Silian_input: MultiFileRebaseInput
): Promise<RebaseOutcome> {
  const { draftId: Silian_draftId, files: Silian_files, baseMainSha: Silian_baseMainSha, latestMainSha: Silian_latestMainSha, token: Silian_token } = Silian_input

  Silian_reviewLog("rebaseArticleContentMultiFile", {
    draftId: Silian_draftId,
    status: "start",
    fileCount: Silian_files.length,
    baseMainSha: Silian_summarizeSha(Silian_baseMainSha),
    latestMainSha: Silian_summarizeSha(Silian_latestMainSha),
  })

  if (Silian_baseMainSha === Silian_latestMainSha) {
    Silian_reviewLog("rebaseArticleContentMultiFile", {
      draftId: Silian_draftId,
      status: "branch-decision",
      branch: "NO_CHANGE",
      reason: "same-main-sha",
    })
    return { status: "NO_CHANGE", message: "No commits to rebase" }
  }

  const Silian_normalizedFiles = Silian_files.filter((Silian_file) => Silian_file.filePath)
  const { commitFileInfos: Silian_commitFileInfos } = await Silian_getCompareCommitFileInfos({
    filePaths: Silian_normalizedFiles.map((Silian_file) => Silian_file.filePath),
    baseMainSha: Silian_baseMainSha,
    latestMainSha: Silian_latestMainSha,
    token: Silian_token,
  })

  if (Silian_commitFileInfos.length === 0) {
    Silian_reviewLog("rebaseArticleContentMultiFile", {
      draftId: Silian_draftId,
      status: "branch-decision",
      branch: "NO_CHANGE",
      reason: "no-relevant-commits",
      fileCount: Silian_normalizedFiles.length,
    })
    return { status: "NO_CHANGE", message: "No commits modified these files" }
  }

  const Silian_draftStorage = Silian_serializeDraftFilesForStorage({
    activeFileId: Silian_normalizedFiles[0]?.filePath ?? "",
    folders: [],
    files: Silian_normalizedFiles.map((Silian_file) => ({
      id: Silian_file.filePath,
      filePath: Silian_file.filePath,
      content: Silian_file.content,
    })),
  })

  const Silian_initialState: RebaseState = {
    status: "IN_PROGRESS",
    commitShas: Silian_commitFileInfos.map((Silian_commit) => Silian_commit.sha),
    currentCommitIndex: 0,
    originalContent: Silian_draftStorage.content,
    commitInfos: Silian_commitFileInfos.map((Silian_commit) => Silian_commit.info),
    fileStates: Silian_buildFileStates(Silian_normalizedFiles),
  }

  Silian_reviewLog("rebaseArticleContentMultiFile", {
    draftId: Silian_draftId,
    status: "db-write-before",
    branch: "IN_PROGRESS",
    commitCount: Silian_commitFileInfos.length,
    fileCount: Silian_normalizedFiles.length,
  })
  await Silian_prisma.revision.update({
    where: { id: Silian_draftId },
    data: {
      rebaseState: Silian_initialState as unknown as Silian_Prisma.InputJsonValue,
    },
  })
  Silian_reviewLog("rebaseArticleContentMultiFile", {
    draftId: Silian_draftId,
    status: "db-write-after",
    branch: "IN_PROGRESS",
    commitCount: Silian_commitFileInfos.length,
    fileCount: Silian_normalizedFiles.length,
  })

  return Silian_applyRebaseCommitsMultiFile({
    draftId: Silian_draftId,
    token: Silian_token,
    rebaseState: Silian_initialState,
    startIndex: 0,
    previousSha: Silian_baseMainSha,
    appliedCommitsBefore: [],
  })
}

export async function abortRebase(
  Silian_input: AbortRebaseInput
): Promise<AbortRebaseOutcome> {
  Silian_reviewLog("abortRebase", { draftId: Silian_input.draftId, status: "start" })
  const Silian_revision = await Silian_prisma.revision.findUnique({
    where: { id: Silian_input.draftId },
  })

  const Silian_rebaseState = (Silian_revision?.rebaseState as RebaseState | null) ?? null

  if (
    !Silian_rebaseState ||
    (Silian_rebaseState.status !== "IN_PROGRESS" && Silian_rebaseState.status !== "CONFLICT")
  ) {
    Silian_reviewLog("abortRebase", {
      draftId: Silian_input.draftId,
      status: "branch-decision",
      branch: "NO_ACTIVE_REBASE",
    })
    return { status: "ERROR", message: "No active rebase to abort" }
  }

  const Silian_originalContent = Silian_rebaseState.originalContent

  Silian_reviewLog("abortRebase", {
    draftId: Silian_input.draftId,
    status: "db-write-before",
    fields: ["content", "conflictContent", "status", "rebaseState"],
    nextStatus: "IN_REVIEW",
  })
  await Silian_prisma.revision.update({
    where: { id: Silian_input.draftId },
    data: {
      content: Silian_originalContent,
      conflictContent: null,
      status: "IN_REVIEW",
      rebaseState: {
        ...Silian_rebaseState,
        status: "ABORTED",
      } as unknown as Silian_Prisma.InputJsonValue,
    } as Silian_Prisma.RevisionUpdateInput,
  })

  Silian_reviewLog("abortRebase", {
    draftId: Silian_input.draftId,
    status: "db-write-after",
    fields: ["content", "conflictContent", "status", "rebaseState"],
    nextStatus: "IN_REVIEW",
    restoredContentLength: Silian_originalContent.length,
  })

  Silian_reviewLog("abortRebase", {
    draftId: Silian_input.draftId,
    status: "complete",
  })

  return { status: "ABORTED", originalContent: Silian_originalContent }
}

export async function resumeRebase(
  Silian_input: ResumeRebaseInput
): Promise<ResumeRebaseOutcome> {
  const Silian_revision = await Silian_prisma.revision.findUnique({
    where: { id: Silian_input.draftId },
  })

  if (!Silian_revision) {
    return { status: "ERROR", message: "No conflict to resume from" }
  }

  const Silian_rebaseState = (Silian_revision.rebaseState as RebaseState | null) ?? null

  if (!Silian_rebaseState || Silian_rebaseState.status !== "CONFLICT") {
    return { status: "ERROR", message: "No conflict to resume from" }
  }

  const Silian_conflictedCommitSha =
    Silian_rebaseState.conflictedCommitSha ||
    Silian_rebaseState.commitShas[Silian_rebaseState.currentCommitIndex]

  if (!Silian_conflictedCommitSha) {
    return { status: "ERROR", message: "No conflict to resume from" }
  }

  if (
    Silian_rebaseState.fileStates &&
    Object.keys(Silian_rebaseState.fileStates).length > 0
  ) {
    const Silian_resolvedFilesMap = new Map(
      (Silian_input.resolvedFiles ?? []).map((Silian_file) => [Silian_file.filePath, Silian_file.content])
    )
    const Silian_nextFileStates: Record<string, FileRebaseState> = Object.fromEntries(
      Object.entries(Silian_rebaseState.fileStates).map(([Silian_filePath, Silian_fileState]) => [
        Silian_filePath,
        {
          ...Silian_fileState,
          currentContent:
            Silian_resolvedFilesMap.get(Silian_filePath) ??
            (Silian_fileState.status === "conflict"
              ? (Silian_input.resolvedContent ?? Silian_fileState.currentContent)
              : Silian_fileState.currentContent),
          status:
            Silian_fileState.status === "conflict"
              ? ("completed" as const)
              : Silian_fileState.status,
        },
      ])
    )

    return Silian_applyRebaseCommitsMultiFile({
      draftId: Silian_input.draftId,
      token: Silian_input.token,
      rebaseState: {
        ...Silian_rebaseState,
        status: "IN_PROGRESS",
        fileStates: Silian_nextFileStates,
      },
      startIndex: Silian_rebaseState.currentCommitIndex + 1,
      previousSha: Silian_conflictedCommitSha,
      appliedCommitsBefore: Silian_rebaseState.commitInfos.slice(
        0,
        Silian_rebaseState.currentCommitIndex
      ),
    })
  }

  const Silian_filePath = (Silian_revision as { filePath?: string }).filePath
  if (!Silian_filePath) {
    return { status: "ERROR", message: "No conflict to resume from" }
  }

  const Silian_appliedCommitsBefore = Silian_rebaseState.commitInfos.slice(
    0,
    Silian_rebaseState.currentCommitIndex
  )

  return Silian_applyRebaseCommits({
    draftId: Silian_input.draftId,
    filePath: Silian_filePath,
    token: Silian_input.token,
    rebaseState: Silian_rebaseState,
    startIndex: Silian_rebaseState.currentCommitIndex + 1,
    startingContent: Silian_input.resolvedContent ?? "",
    previousSha: Silian_conflictedCommitSha,
    appliedCommitsBefore: Silian_appliedCommitsBefore,
  })
}

export async function analyzeRebaseNeedMultiFile(
  Silian_input: MultiFileAnalyzeInput
): Promise<RebaseAnalysis> {
  return Silian_analyzeRebaseNeedInternal({
    filePaths: Silian_input.files.map((Silian_file) => Silian_file.filePath),
    baseMainSha: Silian_input.baseMainSha,
    latestMainSha: Silian_input.latestMainSha,
    token: Silian_input.token,
  })
}

export async function analyzeRebaseNeed(
  Silian_input: AnalyzeRebaseInput
): Promise<RebaseAnalysis> {
  const Silian_result = await Silian_analyzeRebaseNeedInternal({
    filePaths: [Silian_input.filePath],
    baseMainSha: Silian_input.baseMainSha,
    latestMainSha: Silian_input.latestMainSha,
    token: Silian_input.token,
  })

  return {
    recommendation: Silian_result.recommendation,
    totalCommits: Silian_result.totalCommits,
    fileEditCount: Silian_result.fileEditCount,
    commitInfos: Silian_result.commitInfos,
    adminMessage:
      Silian_result.commitInfos.length >= 2
        ? `The article was modified in ${Silian_result.fileEditCount} separate commits. Fine-grained rebase is recommended to resolve each change individually.`
        : `The article was modified in ${Silian_result.fileEditCount === 0 ? "no" : "1"} commit. A quick merge should suffice.`,
    fileAnalyses: Silian_result.fileAnalyses,
  }
}
