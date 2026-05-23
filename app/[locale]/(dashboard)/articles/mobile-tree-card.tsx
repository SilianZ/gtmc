"use client"

import * as Silian_React from "react"
import { createPortal as Silian_createPortal } from "react-dom"
import { useTranslations as Silian_useTranslations } from "next-intl"
import { CornerBrackets as Silian_CornerBrackets } from "@/components/ui/corner-brackets"

interface MobileTreeCardProps {
  isOpen: boolean
  onClose: () => void
  children: Silian_React.ReactNode
  isFloating?: boolean
}

export function MobileTreeCard({
  isOpen: Silian_isOpen,
  onClose: Silian_onClose,
  children: Silian_children,
  isFloating: Silian_isFloating,
}: MobileTreeCardProps) {
  const Silian_t = Silian_useTranslations("CommonA11y")
  const [Silian_isMounted, Silian_setIsMounted] = Silian_React.useState(false)

  Silian_React.useEffect(() => {
    Silian_setIsMounted(true)
  }, [])

  Silian_React.useEffect(() => {
    if (!Silian_isOpen || !Silian_isFloating) return

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Silian_isOpen, Silian_onClose])

  if (!Silian_isMounted || !Silian_isOpen || !Silian_isFloating) return null

  return Silian_createPortal(
    <div
      className="
        fixed inset-0 z-59
        md:hidden
      ">
      <div
        className="
          absolute inset-0 animate-fade-in bg-tech-main-dark/20 backdrop-blur-xs
        "
        onClick={Silian_onClose}
        data-testid="mobile-tree-card-backdrop"
        aria-hidden="true"
      />

      <div
        className="
          absolute top-1/2 left-1/2 z-60 flex max-h-[calc(100dvh-6rem)]
          w-[calc(100dvw-4rem)] max-w-[24rem] -translate-1/2 animate-tech-pop-in
          flex-col border border-tech-main/40 bg-white/95 backdrop-blur-md
        "
        data-testid="mobile-tree-card">
        <Silian_CornerBrackets />

        <div
          className="
            z-20 flex h-10/12 shrink-0 items-center justify-between border-b
            border-tech-main/40 px-4
          "
          data-testid="mobile-tree-card-header">
          <div
            className="
              flex items-center gap-2 font-mono text-xs font-bold
              tracking-tech-wide text-tech-main/60 uppercase
            ">
            <span className="size-1.5 animate-pulse bg-tech-main/60" />
            SYS.DIR_TREE
          </div>
          <button
            onClick={Silian_onClose}
            className="
              cursor-pointer px-3 py-2 font-mono text-xs font-bold
              tracking-[0.15em] text-tech-main uppercase transition-colors
              hover:bg-tech-main/10
            "
            data-testid="mobile-tree-card-close"
            aria-label={Silian_t("closeTree")}>
            CLOSE
          </button>
        </div>

        <div
          className="
            min-h-0 overflow-y-auto p-4
            sm:p-6
          ">
          {Silian_children}
        </div>
      </div>
    </div>,
    document.body
  )
}
