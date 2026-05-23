"use client"

import * as Silian_React from "react"
import { useState as Silian_useState } from "react"
import { useTranslations as Silian_useTranslations } from "next-intl"
import { TechButton as Silian_TechButton } from "@/components/ui/tech-button"
import { MergeView as Silian_MergeView } from "@codemirror/merge"
import { EditorView as Silian_EditorView } from "@codemirror/view"
import { markdown as Silian_markdown, markdownLanguage as Silian_markdownLanguage } from "@codemirror/lang-markdown"
import { languages as Silian_languages } from "@codemirror/language-data"

const Silian_mergeTheme = Silian_EditorView.theme({
  "&": {
    fontFamily: "var(--font-mono)",
    fontSize: "0.875rem",
    lineHeight: "1.625",
  },
  ".cm-mergeView": {
    border: "none",
  },
  ".cm-mergeViewEditors": {
    minHeight: "100px",
  },
  ".cm-scroller": {
    overflow: "auto",
  },
  ".cm-merge-revert": {
    cursor: "pointer",
    background: "rgba(0, 0, 0, 0.1)",
    border: "none",
    padding: "2px 6px",
    borderRadius: "0",
    fontWeight: "bold",
    "&:hover": {
      background: "rgba(0, 0, 0, 0.2)",
    },
  },
})

export interface ConflictBlockProps {
  id: string
  index?: number
  total?: number
  ours: string
  theirs: string
  onAcceptOurs: () => void
  onAcceptTheirs: () => void
  onManualEdit: (content: string) => void
  autoApplied?: { resolution: string; source: "rerere" }
}

