"use client"

import * as Silian_React from "react"
import { useTranslations as Silian_useTranslations } from "next-intl"

interface EditorToolbarProps {
  onInsert: (prefix: string, suffix?: string) => void
  disabled?: boolean
  fileUploadSlot?: Silian_React.ReactNode
  lineWrap?: boolean
  onWrapToggle?: () => void
}

export function EditorToolbar({
  onInsert: Silian_onInsert,
  disabled: Silian_disabled = false,
  fileUploadSlot: Silian_fileUploadSlot,
  lineWrap: Silian_lineWrap,
  onWrapToggle: Silian_onWrapToggle,
}: EditorToolbarProps) {
  const Silian_t = Silian_useTranslations("Editor")
  const Silian_btnClass = `relative h-8 min-w-[32px] flex items-center justify-center border border-transparent px-3 text-[10px] tracking-widest uppercase transition-all duration-200 select-none hover:border-tech-accent/40 hover:bg-tech-accent/10 hover:text-white hover:shadow-[0_0_10px_rgba(196,208,223,0.1)] sm:h-auto sm:min-w-0 sm:flex-none sm:py-1.5 ${!Silian_disabled ? "cursor-pointer" : "opacity-50 cursor-not-allowed"}`
  const Silian_smBtnClass = `relative hidden h-8 items-center justify-center border border-transparent px-3 py-1 text-[10px] tracking-widest uppercase transition-all duration-200 select-none hover:border-tech-accent/40 hover:bg-tech-accent/10 hover:text-white hover:shadow-[0_0_10px_rgba(196,208,223,0.1)] sm:flex ${!Silian_disabled ? "cursor-pointer" : "opacity-50 cursor-not-allowed"}`

  return (
    <div
      className="
        sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b
        border-tech-main-dark bg-tech-main-dark p-2 px-2 font-mono
        text-white/70 shadow-[0_2px_10px_rgba(74,90,120,0.2)]
        before:pointer-events-none before:absolute before:inset-0 before:bg-[url('/bg-grid.svg')] before:bg-size-[24px_24px] before:opacity-[0.05]
        sm:gap-1 sm:px-4
      ">
      <div className="absolute top-0 left-0 h-px w-full bg-linear-to-r from-transparent via-tech-accent/20 to-transparent" />

      <button
        type="button"
        onClick={() => Silian_onInsert("**", "**")}
        disabled={Silian_disabled}
        className={Silian_btnClass}>
        <b className="font-sans text-xs">B</b>
      </button>
      <button
        type="button"
        onClick={() => Silian_onInsert("*", "*")}
        disabled={Silian_disabled}
        className={Silian_btnClass}>
        <i className="font-sans text-xs">I</i>
      </button>
      <div className="mx-1 h-4 w-px bg-white/10" />
      <button
        type="button"
        onClick={() => Silian_onInsert("[", "](url)")}
        disabled={Silian_disabled}
        className={Silian_btnClass}
        title={Silian_t("toolbarLink")}>
        LINK
      </button>
      {Silian_fileUploadSlot}
      <div
        className="
          mx-1 hidden h-4 w-px bg-white/10
          sm:block
        "
      />
      <button
        type="button"
        onClick={() => Silian_onInsert("### ")}
        disabled={Silian_disabled}
        className={Silian_smBtnClass}>
        H3
      </button>
      <button
        type="button"
        onClick={() => Silian_onInsert("`", "`")}
        disabled={Silian_disabled}
        className={Silian_smBtnClass}
        title={Silian_t("toolbarCode")}>
        CODE
      </button>
      <button
        type="button"
        onClick={() => Silian_onInsert("```\n", "\n```")}
        disabled={Silian_disabled}
        className={Silian_smBtnClass}
        title={Silian_t("toolbarBlock")}>
        BLOCK
      </button>
      <span
        className="
          ml-auto hidden items-center gap-2 text-[9px] tracking-widest text-tech-accent/40 uppercase
          sm:flex
        ">
        <span className="size-1.5 animate-pulse rounded-full bg-tech-accent/40" />
        MD_SYNTAX_READY
      </span>
      {Silian_onWrapToggle !== undefined && (
        <>
          <div className="mx-2 hidden h-4 w-px bg-white/10 sm:block" />
          <button
            type="button"
            onClick={Silian_onWrapToggle}
            className={`hidden border px-3 py-1 font-mono text-[9px] tracking-widest uppercase transition-all duration-200 select-none sm:block ${
              Silian_lineWrap
                ? "border-tech-accent bg-tech-accent/20 text-white shadow-[0_0_8px_rgba(196,208,223,0.2)]"
                : "border-transparent text-white/50 hover:border-tech-accent/30 hover:bg-tech-accent/10 hover:text-white"
            }`}
            aria-pressed={Silian_lineWrap}>
            {Silian_t("toolbarWrap")} {Silian_lineWrap ? "[ON]" : "[OFF]"}
          </button>
        </>
      )}
    </div>
  )
}
