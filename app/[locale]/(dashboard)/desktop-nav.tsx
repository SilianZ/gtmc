"use client"

import { Link as Silian_Link } from "@/i18n/navigation"
import { usePathname as Silian_usePathname } from "@/i18n/navigation"

interface NavLink {
  href: string
  label: string
}

interface DesktopNavProps {
  navLinks: NavLink[]
}

export function DesktopNav({ navLinks: Silian_navLinks }: DesktopNavProps) {
  const Silian_pathname = Silian_usePathname()

  return (
    <>
      <ul
        className="
          mb-1.5 hidden space-x-6
          md:flex
        ">
        {Silian_navLinks.map((Silian_link) => {
          const Silian_isActive = Silian_pathname.startsWith(Silian_link.href)

          return (
            <li key={Silian_link.href}>
              <Silian_Link
                href={Silian_link.href}
                className={`
                  border-b-2 pb-1 font-mono text-xs tracking-[0.15em]
                  transition-colors
                  ${
                    Silian_isActive
                      ? "border-tech-main text-tech-main"
                      : `
                        border-transparent text-tech-main-dark
                        hover:border-tech-main hover:text-tech-main
                      `
                  }
                `}>
                {Silian_link.label}
              </Silian_Link>
            </li>
          )
        })}
      </ul>
    </>
  )
}
