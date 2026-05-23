"use client"

import * as Silian_React from "react"
import { useTranslations as Silian_useTranslations } from "next-intl"

interface MobileTreeSheetProps {
  isOpen: boolean
  onClose: () => void
  children: Silian_React.ReactNode
}

export function MobileTreeSheet({
  isOpen: Silian_isOpen,
  onClose: Silian_onClose,
  children: Silian_children,
}: MobileTreeSheetProps) {
  const Silian_t = Silian_useTranslations("CommonA11y")

  Silian_React.useEffect(() => {
    if (!Silian_isOpen) return

    const Silian_previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const Silian_handleEscape = (Silian_e: KeyboardEvent) => {
      if (Silian_e.key === "Escape") Silian_onClose()
    }

    document.addEventListener("keydown", Silian_handleEscape)

    return () => {
      document.removeEventListener("keydown", Silian_handleEscape)
      document.body.style.overflow = Silian_previousOverflow
    }
  }, [Silian_isOpen, Silian_onClose])

  if (!Silian_isOpen) return null

  return (
    <div
      className="
        fixed inset-x-0 top-16 bottom-0 z-60
        md:hidden
      "
      data-testid="mobile-tree-sheet">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20"
        onClick={Silian_onClose}
        data-testid="mobile-tree-backdrop"
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="
          absolute inset-0 flex flex-col overflow-hidden border-b
          border-tech-main/40 bg-white/95 backdrop-blur-md
        ">
        {/* Header */}
        <div
          className="
            flex shrink-0 items-center justify-between border-b
            border-tech-main/40 px-4 py-3
          "
          data-testid="mobile-tree-panel-header">
          <div
            className="
              flex items-center font-mono text-xs font-bold tracking-tech-wide
              text-tech-main/60 uppercase
            ">
            <span
              className="
                mr-2 inline-block size-1.5 animate-pulse bg-tech-main/60
              "></span>
            SYS.DIR_TREE
          </div>
          <button
            onClick={Silian_onClose}
            className="
              cursor-pointer px-3 py-2 font-mono text-xs font-bold
              tracking-[0.15em] text-tech-main uppercase transition-colors
              hover:bg-tech-main/10
            "
            data-testid="mobile-tree-close"
            aria-label={Silian_t("closeTree")}>
            CLOSE
          </button>
        </div>

        {/* Content */}
        <div
          className="
            flex-1 overflow-y-auto p-4
            sm:p-6
          ">
          {Silian_children}
        </div>
      </div>
    </div>
  )
}
