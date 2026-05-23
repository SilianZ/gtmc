"use client"

import * as Silian_React from "react"
import { Link as Silian_Link } from "@/i18n/navigation"
import { useSidebarContext as Silian_useSidebarContext } from "@/app/[locale]/(dashboard)/articles/sidebar/sidebar-context"

function Silian_useScrollProgress() {
  const [Silian_progress, Silian_setProgress] = Silian_React.useState(0)

  Silian_React.useEffect(() => {
    const Silian_onScroll = () => {
      const Silian_scrollTop = window.scrollY
      const Silian_docHeight = document.body.scrollHeight - window.innerHeight
      Silian_setProgress(Silian_docHeight > 0 ? Silian_scrollTop / Silian_docHeight : 0)
    }
    Silian_onScroll()
    window.addEventListener("scroll", Silian_onScroll, { passive: true })
    return () => window.removeEventListener("scroll", Silian_onScroll)
  }, [])

  return Silian_progress
}

export function MobileTocBar() {
  const { toc: Silian_toc, activeHeadingId: Silian_activeHeadingId } = Silian_useSidebarContext()
  const Silian_progress = Silian_useScrollProgress()
  const [Silian_isSheetOpen, Silian_setIsSheetOpen] = Silian_React.useState(false)
  const [Silian_mounted, Silian_setMounted] = Silian_React.useState(false)

  Silian_React.useEffect(() => {
    Silian_setMounted(true)
  }, [])

  Silian_React.useEffect(() => {
    if (!Silian_isSheetOpen) return
    const Silian_onKey = (Silian_e: KeyboardEvent) => {
      if (Silian_e.key === "Escape") Silian_setIsSheetOpen(false)
    }
    document.addEventListener("keydown", Silian_onKey)
    return () => document.removeEventListener("keydown", Silian_onKey)
  }, [Silian_isSheetOpen])

  Silian_React.useEffect(() => {
    if (!Silian_isSheetOpen) return
    const Silian_prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = Silian_prev
    }
  }, [Silian_isSheetOpen])

  if (!Silian_mounted || Silian_toc.length === 0) return null

  const Silian_activeItem = Silian_toc.find((Silian_item) => Silian_item.id === Silian_activeHeadingId)
  const Silian_pct = Math.round(Silian_progress * 100)


  return (
    <>


      {/* Progress strip — fixed just below sticky navbar */}
      <div className={`fixed inset-x-0 top-16 z-49 h-20 transition-opacity duration-500 sm:hidden ${window.scrollY > 64 ? "opacity-100" : "pointer-events-none opacity-0"}`}>
        {/* Section label — fixed right-aligned in navbar row */}
        {Silian_activeItem && (
          <button type="button" className="flex h-fit w-full items-center px-4 py-2 pr-4 backdrop-blur-xs sm:hidden" aria-label="Open table of contents" onClick={() => Silian_setIsSheetOpen(true)}>
            <div
              className="max-w-[40vw] truncate font-mono text-xs font-bold text-tech-main transition-colors duration-150 hover:text-tech-main"
            >
              {Silian_activeItem.text}
            </div>
          </button>
        )}
        <div
          className="h-0.5 bg-tech-main transition-[width] duration-150"
          style={{ width: `${Silian_pct}%` }}
        />
      </div>


      {/* Bottom Sheet overlay */}
      <div
        className={`fixed inset-0 z-60 sm:hidden ${Silian_isSheetOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!Silian_isSheetOpen}
      >
        {/* Backdrop */}
        <button
          type="button"
          aria-label="Close table of contents"
          className={`absolute inset-0 w-full bg-black/20 backdrop-blur-xs transition-opacity duration-300 ${Silian_isSheetOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => Silian_setIsSheetOpen(false)}
        />

        {/* Sheet panel */}
        <div
          className={`absolute inset-x-0 bottom-0 flex max-h-[70dvh] flex-col border-t border-tech-main/30 bg-white/95 backdrop-blur-md transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${Silian_isSheetOpen ? "translate-y-0" : "translate-y-full"}`}
          role="dialog"
          aria-modal="true"
          aria-label="Table of contents"
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b guide-line px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold tracking-[0.12em] text-tech-main/60 uppercase">
                本文目录
              </span>
              <span className="font-mono text-xs text-tech-main/40">·</span>
              <span className="mono-label">{Silian_pct}%</span>
            </div>

            <div className="mx-4 h-0.5 flex-1 bg-tech-main/15">
              <div
                className="h-full bg-tech-main transition-[width] duration-150"
                style={{ width: `${Silian_pct}%` }}
              />
            </div>

            <button
              type="button"
              onClick={() => Silian_setIsSheetOpen(false)}
              className="cursor-pointer px-3 py-2 font-mono text-xs font-bold tracking-[0.15em] text-tech-main uppercase transition-colors hover:bg-tech-main/10"
              aria-label="Close table of contents"
            >
              CLOSE
            </button>
          </div>

          {/* TOC list */}
          <ul className="flex-1 overflow-y-auto px-4 py-3">
            {Silian_toc.map((Silian_item) => {
              const Silian_isActive = Silian_item.id === Silian_activeHeadingId
              return (
                <li key={Silian_item.id}>
                  <Silian_Link
                    href={`#${Silian_item.id}`}
                    onClick={() => Silian_setIsSheetOpen(false)}
                    className={`block border-l-[3px] py-2.5 pr-2 pl-4 text-sm/snug transition-all duration-200 ${Silian_isActive
                      ? "border-tech-main font-semibold text-tech-main"
                      : "border-transparent text-tech-main/60 hover:border-tech-main/30 hover:text-tech-main"
                      }`}
                  >
                    {Silian_item.text}
                  </Silian_Link>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </>
  )
}