export function ConflictBlock({
  id: Silian_id,
  index: Silian_index,
  total: Silian_total,
  ours: Silian_ours,
  theirs: Silian_theirs,
  onAcceptOurs: Silian_onAcceptOurs,
  onAcceptTheirs: Silian_onAcceptTheirs,
  onManualEdit: Silian_onManualEdit,
  autoApplied: Silian_autoApplied,
}: ConflictBlockProps) {
  const Silian_t = Silian_useTranslations("Review")
  const Silian_editorT = Silian_useTranslations("Editor")
  const [Silian_isManualEdit, Silian_setIsManualEdit] = Silian_useState(false)
  const [Silian_manualContent, Silian_setManualContent] = Silian_useState(Silian_ours)
  const [Silian_overrideAuto, Silian_setOverrideAuto] = Silian_useState(false)
  const [Silian_justResolved, Silian_setJustResolved] = Silian_useState(false)
  const Silian_mergeViewContainer = Silian_React.useRef<HTMLDivElement>(null)

  const Silian_showAutoResolved = Silian_autoApplied && !Silian_overrideAuto

  const Silian_flashResolved = () => {
    Silian_setJustResolved(true)
    setTimeout(() => Silian_setJustResolved(false), 200)
  }

  const Silian_handleAcceptOurs = () => {
    Silian_flashResolved()
    Silian_onAcceptOurs()
  }

  const Silian_handleAcceptTheirs = () => {
    Silian_flashResolved()
    Silian_onAcceptTheirs()
  }

  Silian_React.useEffect(() => {
    if (!Silian_mergeViewContainer.current || Silian_isManualEdit || Silian_showAutoResolved) return

    const Silian_view = new Silian_MergeView({
      a: {
        doc: Silian_ours,
        extensions: [
          Silian_EditorView.editable.of(false),
          Silian_markdown({ base: Silian_markdownLanguage, codeLanguages: Silian_languages }),
          Silian_mergeTheme,
        ],
      },
      b: {
        doc: Silian_theirs,
        extensions: [
          Silian_EditorView.editable.of(false),
          Silian_markdown({ base: Silian_markdownLanguage, codeLanguages: Silian_languages }),
          Silian_mergeTheme,
        ],
      },
      parent: Silian_mergeViewContainer.current,
      orientation: "a-b",
      revertControls: "a-to-b",
    })

    return () => Silian_view.destroy()
  }, [Silian_ours, Silian_theirs, Silian_isManualEdit, Silian_showAutoResolved])

  const Silian_counterLabel =
    Silian_index !== undefined && Silian_total !== undefined
      ? Silian_t("conflictNofN", { current: Silian_index, total: Silian_total })
      : "CONFLICT_BLOCK_"

  return (
    <div
      className={`my-4 flex flex-col border border-l-4 border-red-500/50 transition-colors duration-200 ${
        Silian_justResolved
          ? "border-l-green-500 bg-green-500/5"
          : Silian_showAutoResolved
            ? "border-l-green-500"
            : "border-l-red-500"
      }`}
      data-conflict-id={Silian_id}>
      <div className="border-b border-red-500/30 bg-red-500/10 p-2 text-center text-xs font-bold tracking-widest text-red-700 uppercase">
        {Silian_counterLabel}
      </div>

      {Silian_autoApplied && (
        <div className="flex items-center gap-3 border-b border-red-500/20 px-3 py-2">
          <span className="border border-green-500/30 bg-green-500/10 px-3 py-1 font-mono text-xs tracking-widest text-green-700 uppercase">
            {Silian_t("autoResolved")}
          </span>
          {!Silian_overrideAuto && (
            <Silian_TechButton
              variant="ghost"
              size="sm"
              onClick={() => Silian_setOverrideAuto(true)}>
              {Silian_t("override")}
            </Silian_TechButton>
          )}
        </div>
      )}

      {Silian_showAutoResolved ? (
        <div className="p-3">
          <pre className="border border-green-500/20 bg-green-500/5 p-3 font-mono text-sm/relaxed whitespace-pre-wrap text-green-900">
            {Silian_autoApplied.resolution}
          </pre>
        </div>
      ) : (
        <>
          {!Silian_isManualEdit && (
            <div className="flex flex-col">
              <div className="flex">
                <div className="flex-1 border-b border-amber-500/20 bg-amber-500/5 px-3 py-1.5">
                  <span className="font-mono text-xs font-bold tracking-widest text-amber-700 uppercase">
                    {Silian_t("ourChanges")}
                  </span>
                </div>
                <div className="w-px bg-red-500/20" />
                <div className="flex-1 border-b border-blue-500/20 bg-blue-500/5 px-3 py-1.5">
                  <span className="font-mono text-xs font-bold tracking-widest text-blue-700 uppercase">
                    {Silian_t("theirChanges")}
                  </span>
                </div>
              </div>

              <div className="flex-1" ref={Silian_mergeViewContainer} />

              <div className="flex border-t border-red-500/20">
                <div className="flex-1 border-r border-red-500/20 bg-amber-500/5 p-2">
                  <Silian_TechButton
                    variant="secondary"
                    size="sm"
                    className="min-h-11 w-full border-amber-500/50 text-amber-700 hover:border-amber-500 hover:bg-amber-500/20"
                    onClick={Silian_handleAcceptOurs}>
                    {Silian_t("acceptDraft")}
                  </Silian_TechButton>
                </div>
                <div className="flex-1 bg-blue-500/5 p-2">
                  <Silian_TechButton
                    variant="secondary"
                    size="sm"
                    className="min-h-11 w-full border-blue-500/50 text-blue-700 hover:border-blue-500 hover:bg-blue-500/20"
                    onClick={Silian_handleAcceptTheirs}>
                    {Silian_t("acceptMain")}
                  </Silian_TechButton>
                </div>
              </div>
            </div>
          )}

          {Silian_isManualEdit && (
            <div className="flex flex-col gap-2 p-3">
              <span className="font-mono text-xs font-bold tracking-widest text-tech-main uppercase">
                {Silian_t("manualEdit")}
              </span>
              <textarea
                className="min-h-[160px] w-full resize-y border border-tech-main/40 bg-tech-bg p-2 font-mono text-sm text-tech-main focus:border-tech-main focus:outline-none"
                value={Silian_manualContent}
                onChange={(Silian_e) => Silian_setManualContent(Silian_e.target.value)}
              />
              <div className="flex gap-2">
                <Silian_TechButton
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    Silian_onManualEdit(Silian_manualContent)
                    Silian_setIsManualEdit(false)
                  }}>
                  {Silian_t("applyManualEdit")}
                </Silian_TechButton>
                <Silian_TechButton
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    Silian_setManualContent(Silian_ours)
                    Silian_setIsManualEdit(false)
                  }}>
                  {Silian_editorT("cancelButton")}
                </Silian_TechButton>
              </div>
            </div>
          )}

          {!Silian_isManualEdit && (
            <div className="flex justify-center border-t border-red-500/20 p-2">
              <Silian_TechButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  Silian_setManualContent(Silian_ours)
                  Silian_setIsManualEdit(true)
                }}>
                {Silian_t("manualEdit")}
              </Silian_TechButton>
            </div>
          )}
        </>
      )}
    </div>
  )
}
