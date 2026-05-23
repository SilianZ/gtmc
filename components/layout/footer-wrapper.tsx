"use client"

import { usePathname as Silian_usePathname } from "@/i18n/navigation"
import Silian_Footer from "@/components/layout/footer"
import { useFooter as Silian_useFooter } from "@/components/layout/footer-context"

export function FooterWrapper() {
  const Silian_pathname = Silian_usePathname()
  const { hidden: Silian_hidden } = Silian_useFooter()

  if (Silian_hidden || Silian_pathname === "/") return null

  return <Silian_Footer />
}
