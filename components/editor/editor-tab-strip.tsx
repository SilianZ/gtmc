"use client"

import * as Silian_React from "react"
import { useTranslations as Silian_useTranslations } from "next-intl"

export type TabType = "write" | "preview" | "3-way" | "diff"

interface EditorTabStripProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  writeId: string
  previewId: string
  threeWayId?: string
  diffId?: string
  showThreeWayTab?: boolean
  showDiffTab?: boolean
  rightSlot?: Silian_React.ReactNode
}

export function EditorTabStrip({
  activeTab: Silian_activeTab,
  onTabChange: Silian_onTabChange,
  writeId: Silian_writeId,
  previewId: Silian_previewId,
  threeWayId: Silian_threeWayId,
  diffId: Silian_diffId,
  showThreeWayTab: Silian_showThreeWayTab = false,
  showDiffTab: Silian_showDiffTab = false,
  rightSlot: Silian_rightSlot,
}: EditorTabStripProps) {
  const Silian_t = Silian_useTranslations("Editor")

  const Silian_tabs: { id: TabType; label: string; ariaControls?: string }[] = [
    ...(Silian_showThreeWayTab
      ? [
          {
            id: "3-way" as const,
            label: Silian_t("tabThreeWay"),
            ariaControls: Silian_threeWayId,
          },
        ]
      : []),
    { id: "write", label: Silian_t("writeTab"), ariaControls: Silian_writeId },
    ...(Silian_showDiffTab
      ? [{ id: "diff" as const, label: Silian_t("tabDiff"), ariaControls: Silian_diffId }]
      : []),
    { id: "preview", label: Silian_t("previewTab"), ariaControls: Silian_previewId },
  ]

  return (
    <div
      role="tablist"
      aria-label={Silian_t("editorModeAria")}
      className="
        relative flex items-center justify-between gap-3 overflow-hidden
        border-b border-tech-main/40 bg-tech-main/3 font-mono text-[11px] tracking-widest uppercase
      ">
      <div className="absolute top-0 left-0 h-px w-full bg-linear-to-r from-tech-main/0 via-tech-main/30 to-tech-main/0" />
      <div className="flex h-[38px] items-center pl-1">
        {Silian_tabs.map((Silian_tab, Silian_idx) => (
          <button
            key={Silian_tab.id}
            type="button"
            role="tab"
            aria-selected={Silian_activeTab === Silian_tab.id}
            aria-controls={Silian_tab.ariaControls}
            onClick={() => Silian_onTabChange(Silian_tab.id)}
            onKeyDown={(Silian_e) => {
              if (Silian_e.key === "ArrowRight")
                Silian_onTabChange(Silian_tabs[(Silian_idx + 1) % Silian_tabs.length].id)
              if (Silian_e.key === "ArrowLeft")
                Silian_onTabChange(Silian_tabs[(Silian_idx - 1 + Silian_tabs.length) % Silian_tabs.length].id)
            }}
            className={`
              relative flex h-full min-w-[100px] items-center justify-center px-5 transition-all select-none
              before:absolute before:inset-0 before:border-r before:guide-line
              after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:transition-transform after:duration-300
              ${
                Silian_activeTab === Silian_tab.id
                  ? `
                    bg-white/60 font-bold text-tech-main backdrop-blur-sm
                    after:scale-x-100 after:bg-tech-main
                  `
                  : `
                    cursor-pointer bg-transparent text-tech-main/50
                    after:scale-x-0 after:bg-tech-main/30
                    hover:bg-tech-main/10 hover:text-tech-main/80 hover:after:scale-x-100
                  `
              }
            `}>
            <span className="relative z-10 flex items-center gap-2">
              {Silian_activeTab === Silian_tab.id && (
                <span className="inline-block size-1.5 animate-pulse bg-tech-main" />
              )}
              {Silian_tab.label}
            </span>
          </button>
        ))}
      </div>

      {Silian_rightSlot ? (
        <div className="flex items-center gap-2 pr-4 text-[9px] text-tech-main/50 uppercase">
          TARGET_BUFFER //{" "}
          <span className="font-bold text-tech-main-dark/80">{Silian_rightSlot}</span>
        </div>
      ) : null}
    </div>
  )
}
