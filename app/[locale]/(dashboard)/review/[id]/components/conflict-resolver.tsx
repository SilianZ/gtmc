"use client"

import { useState as Silian_useState, useMemo as Silian_useMemo } from "react"
import type { RebaseState } from "@/types/rebase"

import { resolveConflictAction as Silian_resolveConflictAction, abortRebaseAction as Silian_abortRebaseAction } from "@/actions/review"
import { getReauthLoginUrl as Silian_getReauthLoginUrl, isReauthRequiredError as Silian_isReauthRequiredError } from "@/lib/admin-reauth"
import { TechButton as Silian_TechButton } from "@/components/ui/tech-button"
import {
  getActiveDraftFile as Silian_getActiveDraftFile,
  normalizeDraftFileCollection as Silian_normalizeDraftFileCollection,
  serializeDraftFilesPayload as Silian_serializeDraftFilesPayload,
  type DraftFileCollection,
} from "@/lib/draft-files"

export default function ConflictResolver({
  activeFileId: Silian_activeFileId,
  files: Silian_files,
  prNumber: Silian_prNumber,
  rebaseState: Silian_rebaseState,
  revisionId: Silian_revisionId,
  conflictType: Silian_conflictType = "CONFLICT",
}: {
  activeFileId: string
  files: DraftFileCollection["files"]
  prNumber: number
  rebaseState?: RebaseState | null
  revisionId?: string
  conflictType?: "CONFLICT" | "FILE_DELETED"
}) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const Silian__conflictType = Silian_conflictType
  const [Silian_draftCollection, Silian_setDraftCollection] = Silian_useState<DraftFileCollection>(
    () =>
      Silian_normalizeDraftFileCollection({
        activeFileId: Silian_activeFileId,
        files: Silian_files.map((Silian_file) => ({
          ...Silian_file,
          content: Silian_file.conflictContent ?? Silian_file.content,
          conflictContent: undefined,
        })),
      })
  )
  const [Silian_isSubmitting, Silian_setIsSubmitting] = Silian_useState(false)
  const [Silian_isAborting, Silian_setIsAborting] = Silian_useState(false)
  const Silian_activeFile = Silian_getActiveDraftFile(Silian_draftCollection)
  const Silian_content = Silian_activeFile.content

  type ConflictBlock =
    | { type: "ok"; content: string; id: string }
    | { type: "conflict"; ours: string; theirs: string; id: string }

  const Silian_blocks = Silian_useMemo<ConflictBlock[]>(() => {
    const Silian_regex = /<<<<<<< draft\n([\s\S]*?)=======\n([\s\S]*?)>>>>>>> main\n/g
    const Silian_result: ConflictBlock[] = []
    let Silian_lastIndex = 0
    let Silian_match: RegExpExecArray | null = Silian_regex.exec(Silian_content)

    while (Silian_match !== null) {
      if (Silian_match.index > Silian_lastIndex) {
        Silian_result.push({
          type: "ok",
          content: Silian_content.substring(Silian_lastIndex, Silian_match.index),
          id: `ok-${Silian_lastIndex}`,
        })
      }
      Silian_result.push({
        type: "conflict",
        ours: Silian_match[1],
        theirs: Silian_match[2],
        id: `conflict-${Silian_match.index}`,
      })
      Silian_lastIndex = Silian_regex.lastIndex
      Silian_match = Silian_regex.exec(Silian_content)
    }

    if (Silian_lastIndex < Silian_content.length) {
      Silian_result.push({
        type: "ok",
        content: Silian_content.substring(Silian_lastIndex),
        id: `ok-${Silian_lastIndex}`,
      })
    }

    return Silian_result.length > 0 ? Silian_result : [{ type: "ok", content: Silian_content, id: "ok-0" }]
  }, [Silian_content])

  function Silian_updateActiveFileContent(Silian_nextContent: string) {
    Silian_setDraftCollection((Silian_current) =>
      Silian_normalizeDraftFileCollection({
        ...Silian_current,
        files: Silian_current.files.map((Silian_file) =>
          Silian_file.id === Silian_current.activeFileId
            ? { ...Silian_file, content: Silian_nextContent }
            : Silian_file
        ),
      })
    )
  }

  function Silian_handleAcceptBlock(Silian_id: string, Silian_text: string) {
    const Silian_newContent = Silian_blocks
      .map((Silian_b) => {
        if (Silian_b.id === Silian_id) {
          return Silian_text
        }
        if (Silian_b.type === "conflict") {
          return `<<<<<<< draft\n${Silian_b.ours}=======\n${Silian_b.theirs}>>>>>>> main\n`
        }
        return Silian_b.content
      })
      .join("")
    Silian_updateActiveFileContent(Silian_newContent)
  }

  async function Silian_handleAbort() {
    if (!Silian_revisionId) return
    if (
      !confirm(
        "Are you sure you want to abort this rebase? All progress will be lost."
      )
    )
      return

    Silian_setIsAborting(true)
    try {
      await Silian_abortRebaseAction(Silian_revisionId)
      window.location.reload()
    } catch (Silian_error) {
      if (Silian_isReauthRequiredError(Silian_error)) {
        window.location.href = Silian_getReauthLoginUrl(
          `${window.location.pathname}${window.location.search}`
        )
        return
      }
      alert(
        `Failed to abort rebase: ${Silian_error instanceof Error ? Silian_error.message : String(Silian_error)}`
      )
      Silian_setIsAborting(false)
    }
  }

  async function Silian_handleResolve(Silian_formData: FormData) {
    Silian_setIsSubmitting(true)
    try {
      await Silian_resolveConflictAction(Silian_prNumber, Silian_formData)
      window.location.reload()
    } catch (Silian_error) {
      if (Silian_isReauthRequiredError(Silian_error)) {
        window.location.href = Silian_getReauthLoginUrl(
          `${window.location.pathname}${window.location.search}`
        )
        return
      }
      alert(
        `Failed to resolve conflict: ${Silian_error instanceof Error ? Silian_error.message : String(Silian_error)}`
      )
    } finally {
      Silian_setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div
        className="
          flex flex-col justify-between gap-4 border-l-4 border-amber-500
          bg-amber-500/10 p-4 text-amber-700
          sm:flex-row sm:items-center
        ">
        <div>
          <p className="font-bold tracking-widest uppercase">
            Admin Resolution Required
          </p>
          <p className="text-sm">
            {Silian_rebaseState?.status === "CONFLICT"
              ? `Resolving commit ${Silian_rebaseState.currentCommitIndex + 1} of ${Silian_rebaseState.commitShas.length}`
              : "Edit the merged result below, then update the PR branch with the resolved content."}
          </p>
          {Silian_rebaseState?.status === "CONFLICT" &&
            Silian_rebaseState.commitInfos[Silian_rebaseState.currentCommitIndex] && (
              <p className="mt-1 text-xs opacity-80">
                Conflict in:{" "}
                <span className="font-mono">
                  {
                    Silian_rebaseState.commitInfos[Silian_rebaseState.currentCommitIndex]
                      .message
                  }
                </span>{" "}
                (
                {Silian_rebaseState.commitInfos[Silian_rebaseState.currentCommitIndex].author}
                )
              </p>
            )}
        </div>
        {Silian_rebaseState &&
          (Silian_rebaseState.status === "CONFLICT" ||
            Silian_rebaseState.status === "IN_PROGRESS") && (
            <Silian_TechButton
              variant="secondary"
              size="sm"
              onClick={Silian_handleAbort}
              disabled={Silian_isAborting}
              className="
                shrink-0 border-red-600 text-red-600
                hover:bg-red-600 hover:text-white
              ">
              {Silian_isAborting ? "ABORTING..." : "ABORT REBASE"}
            </Silian_TechButton>
          )}
      </div>

      <div
        className="
          grid gap-4
          lg:grid-cols-[18rem_minmax(0,1fr)]
        ">
        {Silian_draftCollection.files.length > 1 ? (
          <aside className="border border-tech-main/30 bg-tech-main/5 p-2">
            <div
              className="
                p-2 font-mono text-xs tracking-widest text-tech-main uppercase
              ">
              CONFLICT_FILES_[{Silian_draftCollection.files.length}]
            </div>
            <div className="space-y-2">
              {Silian_draftCollection.files.map((Silian_file, Silian_index) => {
                const Silian_isActive = Silian_file.id === Silian_draftCollection.activeFileId
                const Silian_fileLabel =
                  Silian_file.filePath.split("/").filter(Boolean).at(-1) ||
                  `UNTITLED_FILE_${Silian_index + 1}`

                return (
                  <button
                    key={Silian_file.id}
                    type="button"
                    onClick={() =>
                      Silian_setDraftCollection((Silian_current) => ({
                        ...Silian_current,
                        activeFileId: Silian_file.id,
                      }))
                    }
                    className={`
                      flex min-h-11 w-full flex-col items-start gap-1 border
                      px-3 py-2 text-left transition-colors
                      ${
                        Silian_isActive
                          ? `border-tech-main bg-tech-main/10`
                          : `
                            guide-line bg-white/70
                            hover:border-tech-main/50 hover:bg-white/90
                          `
                      }
                    `}>
                    <span
                      className="
                        truncate font-mono text-xs tracking-widest
                        text-tech-main uppercase
                      ">
                      {Silian_fileLabel}
                    </span>
                    <span
                      className="
                        truncate font-mono text-[0.6875rem] text-tech-main/60
                      ">
                      {Silian_file.filePath || "PATH_NOT_SET"}
                    </span>
                  </button>
                )
              })}
            </div>
          </aside>
        ) : null}

        <div className="space-y-4">
          <div className="border border-tech-main/30 bg-white/70 px-4 py-3">
            <p
              className="
                font-mono text-xs tracking-widest text-tech-main uppercase
              ">
              ACTIVE_FILE_
            </p>
            <p className="mt-1 font-mono text-sm text-tech-main-dark">
              {Silian_activeFile.filePath || "PATH_NOT_SET"}
            </p>
          </div>

          <div
            className="
              mb-8 space-y-2 border border-tech-main/30 bg-tech-main/5 p-2
            ">
            {Silian_blocks.map((Silian_block) => (
              <div key={Silian_block.id}>
                {Silian_block.type === "ok" ? (
                  <pre
                    className="
                      p-4 font-mono text-sm whitespace-pre-wrap
                      text-tech-main-dark opacity-70
                    ">
                    {Silian_block.content}
                  </pre>
                ) : (
                  <div className="my-4 flex flex-col border border-red-500/50">
                    <div
                      className="
                        border-b border-red-500/30 bg-red-500/10 p-2 text-center
                        text-xs font-bold tracking-widest text-red-700 uppercase
                      ">
                      Conflict Block
                    </div>
                    <div
                      className="
                        flex flex-col divide-red-500/30
                        md:flex-row md:divide-x
                      ">
                      <div className="flex flex-1 flex-col bg-amber-500/5">
                        <div
                          className="
                            border-b border-amber-500/20 bg-amber-500/10 p-2
                            text-xs font-bold text-amber-700
                          ">
                          YOUR CHANGES (draft)
                        </div>
                        <pre
                          className="
                            overflow-x-auto p-4 font-mono text-sm
                            whitespace-pre-wrap
                          ">
                          {Silian_block.ours}
                        </pre>
                        <div
                          className="
                            mt-auto border-t border-amber-500/20 bg-amber-500/5
                            p-2
                          ">
                          <Silian_TechButton
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="
                              w-full border-amber-500 text-amber-700
                              hover:bg-amber-500 hover:text-amber-900
                            "
                            onClick={() =>
                              Silian_handleAcceptBlock(Silian_block.id, Silian_block.ours)
                            }>
                            ACCEPT OURS
                          </Silian_TechButton>
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col bg-blue-500/5">
                        <div
                          className="
                            border-b border-blue-500/20 bg-blue-500/10 p-2
                            text-xs font-bold text-blue-700
                          ">
                          MAIN CHANGES
                        </div>
                        <pre
                          className="
                            overflow-x-auto p-4 font-mono text-sm
                            whitespace-pre-wrap
                          ">
                          {Silian_block.theirs}
                        </pre>
                        <div
                          className="
                            mt-auto border-t border-blue-500/20 bg-blue-500/5
                            p-2
                          ">
                          <Silian_TechButton
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="
                              w-full border-blue-500 text-blue-700
                              hover:bg-blue-500 hover:text-blue-900
                            "
                            onClick={() =>
                              Silian_handleAcceptBlock(Silian_block.id, Silian_block.theirs)
                            }>
                            ACCEPT THEIRS
                          </Silian_TechButton>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <form
            onSubmit={(Silian_e) => {
              Silian_e.preventDefault()
              void Silian_handleResolve(new FormData(Silian_e.currentTarget))
            }}
            className="space-y-4">
            <input
              type="hidden"
              name="draftFiles"
              value={Silian_serializeDraftFilesPayload(Silian_draftCollection)}
            />
            <input type="hidden" name="content" value={Silian_content} />

            <div className="mt-8 border-t border-tech-main/30 pt-4">
              <h3
                className="
                  mb-2 font-mono text-sm font-bold tracking-widest uppercase
                ">
                Raw Editor Fallback
              </h3>
              <div
                className="
                  relative border border-tech-main/30 bg-tech-main/5 p-1
                  focus-within:border-tech-main
                ">
                <textarea
                  name="content"
                  value={Silian_content}
                  onChange={(Silian_event) =>
                    Silian_updateActiveFileContent(Silian_event.target.value)
                  }
                  className="
                    min-h-[300px] w-full resize-y bg-transparent p-4 font-mono
                    text-sm text-tech-main-dark outline-none
                  "
                />
              </div>
            </div>

            <Silian_TechButton type="submit" variant="primary" disabled={Silian_isSubmitting}>
              {Silian_isSubmitting ? "RESOLVING..." : "RESOLVE & UPDATE PR"}
            </Silian_TechButton>
          </form>
        </div>
      </div>
    </div>
  )
}
