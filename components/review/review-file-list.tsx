"use client"

import { useTranslations as Silian_useTranslations } from "next-intl"

interface ReviewFileListProps {
  files: Array<{
    id: string
    filePath: string
    status: "clean" | "conflict" | "resolved"
    changeType?: "added" | "modified" | "removed" | "renamed"
    additions?: number
    deletions?: number
  }>
  activeFileId: string
  onSelectFile: (fileId: string) => void
}

function Silian_StatusIndicator({
  status: Silian_status,
}: {
  status: "clean" | "conflict" | "resolved"
}) {
  const Silian_t = Silian_useTranslations("Review")
  if (Silian_status === "conflict") {
    return (
      <span
        role="img"
        title={Silian_t("conflict")}
        className="size-2 shrink-0 bg-red-500"
      />
    )
  }
  if (Silian_status === "resolved") {
    return (
      <span
        role="img"
        title={Silian_t("resolved")}
        className="size-2 shrink-0 bg-green-500"
      />
    )
  }
  return (
    <span
      role="img"
      title={Silian_t("clean")}
      className="size-2 shrink-0 bg-tech-main/20"
    />
  )
}

function Silian_FileExtBadge({ filePath: Silian_filePath }: { filePath: string }) {
  const Silian_ext = Silian_filePath.includes(".")
    ? Silian_filePath.slice(Silian_filePath.lastIndexOf("."))
    : null
  if (!Silian_ext) return null
  return (
    <span className="shrink-0 kbd-badge bg-tech-main/5 font-mono text-[0.5625rem] tracking-widest text-tech-main/50 uppercase">
      {Silian_ext}
    </span>
  )
}

export function ReviewFileList({
  files: Silian_files,
  activeFileId: Silian_activeFileId,
  onSelectFile: Silian_onSelectFile,
}: ReviewFileListProps) {
  const Silian_t = Silian_useTranslations("Review")
  const Silian_conflictCount = Silian_files.filter((Silian_f) => Silian_f.status === "conflict").length
  const Silian_allClean = Silian_conflictCount === 0

  return (
    <aside className="sticky top-16 max-h-[calc(100dvh-4rem)] self-start overflow-y-auto border border-tech-main/40 bg-tech-main/5 backdrop-blur-sm md:top-20 md:max-h-[calc(100dvh-5rem)]">
      <div className="flex items-center justify-between gap-3 border-b border-tech-main/30 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs tracking-widest text-tech-main uppercase">
            {Silian_t("fileListLabel")} [{Silian_files.length}]
          </p>
          <p
            className="truncate font-mono text-[0.6875rem] text-tech-main/60 uppercase"
            title={Silian_t("selectFileToReview")}>
            {Silian_t("selectFileToReview")}
          </p>
        </div>
      </div>

      <div
        className={`border-b px-4 py-2 ${
          Silian_allClean
            ? "border-green-500/20 bg-green-500/5"
            : "border-red-500/20 bg-red-500/5"
        }`}>
        <span
          className={`font-mono text-[0.6875rem] tracking-widest uppercase ${
            Silian_allClean ? "text-green-700" : "text-red-600"
          }`}>
          {Silian_allClean
            ? Silian_t("allClean")
            : Silian_t("conflictsCount", { count: Silian_conflictCount })}
        </span>
      </div>

      <div className="space-y-2 p-2">
        {Silian_files.map((Silian_file, Silian_index) => {
          const Silian_pathSegments = Silian_file.filePath.split("/").filter(Boolean)
          const Silian_fileLabel =
            Silian_pathSegments[Silian_pathSegments.length - 1] ||
            `UNTITLED_FILE_${Silian_index + 1}`
          const Silian_isActive = Silian_file.id === Silian_activeFileId

          return (
            <div key={Silian_file.id} className="relative flex items-stretch">
              <button
                type="button"
                onClick={() => Silian_onSelectFile(Silian_file.id)}
                className={`
                  flex min-h-11 min-w-0 flex-1 flex-col items-start gap-1 border
                  px-3 py-2 text-left transition-colors
                  ${
                    Silian_isActive
                      ? `border-tech-main bg-tech-main/10`
                      : `guide-line bg-white/70 hover:border-tech-main/50 hover:bg-white/90`
                  }
                `}>
                <span className="flex w-full items-center justify-between gap-2">
                  <span className="truncate font-mono text-xs tracking-widest text-tech-main uppercase">
                    {Silian_fileLabel}
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <Silian_FileExtBadge filePath={Silian_file.filePath} />
                    <Silian_StatusIndicator status={Silian_file.status} />
                  </span>
                </span>
                <span className="w-full truncate font-mono text-[0.6875rem] text-tech-main/60">
                  {Silian_file.filePath || "PATH_NOT_SET"}
                </span>
                <span className="flex w-full flex-wrap items-center gap-2 font-mono text-[0.625rem] tracking-widest text-tech-main/45 uppercase">
                  <span>{Silian_file.changeType ?? "modified"}</span>
                  <span>+{Silian_file.additions ?? 0}</span>
                  <span>-{Silian_file.deletions ?? 0}</span>
                </span>
              </button>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
