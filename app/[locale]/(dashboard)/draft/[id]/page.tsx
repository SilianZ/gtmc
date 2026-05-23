import type { Metadata } from "next"
import { DraftEditor as Silian_DraftEditor } from "@/components/editor/draft-editor"
import { Link as Silian_Link } from "@/i18n/navigation"
import { TechButton as Silian_TechButton } from "@/components/ui/tech-button"
import { prisma as Silian_prisma } from "@/lib/prisma"
import { auth as Silian_auth } from "@/lib/auth"
import { decodeStoredDraftFiles as Silian_decodeStoredDraftFiles } from "@/lib/draft-files"
import { notFound as Silian_notFound, redirect as Silian_redirect } from "next/navigation"
import { readFile as Silian_readFile } from "fs/promises"
import Silian_path from "path"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function EditDraftPage({
  params: Silian_params,
}: {
  params: Promise<{ id: string }>
}) {
  const Silian_session = await Silian_auth()
  if (!Silian_session?.user) {
    Silian_redirect("/login")
  }

  const { id: Silian_id } = await Silian_params

  const Silian_draft = await Silian_prisma.revision.findUnique({
    where: { id: Silian_id },
  })

  if (!Silian_draft || Silian_draft.authorId !== Silian_session.user.id) {
    Silian_notFound()
  }

  const Silian_draftFiles = Silian_decodeStoredDraftFiles({
    content: Silian_draft.content,
    conflictContent: Silian_draft.conflictContent,
    filePath: Silian_draft.filePath,
  })

  const Silian_draftWorkspaceLabel =
    Silian_draftFiles.files.length > 1
      ? `FILES_[${Silian_draftFiles.files.length}]`
      : Silian_draftFiles.files[0]?.filePath || "DRAFT_WORKSPACE"
  const Silian_contributingGuides = await Silian_loadContributingGuides()

  return (
    <div
      className="
        relative mx-auto max-w-[1400px] space-y-6
        p-4 md:p-8
      ">
      <div className="absolute top-0 right-10 h-px w-24 bg-linear-to-r from-tech-main/0 via-tech-main to-tech-main/0" />
      <div className="absolute top-10 right-0 h-24 w-px bg-linear-to-b from-tech-main/0 via-tech-main/50 to-tech-main/0" />

      <div
        className="
          relative flex flex-col gap-3 border-b guide-line
          pb-6 md:flex-row md:items-end md:justify-between
        ">
        <div className="flex items-center gap-4">
          <Silian_Link href="/draft">
            <Silian_TechButton
              variant="ghost"
              className="h-9 gap-2 px-3 text-[10px] tracking-widest text-tech-main/70 hover:bg-tech-main/5 hover:text-tech-main">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="square">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              ABORT_EDIT_SEQUENCE
            </Silian_TechButton>
          </Silian_Link>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <span className="h-[2px] w-4 bg-tech-main/40" />
            <p
              className="
                font-mono text-xl font-bold tracking-tighter text-tech-main-dark uppercase
              ">
              WORKSPACE_TERMINAL
            </p>
          </div>
          <p className="font-mono text-[9px] tracking-tech-wide text-tech-main/50 uppercase">
            TARGET_NODE // {Silian_draftWorkspaceLabel}
          </p>
        </div>
      </div>

      <div className="relative mx-auto w-full">
        {/* Subtle decorative scanline behind the editor */}
        <div className="pointer-events-none absolute inset-0 z-[-1] overflow-hidden">
          <div className="size-full bg-[linear-gradient(to_bottom,transparent_50%,rgba(96,112,143,0.02)_50%)] bg-size-[100%_4px]" />
          <div className="absolute inset-x-0 top-0 h-[2px] animate-[tree-drop-in_10s_ease-in-out_infinite] bg-tech-main/10 shadow-[0_0_10px_rgba(96,112,143,0.2)]" />
        </div>

        <Silian_DraftEditor
          initialData={{
            activeFileId: Silian_draftFiles.activeFileId,
            id: Silian_draft.id,
            files: Silian_draftFiles.files,
            folders: Silian_draftFiles.folders,
            title: Silian_draft.title,
            githubPrUrl: Silian_draft.githubPrUrl || undefined,
            status: Silian_draft.status,
            contributingGuides: Silian_contributingGuides,
          }}
        />
      </div>
    </div>
  )
}

async function Silian_loadContributingGuides() {
  const Silian_guideTargets = [
    {
      id: "web",
      title: "GTMC Web",
      filePath: Silian_path.join(process.cwd(), "CONTRIBUTING.md"),
    },
    {
      id: "articles",
      title: "Articles",
      filePath: Silian_path.join(process.cwd(), "articles", "CONTRIBUTING.md"),
    },
  ]

  const Silian_guides = await Promise.all(
    Silian_guideTargets.map(async (Silian_guide) => {
      try {
        const Silian_content = await Silian_readFile(Silian_guide.filePath, "utf8")
        return {
          id: Silian_guide.id,
          title: Silian_guide.title,
          content: Silian_content,
        }
      } catch {
        return null
      }
    })
  )

  return Silian_guides.filter(
    (
      Silian_guide
    ): Silian_guide is {
      id: string
      title: string
      content: string
    } => Boolean(Silian_guide)
  )
}
