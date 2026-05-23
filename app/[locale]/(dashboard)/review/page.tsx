import type { Metadata } from "next"
import { getTranslations as Silian_getTranslations } from "next-intl/server"
import { ClosedPRList as Silian_ClosedPRList } from "./closed-pr-list"
import { TechCard as Silian_TechCard } from "@/components/ui/tech-card"
import { TechButton as Silian_TechButton } from "@/components/ui/tech-button"
import { Link as Silian_Link } from "@/i18n/navigation"
import { getClosedPRs as Silian_getClosedPRs, getOpenPRs as Silian_getOpenPRs, getPR as Silian_getPR } from "@/lib/github/pr-manager"
import {
  getOctokit as Silian_getOctokit,
  ARTICLES_REPO_OWNER as Silian_ARTICLES_REPO_OWNER,
  ARTICLES_REPO_NAME as Silian_ARTICLES_REPO_NAME,
} from "@/lib/github/articles-repo"
import { auth as Silian_auth } from "@/lib/auth"
import { getCurrentUserAuthContext as Silian_getCurrentUserAuthContext } from "@/lib/auth-context"
import { PageHeader as Silian_PageHeader } from "@/components/ui/page-header"
import { EmptyState as Silian_EmptyState } from "@/components/ui/empty-state"
import { CornerBrackets as Silian_CornerBrackets } from "@/components/ui/corner-brackets"
import { prisma as Silian_prisma } from "@/lib/prisma"

