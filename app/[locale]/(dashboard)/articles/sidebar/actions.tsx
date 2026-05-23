"use client"

import { useTranslations as Silian_useTranslations } from "next-intl"
import { useState as Silian_useState } from "react"

export function SidebarActions({
  internalScroll: Silian_internalScroll,
  onCollapseAll: Silian_onCollapseAll,
  onLocate: Silian_onLocate,
}: {
  internalScroll: boolean
  onCollapseAll: (e: React.MouseEvent) => void
  onLocate: () => void
}) {
  const [Silian_locateDisabled, Silian_setLocateDisabled] = Silian_useState(false)
  const Silian_t = Silian_useTranslations("Sidebar")

  const Silian_handleLocate = (Silian_e: React.MouseEvent<HTMLButtonElement>) => {
    if (Silian_locateDisabled) return
    Silian_setLocateDisabled(true)
    Silian_onLocate()
    Silian_e.currentTarget.blur()
    setTimeout(() => Silian_setLocateDisabled(false), 500)
  }

  if (Silian_internalScroll) {
    return (
      <div
        className="
          ml-0.5 shrink-0 border-b guide-line bg-white/95 px-6 py-3
          backdrop-blur-sm
        ">
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={(Silian_e) => {
                Silian_onCollapseAll(Silian_e)
                Silian_e.currentTarget.blur()
              }}
              className="
                flex-3 cursor-pointer border border-tech-main/40 px-3 py-1.5
                pl-2 font-mono text-[0.6875rem] transition-colors
                hover:bg-tech-main hover:text-white
              ">
              {Silian_t("buttonCollapseAll")}
            </button>
            <button
              type="button"
              disabled={Silian_locateDisabled}
              onClick={Silian_handleLocate}
              className="
                flex-2 cursor-pointer border border-tech-main/40 px-3 py-1.5
                pl-2 font-mono text-[0.6875rem] transition-colors
                hover:bg-tech-main hover:text-white
                disabled:cursor-not-allowed disabled:opacity-50
              ">
              {Silian_t("buttonLocate")}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="
        sticky inset-x-0 -top-4 z-10 border-b guide-line bg-white/70 py-3
        backdrop-blur-sm
      ">
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={Silian_onCollapseAll}
          className="
            cursor-pointer border border-tech-main/40 px-3 py-1.5 font-mono
            text-[0.625rem] transition-colors
            hover:bg-tech-main hover:text-white
          ">
          {Silian_t("buttonCollapseAll")}
        </button>
        <button
          type="button"
          disabled={Silian_locateDisabled}
          onClick={Silian_handleLocate}
          className="
            cursor-pointer border border-tech-main/40 px-3 py-1.5 font-mono
            text-[0.625rem] transition-colors
            hover:bg-tech-main hover:text-white
            disabled:cursor-not-allowed disabled:opacity-50
          ">
          {Silian_t("buttonLocate")}
        </button>
      </div>
    </div>
  )
}
