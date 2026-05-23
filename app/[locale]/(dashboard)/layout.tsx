import * as Silian_React from "react"
import { getTranslations as Silian_getTranslations } from "next-intl/server"

import { ProfileButton as Silian_ProfileButton } from "@/components/ui/profile-button"
import { Logo as Silian_Logo } from "@/components/ui/logo"
import { MobileNav as Silian_MobileNav } from "./mobile-nav"
import { DesktopNav as Silian_DesktopNav } from "./desktop-nav"
import { SearchCommand as Silian_SearchCommand } from "@/components/search/search-command"
import { auth as Silian_auth } from "@/lib/auth"
import { getCurrentUserAuthContext as Silian_getCurrentUserAuthContext } from "@/lib/auth-context"
import { LanguageSwitcher as Silian_LanguageSwitcher } from "@/components/layout/language-switcher"

export default async function DashboardLayout({
  children: Silian_children,
}: {
  children: Silian_React.ReactNode
}) {
  const Silian_session = await Silian_auth()
  let Silian_isAdmin = false
  if (Silian_session?.user?.id) {
    try {
      const Silian_ctx = await Silian_getCurrentUserAuthContext(Silian_session.user.id)
      Silian_isAdmin = Silian_ctx.role === "ADMIN"
    } catch (Silian_err) {
      console.error("[layout] Failed to resolve auth context:", Silian_err)
      Silian_isAdmin = false
    }
  }

  const Silian_t = await Silian_getTranslations("Nav")

  const Silian_navLinks = [
    { href: "/articles", label: Silian_t("articles") },
    { href: "/draft", label: Silian_t("drafts") },
    ...(Silian_isAdmin ? [{ href: "/review", label: Silian_t("reviewHub") }] : []),
    { href: "/features", label: Silian_t("features") },
  ]

  return (
    <div
      className="
        relative flex min-h-screen w-screen flex-col font-sans text-tech-main
        selection:bg-tech-main/20 selection:text-tech-main-dark
      ">
      <nav
        className="
          sticky top-0 z-50 w-full border-b border-tech-main/40 bg-white/60
          backdrop-blur-sm
        ">
        <div className="absolute top-0 left-0 h-px w-full bg-tech-main/20" />
        <div
          className="
            mx-auto max-w-450 px-4
            sm:px-6
            lg:px-8
          ">
          <div
            className="
              flex h-16 items-center justify-between
              md:h-20
            ">
            <div
              className="
                flex space-x-4
                md:space-x-8
              ">
              <Silian_Logo size="md" />
              <Silian_DesktopNav navLinks={Silian_navLinks} />
            </div>

            <div className="flex items-center gap-4">
              <Silian_SearchCommand />
              <Silian_MobileNav navLinks={Silian_navLinks} />
              <Silian_LanguageSwitcher className="hidden sm:flex" />
              <Silian_React.Suspense
                fallback={
                  <div
                    className="
                      size-8 animate-pulse rounded-none border
                      border-tech-main/40 bg-tech-main/10
                      md:size-10
                    "
                  />
                }>
                <Silian_ProfileButton />
              </Silian_React.Suspense>
            </div>
          </div>
        </div>
      </nav>

      <main
        className="
          relative p-4
          sm:p-6
          lg:px-24 lg:py-8
        ">
        {Silian_children}
      </main>
    </div>
  )
}
