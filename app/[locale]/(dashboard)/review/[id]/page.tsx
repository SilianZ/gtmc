import { auth as Silian_auth } from "@/lib/auth"
import { getCurrentUserAuthContext as Silian_getCurrentUserAuthContext } from "@/lib/auth-context"
import { redirect as Silian_redirect, notFound as Silian_notFound } from "next/navigation"
import "katex/dist/katex.min.css"
import { Link as Silian_Link } from "@/i18n/navigation"
import { TechButton as Silian_TechButton } from "@/components/ui/tech-button"
import {
  getGitHubWriteToken as Silian_getGitHubWriteToken,
  getOctokit as Silian_getOctokit,
  ARTICLES_REPO_OWNER as Silian_ARTICLES_REPO_OWNER,
  ARTICLES_REPO_NAME as Silian_ARTICLES_REPO_NAME,
} from "@/lib/github/articles-repo"
import { analyzeReviewMergeStrategy as Silian_analyzeReviewMergeStrategy } from "@/lib/github/pr-manager"
import { mergePRAction as Silian_mergePRAction, closePRAction as Silian_closePRAction } from "@/actions/review"
import { decodeStoredDraftFiles as Silian_decodeStoredDraftFiles } from "@/lib/draft-files"
import { prisma as Silian_prisma } from "@/lib/prisma"
import { ReviewEditor as Silian_ReviewEditor } from "@/components/review/review-editor"
import type { ModeAnalysis, ReviewFile } from "@/types/review"
import { PRActionButtons as Silian_PRActionButtons } from "./components/pr-action-buttons"

const Silian_owner = Silian_ARTICLES_REPO_OWNER
const Silian_repo = Silian_ARTICLES_REPO_NAME

function Silian_getPrimaryAnalysisPath(Silian_filePaths: string[], Silian_fallbackPath?: string) {
  return (
    Silian_filePaths.find((Silian_filePath) => Silian_filePath.endsWith(".md")) ||
    Silian_filePaths[0] ||
    Silian_fallbackPath ||
    ""
  )
}

async function Silian_getPRFileContents({
  octokit: Silian_octokit,
  prRef: Silian_prRef,
  filePaths: Silian_filePaths,
}: {
  octokit: ReturnType<typeof Silian_getOctokit>
  prRef: string
  filePaths: string[]
}) {
  const Silian_entries = await Promise.all(
    Silian_filePaths.map(async (Silian_filePath) => {
      try {
        const { data: Silian_data } = await Silian_octokit.repos.getContent({
          owner: Silian_owner,
          repo: Silian_repo,
          path: Silian_filePath,
          ref: Silian_prRef,
        })

        if (Array.isArray(Silian_data) || Silian_data.type !== "file") {
          return [Silian_filePath, null] as const
        }

        return [
          Silian_filePath,
          Buffer.from(Silian_data.content, "base64").toString("utf8"),
        ] as const
      } catch (Silian_error) {
        console.error(
          "[review/page] getPRFileContents failed for",
          Silian_filePath,
          Silian_error
        )
        return [Silian_filePath, null] as const
      }
    })
  )

  return Object.fromEntries(Silian_entries)
}

