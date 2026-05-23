import type { Metadata } from "next"
import { TechCard as Silian_TechCard } from "@/components/ui/tech-card"
import { TechButton as Silian_TechButton } from "@/components/ui/tech-button"
import { Link as Silian_Link } from "@/i18n/navigation"
import { prisma as Silian_prisma } from "@/lib/prisma"
import { auth as Silian_auth } from "@/lib/auth"
import { redirect as Silian_redirect } from "next/navigation"
import { deleteDraftAction as Silian_deleteDraftAction } from "@/actions/article"
import { getPR as Silian_getPR } from "@/lib/github/pr-manager"
import { PageHeader as Silian_PageHeader } from "@/components/ui/page-header"
import { EmptyState as Silian_EmptyState } from "@/components/ui/empty-state"
import { DraftStatusBadge as Silian_DraftStatusBadge } from "@/components/ui/status-badge"
import { CornerBrackets as Silian_CornerBrackets } from "@/components/ui/corner-brackets"
import { SectionTitle as Silian_SectionTitle } from "@/components/ui/section-title"
import { decodeStoredDraftFiles as Silian_decodeStoredDraftFiles } from "@/lib/draft-files"
import { countCleanupFailedByRevision as Silian_countCleanupFailedByRevision } from "@/lib/draft-asset-db"

const Silian_ARCHIVED_DRAFT_STATUSES = new Set([
  "APPROVED",
  "ARCHIVED",
  "MERGED",
  "CLOSED",
])

