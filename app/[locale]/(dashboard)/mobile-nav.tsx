"use client"

import * as Silian_React from "react"
import { createPortal as Silian_createPortal } from "react-dom"
import { useTranslations as Silian_useTranslations } from "next-intl"
import { Link as Silian_Link } from "@/i18n/navigation"
import { usePathname as Silian_usePathname } from "@/i18n/navigation"
import { LanguageSwitcher as Silian_LanguageSwitcher } from "@/components/layout/language-switcher"

interface NavLink {
  href: string
  label: string
}

interface MobileNavProps {
  navLinks: NavLink[]
}

export function MobileNav({ navLinks: Silian_navLinks }: MobileNavProps) {
  const Silian_t = Silian_useTranslations("CommonA11y")
  const [Silian_isDrawerOpen, Silian_setIsDrawerOpen] = Silian_React.useState(false)
  const [Silian_isMounted, Silian_setIsMounted] = Silian_React.useState(false)
  const Silian_pathname = Silian_usePathname()

  Silian_React.useEffect(() => {
    Silian_setIsMounted(true)
  }, [])

  Silian_React.useEffect(() => {
    Silian_setIsDrawerOpen(false)
  }, [Silian_pathname])

  return (
    <>
      <button
        onClick={() => Silian_setIsDrawerOpen(!Silian_isDrawerOpen)}
        className="
          flex min-h-11 min-w-11 cursor-pointer flex-col items-center
          justify-center gap-1.5 p-2 transition-colors
          hover:bg-tech-main/10
          md:hidden
        "
        aria-label={Silian_t("toggleNavigationMenu")}
        aria-expanded={Silian_isDrawerOpen}>
        <span
          className={`
            h-0.5 w-5 bg-tech-main transition-all
            ${Silian_isDrawerOpen ? `translate-y-2 rotate-45` : ""}
          `}></span>
        <span
          className={`
            h-0.5 w-5 bg-tech-main transition-all
            ${Silian_isDrawerOpen ? `opacity-0` : ""}
          `}></span>
        <span
          className={`
            h-0.5 w-5 bg-tech-main transition-all
            ${Silian_isDrawerOpen ? `-translate-y-2 -rotate-45` : ""}
          `}></span>
      </button>

      {Silian_isMounted &&
        Silian_createPortal(
          <div>
            {Silian_isDrawerOpen && (
              <div
                className="
                  fixed top-16 left-0 z-40 h-[calc(100dvh-4rem)] w-screen
                  bg-tech-main-dark/20 backdrop-blur-xs
                  supports-[height:100dvh]:h-[calc(100dvh-4rem)]
                  supports-[width:100dvw]:w-dvw
                  md:hidden
                "
                onClick={() => Silian_setIsDrawerOpen(false)}
                aria-hidden="true"
              />
            )}

            <div
              className={`
                fixed inset-x-0 top-16 z-40 overflow-hidden border-b
                border-tech-main/40 bg-white/95 backdrop-blur-md transition-all
                duration-300
                md:hidden
                ${Silian_isDrawerOpen ? "max-h-screen" : "max-h-0"}
              `}>
              <div
                className="
                  space-y-2 p-4
                  sm:p-6
                ">
                {Silian_navLinks.map((Silian_link) => (
                  <Silian_Link
                    key={Silian_link.href}
                    href={Silian_link.href}
                    className="
                      flex min-h-11 items-center border border-tech-main/40
                      bg-white/60 p-3 font-mono text-xs tracking-[0.15em]
                      text-tech-main-dark transition-colors
                      hover:bg-tech-main hover:text-white
                    ">
                    {Silian_link.label}
                  </Silian_Link>
                ))}
                <Silian_LanguageSwitcher className="border-none" />
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