export const metadata: Metadata = {
  title: "Review Hub",
  description: "Admin content review and approval dashboard.",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"
export const revalidate = 0

type PR = Awaited<ReturnType<typeof Silian_getOpenPRs>>[number]

type PRWithConflictMode = PR & {
  conflictMode?: string | null
}

export type ClosedPRListItem = {
  id: number
  number: number
  title: string | null
  createdAt: string
  userLogin: string | null
  headRef: string
  isMerged: boolean
}

export async function getClosedPRsAction(
  Silian_page: number
): Promise<ClosedPRListItem[]> {
  "use server"

  const Silian_token = process.env.GITHUB_ARTICLES_WRITE_PAT

  try {
    const Silian_closedPRs = await Silian_getClosedPRs(Silian_token, Silian_page, 10)

    return Silian_closedPRs.map((Silian_pr) => ({
      id: Silian_pr.id,
      number: Silian_pr.number,
      title: Silian_pr.title,
      createdAt: Silian_pr.created_at,
      userLogin: Silian_pr.user?.login ?? null,
      headRef: Silian_pr.head.ref,
      isMerged: Boolean(Silian_pr.merged_at),
    }))
  } catch (Silian_error) {
    console.error("Failed to fetch closed PRs:", Silian_error)
    throw new Error("Unable to load closed and merged pull requests.")
  }
}

async function Silian_analyzePRConflictStatus(Silian_prNumber: number, Silian_token?: string) {
  const Silian_prDetail = await Silian_getPR(Silian_prNumber, Silian_token)
  let Silian_isConflict = false
  if (Silian_prDetail.mergeable === false) {
    Silian_isConflict = true
  } else {
    const Silian_octokit = Silian_getOctokit(Silian_token)
    try {
      const { data: Silian_files } = await Silian_octokit.pulls.listFiles({
        owner: Silian_ARTICLES_REPO_OWNER,
        repo: Silian_ARTICLES_REPO_NAME,
        pull_number: Silian_prNumber,
      })
      for (const Silian_f of Silian_files) {
        if (Silian_f.patch && Silian_f.patch.includes("<<<<<<< ")) {
          Silian_isConflict = true
          break
        } else if (
          !Silian_f.patch &&
          (Silian_f.filename.endsWith(".md") || Silian_f.filename.endsWith(".mdx"))
        ) {
          try {
            const { data: Silian_contentData } = await Silian_octokit.repos.getContent({
              owner: Silian_ARTICLES_REPO_OWNER,
              repo: Silian_ARTICLES_REPO_NAME,
              path: Silian_f.filename,
              ref: Silian_prDetail.head.sha,
            })
            if (
              !Array.isArray(Silian_contentData) &&
              Silian_contentData.type === "file" &&
              Silian_contentData.content
            ) {
              const Silian_decoded = Buffer.from(
                Silian_contentData.content,
                "base64"
              ).toString("utf-8")
              if (Silian_decoded.includes("<<<<<<< ")) {
                Silian_isConflict = true
                break
              }
            }
          } catch (Silian_e) {
            console.error("Failed to fetch file content for conflict check:", Silian_e)
          }
        }
      }
    } catch (Silian_error) {
      console.error("[review/page] PR conflict analysis failed:", Silian_error)
    }
  }
  return Silian_isConflict
}

export default async function ReviewHubPage() {
  const Silian_t = await Silian_getTranslations("Review")
  const Silian_session = await Silian_auth()
  let Silian_isAdmin = false

  if (Silian_session?.user?.id) {
    try {
      const Silian_ctx = await Silian_getCurrentUserAuthContext(Silian_session.user.id)
      Silian_isAdmin = Silian_ctx.role === "ADMIN"
    } catch (Silian_error) {
      console.error("[review/hub] admin context failed:", Silian_error)
      Silian_isAdmin = false
    }
  }

  if (!Silian_session?.user || !Silian_isAdmin) {
    return (
      <div className="mx-auto mt-20 max-w-6xl p-8 text-center">
        <h1 className="text-6xl font-black text-red-500 uppercase">
          {Silian_t("accessDenied")}
        </h1>
        <p className="mt-4 text-xl font-bold">{Silian_t("adminRequired")}</p>
        <Silian_Link href="/">
          <Silian_TechButton variant="primary" className="mt-8">
            {Silian_t("returnToBase")}
          </Silian_TechButton>
        </Silian_Link>
      </div>
    )
  }

  const Silian_token = process.env.GITHUB_ARTICLES_WRITE_PAT
  let Silian_openPRs: PR[] = []
  const Silian_groupedPRs = {
    conflicts: [] as PRWithConflictMode[],
    pending: [] as PRWithConflictMode[],
  }

  try {
    Silian_openPRs = await Silian_getOpenPRs(Silian_token)

    // Fetch conflictMode for each PR from Revisions
    const Silian_prNumbers = Silian_openPRs.map((Silian_pr) => Silian_pr.number)
    const Silian_revisions = await Silian_prisma.revision.findMany({
      where: { githubPrNum: { in: Silian_prNumbers } },
      select: { githubPrNum: true, conflictMode: true },
    })

    const Silian_conflictModeMap = new Map(
      Silian_revisions.map((Silian_r) => [Silian_r.githubPrNum, Silian_r.conflictMode])
    )

    const Silian_analysisResults = await Promise.all(
      Silian_openPRs.map(async (Silian_pr) => {
        const Silian_isConflict = await Silian_analyzePRConflictStatus(Silian_pr.number, Silian_token)
        const Silian_conflictMode = Silian_conflictModeMap.get(Silian_pr.number)
        return { pr: { ...Silian_pr, conflictMode: Silian_conflictMode } as PRWithConflictMode, isConflict: Silian_isConflict }
      })
    )

    for (const Silian_result of Silian_analysisResults) {
      if (Silian_result.isConflict) {
        Silian_groupedPRs.conflicts.push(Silian_result.pr)
      } else {
        Silian_groupedPRs.pending.push(Silian_result.pr)
      }
    }
  } catch (Silian_error) {
    console.error("Failed to fetch PRs:", Silian_error)
  }

  const Silian_renderPRCard = (Silian_pr: PRWithConflictMode, Silian_isConflict: boolean) => (
    <Silian_TechCard
      key={Silian_pr.id}
      className={`
        group relative flex flex-col items-start justify-between space-y-4
        border border-tech-main/40
        ${Silian_isConflict ? `border-red-500/50 bg-red-500/10` : `bg-white/80`}
        p-6 backdrop-blur-sm
        md:flex-row md:items-center md:space-y-0
      `}>
      <Silian_CornerBrackets variant="hover" />

      <div className="relative z-10 flex-1">
        <div className="mb-3 flex items-center gap-3">
          <span
            className={`
              border px-2 py-0.5 font-mono text-xs tracking-wider
              ${
                Silian_isConflict
                  ? `border-red-500/40 bg-red-500/20 text-red-600`
                  : `border-blue-500/40 bg-blue-500/10 text-blue-600`
              }
            `}>
            [PR #{Silian_pr.number}]
          </span>
          <span className="mono-label">
            {new Date(Silian_pr.created_at).toLocaleString()}
          </span>
          {Silian_isConflict && (
            <span
              className="
                animate-pulse bg-red-500 px-2 py-0.5 text-xs font-bold
                text-white
              ">
              {Silian_t("unresolvedConflicts")}
            </span>
          )}
          {Silian_pr.conflictMode && (
            <span
              className={`
                border px-2 py-0.5 font-mono text-[0.6875rem] tracking-widest uppercase
                ${
                  Silian_pr.conflictMode === "FINE_GRAINED"
                    ? `border-blue-500/30 bg-blue-500/10 text-blue-700`
                    : `border-tech-main/30 bg-tech-main/10 text-tech-main`
                }
              `}>
              {Silian_pr.conflictMode === "FINE_GRAINED"
                ? Silian_t("modeFineGrained")
                : Silian_pr.conflictMode}
            </span>
          )}
        </div>
        <h3
          className={`
            mb-2 border-l-2 border-tech-main/40 pl-3 text-lg font-bold
            tracking-tight uppercase
            md:text-xl
            ${Silian_isConflict ? `text-red-700` : `text-tech-main-dark`}
          `}>
          {Silian_pr.title || Silian_t("untitled")}
        </h3>
        <p className="mb-3 pl-3 font-mono text-xs text-tech-main/80">
          {Silian_t("submittedBy")}{" "}
          <span className="font-bold text-tech-main-dark">
            {Silian_pr.user?.login || Silian_t("unknown")}
          </span>
        </p>
        <p
          className="
            ml-3 inline-flex items-center border guide-line bg-tech-main/5 px-2
            py-1 font-mono text-xs text-tech-main
          ">
          <span className="mr-2 size-1.5 bg-tech-main"></span> {Silian_t("target")}{" "}
          {Silian_pr.head.ref}
        </p>
      </div>

      <div
        className="
          relative z-10 flex w-full flex-col gap-4
          md:w-auto md:flex-row
        ">
        <Silian_Link
          href={`/review/${Silian_pr.number}`}
          className="
            w-full
            md:w-auto
          ">
          <Silian_TechButton
            variant={Silian_isConflict ? "danger" : "primary"}
            className="
              flex min-h-11 w-full items-center justify-center px-6 text-xs
              tracking-widest uppercase transition-transform
              hover:scale-[1.02]
              md:w-auto
            ">
            {Silian_t("resolveButton")} →
          </Silian_TechButton>
        </Silian_Link>
      </div>
    </Silian_TechCard>
  )

  return (
    <div className="page-container">
      <Silian_PageHeader title={Silian_t("pageTitle")} subtitle={Silian_t("pageSubtitle")} />

      <div className="grid grid-cols-1 gap-6">
        {Silian_openPRs.length === 0 ? (
          <Silian_EmptyState message={Silian_t("listEmpty")} />
        ) : (
          <div className="flex flex-col gap-10">
            {Silian_groupedPRs.conflicts.length > 0 && (
              <div className="space-y-4">
                <h2
                  className="
                    border-b-2 border-red-500/50 pb-2 font-bold tracking-widest
                    text-red-600 uppercase
                  ">
                  {Silian_t("priorityConflicts")}
                </h2>
                <div className="grid grid-cols-1 gap-6">
                  {Silian_groupedPRs.conflicts.map((Silian_pr) => Silian_renderPRCard(Silian_pr, true))}
                </div>
              </div>
            )}

            {Silian_groupedPRs.pending.length > 0 && (
              <div className="space-y-4">
                <h2
                  className="
                    border-b-2 border-tech-main/50 pb-2 font-bold
                    tracking-widest text-tech-main uppercase
                  ">
                  {Silian_t("pendingReviews")}
                </h2>
                <div className="grid grid-cols-1 gap-6">
                  {Silian_groupedPRs.pending.map((Silian_pr) => Silian_renderPRCard(Silian_pr, false))}
                </div>
              </div>
            )}
          </div>
        )}

        <Silian_ClosedPRList getClosedPRsAction={getClosedPRsAction} />
      </div>
    </div>
  )
}