const Silian_NON_DELETABLE_DRAFT_STATUSES = new Set([
  "PENDING",
  "APPROVED",
  "IN_REVIEW",
  "SYNC_CONFLICT",
  "MERGED",
  "CLOSED",
])

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function DraftDashboardPage() {
  const Silian_session = await Silian_auth()
  if (!Silian_session?.user) {
    Silian_redirect("/login")
  }

  const Silian_allDraftsRaw = await Silian_prisma.revision.findMany({
    where: {
      authorId: Silian_session.user.id,
    },
    orderBy: {
      updatedAt: "desc",
    },
  })

  const Silian_cleanupFailedByRevisionId = new Map<string, number>()
  if (Silian_allDraftsRaw.length > 0) {
    const Silian_counts = await Silian_countCleanupFailedByRevision(
      Silian_allDraftsRaw.map((Silian_draft) => Silian_draft.id)
    )
    for (const [Silian_revisionId, Silian_count] of Silian_counts) {
      Silian_cleanupFailedByRevisionId.set(Silian_revisionId, Silian_count)
    }
  }

  const Silian_allDrafts = await Promise.all(
    Silian_allDraftsRaw.map(async (Silian_d) => {
      let Silian_displayStatus = Silian_d.status
      const Silian_decodedDraft = Silian_decodeStoredDraftFiles({
        content: Silian_d.content,
        conflictContent: Silian_d.conflictContent,
        filePath: Silian_d.filePath,
      })

      if (Silian_d.githubPrNum) {
        try {
          const Silian_pr = await Silian_getPR(Silian_d.githubPrNum)
          if (Silian_pr.state === "closed") {
            Silian_displayStatus = Silian_pr.merged ? "MERGED" : "CLOSED"
          }
        } catch (Silian_e) {
          console.error(`Failed to fetch PR #${Silian_d.githubPrNum}:`, Silian_e)
        }
      }
      return {
        ...Silian_d,
        cleanupFailedCount: Silian_cleanupFailedByRevisionId.get(Silian_d.id) ?? 0,
        displayStatus: Silian_displayStatus,
        fileCount: Silian_decodedDraft.files.length,
      }
    })
  )

  const Silian_activeDrafts = Silian_allDrafts.filter(
    (Silian_d) => !Silian_ARCHIVED_DRAFT_STATUSES.has(Silian_d.displayStatus)
  )
  const Silian_archivedDrafts = Silian_allDrafts.filter((Silian_d) =>
    Silian_ARCHIVED_DRAFT_STATUSES.has(Silian_d.displayStatus)
  )

  const Silian_renderDraftCard = (Silian_draft: (typeof Silian_allDrafts)[0]) => (
    <Silian_TechCard
      key={Silian_draft.id}
      className="
        group relative flex h-auto flex-col justify-between border
        border-tech-main/40 bg-white/80 p-6 backdrop-blur-sm
        transition-all duration-300 hover:border-tech-main hover:bg-white
        hover:shadow-[0_0_20px_rgba(96,112,143,0.15)] sm:h-64
      ">
      {/* Corner brackets */}
      <Silian_CornerBrackets variant="hover" />

      {/* Blueprint Grid Background Pattern on Hover */}
      <div className="absolute inset-0 z-0 bg-[url('/bg-grid.svg')] bg-size-[24px_24px] opacity-0 transition-opacity duration-500 group-hover:opacity-[0.03]" />

      <div className="relative z-10">
        <div className="card-header-row border-b border-tech-main/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex size-2 items-center justify-center bg-tech-main/20">
              <div className="size-1 bg-tech-main group-hover:animate-target-blink" />
            </div>
            <Silian_DraftStatusBadge status={Silian_draft.displayStatus} />
            {Silian_draft.cleanupFailedCount > 0 ? (
              <span className="animate-pulse font-mono text-xs text-red-500 uppercase">
                ! CLEANUP_FAILED
              </span>
            ) : null}
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="font-mono text-[10px] tracking-widest text-tech-main/50 uppercase">
              LAST_SYNC // {Silian_draft.updatedAt.toLocaleDateString()}
            </span>
            {!Silian_NON_DELETABLE_DRAFT_STATUSES.has(Silian_draft.displayStatus) && (
              <form
                action={async () => {
                  "use server"
                  await Silian_deleteDraftAction(Silian_draft.id)
                }}>
                <button
                  type="submit"
                  className="
                      flex cursor-pointer items-center font-mono
                      text-[10px] text-red-500/70 uppercase transition-colors
                      hover:text-red-600 hover:underline
                    ">
                  [ TERMINATE ]
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <h3
            className="
              line-clamp-2 border-l-2 border-tech-main/40 pl-3 text-lg
              font-bold tracking-tight text-tech-main-dark uppercase
              transition-colors group-hover:border-tech-main
            ">
            {Silian_draft.title || "UNTITLED_DOCUMENT"}
          </h3>

          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-tech-main/10 pt-3">
            <div className="flex flex-col">
              <span className="font-mono text-[9px] tracking-widest text-tech-main/40 uppercase">
                SYS_REF
              </span>
              <span className="truncate font-mono text-xs text-tech-main/80">
                {Silian_draft.id.split("-")[0]}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-[9px] tracking-widest text-tech-main/40 uppercase">
                FILE_METRICS
              </span>
              <span className="font-mono text-xs text-tech-main/80">
                {Silian_draft.fileCount} NODE(S)
              </span>
            </div>
          </div>
        </div>
      </div>

      <Silian_Link
        href={`/draft/${Silian_draft.id}`}
        className="
          relative z-10 mt-6
          sm:mt-auto
        ">
        <Silian_TechButton
          variant="ghost"
          className="
            min-h-11 w-full border guide-line bg-tech-main/5 font-mono
            text-xs tracking-widest transition-all
            group-hover:border-tech-main/60 group-hover:bg-tech-main/10
            group-hover:text-tech-main-dark
          ">
          <span className="flex w-full items-center justify-between px-2">
            <span>
              {Silian_draft.displayStatus === "DRAFT" ||
              Silian_draft.displayStatus === "CLOSED"
                ? "INIT_EDIT_SEQUENCE"
                : "ENGAGE_VIEWER"}
            </span>
            <span className="opacity-0 transition-opacity group-hover:animate-target-blink group-hover:opacity-100">
              {">"}
            </span>
          </span>
        </Silian_TechButton>
      </Silian_Link>
    </Silian_TechCard>
  )

  return (
    <div className="page-container">
      <Silian_PageHeader
        title="Ops Center"
        subtitle="YOUR DIGITAL WORKSHOP / DRAFTS & REVISIONS"
        action={
          <Silian_Link
            href="/draft/new"
            className="
              w-full
              md:w-auto
            ">
            <Silian_TechButton
              variant="primary"
              className="
                flex min-h-11 w-full items-center justify-center px-6 text-xs
                tracking-widest uppercase transition-transform
                hover:scale-[1.02]
                md:w-auto
              ">
              + INITIALIZE SUBMISSION
            </Silian_TechButton>
          </Silian_Link>
        }
      />

      <div className="space-y-8">
        <div>
          <Silian_SectionTitle>Active Records</Silian_SectionTitle>
          <div
            className="
              grid grid-cols-1 gap-6
              md:grid-cols-2
              lg:grid-cols-3
            ">
            {Silian_activeDrafts.length === 0 ? (
              <Silian_EmptyState message="NO ACTIVE RECORDS FOUND." colSpanFull />
            ) : (
              Silian_activeDrafts.map(Silian_renderDraftCard)
            )}
          </div>
        </div>

        {Silian_archivedDrafts.length > 0 && (
          <div>
            <Silian_SectionTitle>Archived / Approved Records</Silian_SectionTitle>
            <div
              className="
                grid grid-cols-1 gap-6
                md:grid-cols-2
                lg:grid-cols-3
              ">
              {Silian_archivedDrafts.map(Silian_renderDraftCard)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