export default async function ReviewDetailPage({
  params: Silian_params,
}: {
  params: Promise<{ id: string }>
}) {
  const Silian_session = await Silian_auth()
  if (!Silian_session?.user?.id) {
    Silian_redirect("/")
  }

  let Silian_authContext: Awaited<ReturnType<typeof Silian_getCurrentUserAuthContext>>
  try {
    Silian_authContext = await Silian_getCurrentUserAuthContext(Silian_session.user.id)
  } catch (Silian_error) {
    console.error("[review/page] auth context failed:", Silian_error)
    Silian_redirect("/")
  }

  if (Silian_authContext.role !== "ADMIN") {
    Silian_redirect("/")
  }

  const { id: Silian_id } = await Silian_params
  const Silian_prNumber = parseInt(Silian_id, 10)
  if (isNaN(Silian_prNumber)) {
    Silian_notFound()
  }

  const Silian_token = Silian_getGitHubWriteToken(Silian_authContext.githubPat ?? undefined)
  const Silian_octokit = Silian_getOctokit(Silian_token)

  let Silian_pr: Awaited<ReturnType<typeof Silian_octokit.pulls.get>>["data"]
  try {
    Silian_pr = (await Silian_octokit.pulls.get({ owner: Silian_owner, repo: Silian_repo, pull_number: Silian_prNumber })).data
  } catch (Silian_error) {
    console.error("[review/page] PR fetch failed:", Silian_prNumber, Silian_error)
    Silian_notFound()
  }

  const { data: Silian_prFiles } = await Silian_octokit.pulls.listFiles({
    owner: Silian_owner,
    repo: Silian_repo,
    pull_number: Silian_prNumber,
  })
  const Silian_prFileMap = new Map(Silian_prFiles.map((Silian_file) => [Silian_file.filename, Silian_file]))
  const Silian_primaryPrFile =
    Silian_prFiles.find((Silian_file) => Silian_file.filename.endsWith(".md")) || Silian_prFiles[0]

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
  const Silian_linkedDraftConflictMode =
    (
      Silian_linkedDraft as
        | (typeof Silian_linkedDraft & { conflictMode?: string | null })
        | null
    )?.conflictMode ?? null
  console.log("[review/page] linkedDraft", {
    id: Silian_linkedDraft?.id,
    status: Silian_linkedDraft?.status,
    conflictMode: Silian_linkedDraftConflictMode,
    conflictContentLength: Silian_linkedDraft?.conflictContent?.length ?? null,
    conflictContentPreview: Silian_linkedDraft?.conflictContent?.slice(0, 100) ?? null,
  })
  const Silian_effectiveConflictMode = Silian_linkedDraftConflictMode ?? null

  const Silian_linkedDraftFiles = Silian_linkedDraft
    ? Silian_decodeStoredDraftFiles({
        content: Silian_linkedDraft.content,
        conflictContent: Silian_linkedDraft.conflictContent,
        filePath: Silian_linkedDraft.filePath,
      })
    : null
  console.log("[review/page] linkedDraftFiles", {
    fileCount: Silian_linkedDraftFiles?.files.length ?? null,
    files:
      Silian_linkedDraftFiles?.files.map((Silian_f) => ({
        filePath: Silian_f.filePath,
        hasConflictContent: Boolean(Silian_f.conflictContent),
        conflictContentLength: Silian_f.conflictContent?.length ?? null,
        conflictContentPreview: Silian_f.conflictContent?.slice(0, 80) ?? null,
      })) ?? null,
  })

  const Silian_draftFilePaths =
    Silian_linkedDraftFiles?.files.map((Silian_file) => Silian_file.filePath) ?? []
  const Silian_prFileContents = Silian_linkedDraftFiles
    ? await Silian_getPRFileContents({
        octokit: Silian_octokit,
        prRef: Silian_pr.head.ref,
        filePaths: Silian_draftFilePaths,
      })
    : {}

  let Silian_modeAnalysis: ModeAnalysis = {
    recommendation: "SIMPLE",
    commitCount: 0,
    filesAffected: 0,
    adminMessage: "No analysis available.",
  }

  const Silian_hasConflict = Silian_pr.mergeable === false
  const Silian_isMergeable = Silian_pr.mergeable === true
  const Silian_isInReview = Silian_linkedDraft?.status === "IN_REVIEW" && !Silian_hasConflict
  console.log("[review/page] pr.mergeable", {
    prNumber: Silian_prNumber,
    mergeable: Silian_pr.mergeable,
    hasConflict: Silian_hasConflict,
    isMergeable: Silian_isMergeable,
    isInReview: Silian_isInReview,
    effectiveConflictMode: Silian_effectiveConflictMode,
  })
  const Silian_analysisFilePath = Silian_getPrimaryAnalysisPath(
    Silian_draftFilePaths,
    Silian_primaryPrFile?.filename
  )

  if (
    Silian_isInReview &&
    Silian_linkedDraft?.baseMainSha &&
    Silian_linkedDraft?.syncedMainSha &&
    Silian_linkedDraft.baseMainSha !== Silian_linkedDraft.syncedMainSha &&
    Silian_analysisFilePath
  ) {
    const { analyzeRebaseNeed: Silian_analyzeRebaseNeed } = await import("@/lib/article-rebase")
    const Silian_rebaseAnalysis = await Silian_analyzeRebaseNeed({
      filePath: Silian_analysisFilePath,
      baseMainSha: Silian_linkedDraft.baseMainSha,
      latestMainSha: Silian_linkedDraft.syncedMainSha,
      token: Silian_token,
    })

    Silian_modeAnalysis = {
      recommendation:
        Silian_rebaseAnalysis?.recommendation === "REBASE_RECOMMENDED"
          ? "FINE_GRAINED"
          : "SIMPLE",
      commitCount: Silian_rebaseAnalysis?.totalCommits ?? 0,
      filesAffected: Silian_rebaseAnalysis?.fileEditCount ?? 0,
      adminMessage: Silian_rebaseAnalysis?.adminMessage ?? "No analysis available.",
    }
  }

  const Silian_reviewFiles: ReviewFile[] = Silian_linkedDraftFiles
    ? Silian_linkedDraftFiles.files.map((Silian_file) => ({
        ...(Silian_prFileMap.get(Silian_file.filePath)
          ? {
              additions: Silian_prFileMap.get(Silian_file.filePath)?.additions,
              changeType: Silian_prFileMap.get(Silian_file.filePath)?.status as
                | "added"
                | "modified"
                | "removed"
                | "renamed"
                | undefined,
              deletions: Silian_prFileMap.get(Silian_file.filePath)?.deletions,
            }
          : {}),
        id: Silian_file.id,
        filePath: Silian_file.filePath,
        content: Silian_prFileContents[Silian_file.filePath] ?? Silian_file.content,
        originalContent: Silian_file.content,
        conflictContent: Silian_file.conflictContent ?? undefined,
        status: Silian_file.conflictContent
          ? ("conflict" as const)
          : ("clean" as const),
      }))
    : []
  console.log(
    "[review/page] reviewFiles",
    Silian_reviewFiles.map((Silian_f) => ({
      filePath: Silian_f.filePath,
      status: Silian_f.status,
      hasConflictContent: Boolean(Silian_f.conflictContent),
      conflictContentPreview: Silian_f.conflictContent?.slice(0, 80) ?? null,
      contentPreview: Silian_f.content?.slice(0, 80),
    }))
  )

  const Silian_targetFileLabel =
    Silian_linkedDraftFiles?.files.length && Silian_linkedDraftFiles.files.length > 1
      ? `${Silian_linkedDraftFiles.files.length} FILES`
      : Silian_primaryPrFile?.filename || Silian_linkedDraft?.filePath || "UNKNOWN"

  const Silian_defaultCommitTitle = `${Silian_pr.title} (#${Silian_pr.number})`
  const Silian_defaultCommitBody = Silian_pr.body || ""
  const Silian_coauthorLines = Silian_defaultCommitBody
    .split("\n")
    .filter((Silian_line) => /^Co-authored-by: .+$/.test(Silian_line))
  const Silian_mergeStrategyAnalysis = Silian_analyzeReviewMergeStrategy(Silian_pr)
  const Silian_rebaseStatus =
    (
      Silian_linkedDraft?.rebaseState as {
        status?: string | null
      } | null
    )?.status ?? null
  const Silian_hasPendingReviewResolution =
    Silian_linkedDraft?.status === "SYNC_CONFLICT" ||
    (Silian_effectiveConflictMode === "FINE_GRAINED" &&
      Silian_rebaseStatus !== null &&
      Silian_rebaseStatus !== "COMPLETED" &&
      Silian_rebaseStatus !== "ABORTED" &&
      Silian_rebaseStatus !== "IDLE")
  const Silian_mergeBlockedReason =
    Silian_pr.state !== "open"
      ? "Pull request is already closed."
      : Silian_linkedDraft?.status === "SYNC_CONFLICT"
        ? "Resolve sync conflicts before landing this pull request."
        : Silian_hasPendingReviewResolution
          ? "Finish the current review resolution before landing this pull request."
          : !Silian_isMergeable
            ? "GitHub still reports this pull request as not mergeable."
            : null

  return (
    <div className="mx-auto max-w-352 space-y-8 p-4 pb-32 md:p-8">
      <Silian_Link href="/review">
        <Silian_TechButton variant="ghost" size="sm">
          {"<"} BACK_TO_HUB
        </Silian_TechButton>
      </Silian_Link>

      <section className="relative border-b border-tech-main/30 pb-8">
        <div className="absolute -bottom-1.25 left-0 size-2 border border-tech-main/50 bg-tech-main/20"></div>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 font-mono text-[0.6875rem] tracking-widest uppercase">
              <span
                className={`border px-2 py-1 ${
                  Silian_hasConflict
                    ? "border-red-500/50 bg-red-500/10 text-red-600"
                    : Silian_isMergeable
                      ? "border-green-600/40 bg-green-500/10 text-green-700"
                      : "border-amber-500/40 bg-amber-500/10 text-amber-700"
                }`}>
                {Silian_pr.state.toUpperCase()} {Silian_hasConflict ? "CONFLICT" : "READY"}
              </span>
              <span className="border border-tech-main/25 bg-white/70 px-2 py-1 text-tech-main/70">
                PR #{Silian_pr.number}
              </span>
              <span className="border border-tech-main/25 bg-white/70 px-2 py-1 text-tech-main/70">
                {Silian_pr.base.ref} ← {Silian_pr.head.ref}
              </span>
            </div>

            <h1 className="font-mono text-3xl/tight tracking-widest text-tech-main-dark uppercase lg:text-4xl">
              {Silian_pr.title}
            </h1>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="border guide-line bg-tech-main/5 px-4 py-3">
                <p className="font-mono text-[0.625rem] tracking-widest text-tech-main/45 uppercase">
                  AUTHOR
                </p>
                <p className="mt-1 font-mono text-sm tracking-widest text-tech-main uppercase">
                  {Silian_linkedDraft?.author?.name ||
                    Silian_pr.user?.login ||
                    "UNKNOWN_USER"}
                </p>
              </div>
              <div className="border guide-line bg-tech-main/5 px-4 py-3">
                <p className="font-mono text-[0.625rem] tracking-widest text-tech-main/45 uppercase">
                  TARGET
                </p>
                <p className="mt-1 font-mono text-sm tracking-widest text-tech-main uppercase">
                  {Silian_targetFileLabel}
                </p>
              </div>
              <div className="border guide-line bg-tech-main/5 px-4 py-3">
                <p className="font-mono text-[0.625rem] tracking-widest text-tech-main/45 uppercase">
                  STATS
                </p>
                <p className="mt-1 font-mono text-sm tracking-widest text-tech-main uppercase">
                  {Silian_pr.commits} COMMITS / {Silian_pr.changed_files} FILES
                </p>
              </div>
              <div className="border guide-line bg-tech-main/5 px-4 py-3">
                <p className="font-mono text-[0.625rem] tracking-widest text-tech-main/45 uppercase">
                  DIFF
                </p>
                <p className="mt-1 font-mono text-sm tracking-widest uppercase">
                  <span className="text-green-700">+{Silian_pr.additions}</span>
                  <span className="px-2 text-tech-main/30">/</span>
                  <span className="text-red-600">-{Silian_pr.deletions}</span>
                </p>
              </div>
            </div>
          </div>

          <a
            href={Silian_pr.html_url}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-xs tracking-widest text-tech-main uppercase underline underline-offset-4 hover:text-tech-main-dark">
            OPEN_ON_GITHUB_
          </a>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="space-y-6">
          {Silian_linkedDraft ? (
            <Silian_ReviewEditor
              pr={{
                number: Silian_pr.number,
                title: Silian_pr.title,
                htmlUrl: Silian_pr.html_url,
                baseRef: Silian_pr.base.ref,
                headRef: Silian_pr.head.ref,
                commits: Silian_pr.commits,
                changedFiles: Silian_pr.changed_files,
                additions: Silian_pr.additions,
                deletions: Silian_pr.deletions,
                authorLogin: Silian_pr.user?.login || "UNKNOWN",
              }}
              files={Silian_reviewFiles}
              initialActiveFileId={Silian_linkedDraftFiles?.activeFileId}
              modeAnalysis={Silian_modeAnalysis}
              mergeStrategyAnalysis={Silian_mergeStrategyAnalysis}
              revision={{
                id: Silian_linkedDraft.id,
                conflictMode: Silian_effectiveConflictMode,
                rebaseState: Silian_linkedDraft.rebaseState,
              }}
              squashCommitDefaults={{
                title: Silian_defaultCommitTitle,
                body: Silian_defaultCommitBody,
                coauthorLines: Silian_coauthorLines,
              }}
            />
          ) : (
            <div className="border border-tech-main/30 bg-tech-main/5 px-6 py-10 font-mono text-sm tracking-widest text-tech-main/70 uppercase">
              NO_DRAFT_LINKED_
            </div>
          )}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          {Silian_linkedDraft ? (
            <div className="space-y-4 border border-tech-main/35 bg-white/80 p-4 backdrop-blur-sm">
              <div className="space-y-1 border-b border-tech-main/15 pb-3">
                <p className="font-mono text-[0.6875rem] tracking-widest text-tech-main/50 uppercase">
                  PR_CONTROLS
                </p>
                <p className="font-mono text-sm font-bold tracking-widest text-tech-main uppercase">
                  REVIEW_WORKFLOW_ACTIVE
                </p>
                <p className="font-mono text-[0.6875rem] leading-relaxed text-tech-main/60">
                  Merge is handled from the in-editor review flow to avoid
                  duplicate actions.
                </p>
              </div>

              <form
                action={async () => {
                  "use server"
                  await Silian_closePRAction(Silian_prNumber)
                }}>
                <Silian_TechButton
                  type="submit"
                  variant="secondary"
                  className="w-full border-red-600 text-red-600 hover:bg-red-600 hover:text-white">
                  CLOSE_PR
                </Silian_TechButton>
              </form>
            </div>
          ) : (
            <Silian_PRActionButtons
              closePRAction={async () => {
                "use server"
                await Silian_closePRAction(Silian_prNumber)
              }}
              mergePRAction={
                !Silian_mergeBlockedReason
                  ? async (Silian_options) => {
                      "use server"
                      await Silian_mergePRAction(Silian_prNumber, Silian_options)
                    }
                  : null
              }
              mergeStrategyAnalysis={Silian_mergeStrategyAnalysis}
              mergeBlockedReason={Silian_mergeBlockedReason}
              squashCommitDefaults={{
                title: Silian_defaultCommitTitle,
                body: Silian_defaultCommitBody,
                coauthorLines: Silian_coauthorLines,
              }}
            />
          )}

          <div className="border border-tech-main/25 bg-tech-main/5 p-4">
            <p className="font-mono text-[0.6875rem] tracking-widest text-tech-main/50 uppercase">
              REVIEW_FLOW
            </p>
            <div className="mt-3 space-y-3 font-mono text-[0.6875rem] leading-relaxed text-tech-main/70">
              <p>
                Author:{" "}
                {Silian_linkedDraft?.author?.name || Silian_pr.user?.login || "UNKNOWN_USER"}
              </p>
              <p>Head branch: {Silian_pr.head.ref}</p>
              <p>Base branch: {Silian_pr.base.ref}</p>
              <p>
                Auto recommendation:{" "}
                {Silian_mergeStrategyAnalysis.recommendation.toUpperCase()}
              </p>
              <p>{Silian_mergeStrategyAnalysis.rationale}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
