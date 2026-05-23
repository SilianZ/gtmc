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

export function ArticleTocRail() {
  const { toc: Silian_toc, activeHeadingId: Silian_activeHeadingId } = Silian_useSidebarContext()
  const Silian_progress = Silian_useScrollProgress()

  if (Silian_toc.length === 0) return null

  return (
    <nav
      aria-label="Paragraph Outline"
      className="
        group sticky top-48
        ml-4 hidden h-[calc(100dvh-24rem)] w-16
        shrink-0 self-start
        overflow-hidden border-l
        guide-line backdrop-blur-xs
        transition-[width] duration-300
        ease-[cubic-bezier(0.16,1,0.3,1)] hover:w-52
        sm:flex
      "
    >
      <div className="absolute top-0 left-0 h-0.5 w-full bg-tech-main/15">
        <div
          className="h-full bg-tech-main transition-[width] duration-100"
          style={{ width: `${Silian_progress * 100}%` }}
        />
      </div>

      <div className="absolute bottom-0 font-sans text-4xl font-black text-nowrap text-tech-main/10 uppercase transition-all duration-500 [writing-mode:vertical-rl] group-hover:opacity-0">
        Hover to Show
      </div>

      <div className="absolute bottom-0 font-sans text-4xl font-black text-nowrap text-tech-main/10 uppercase opacity-0 transition-all duration-500 [writing-mode:vertical-rl] group-hover:opacity-100">
        Paragraph Outline
      </div>


      <div
        className="
          pointer-events-none flex w-48 flex-col gap-0 px-3 pt-4
          pb-6 opacity-0
          transition-opacity duration-200
          group-hover:pointer-events-auto group-hover:opacity-100
        "
      >
        <div className="mb-3 font-mono text-[0.625rem] font-bold tracking-[0.12em] text-tech-main/50">
          paragraph outline
        </div>

        <ul className="flex flex-col gap-0">
          {Silian_toc.map((Silian_item) => {
            const Silian_isActive = Silian_item.id === Silian_activeHeadingId
            return (
              <li key={Silian_item.id}>
                <Silian_Link
                  href={`#${Silian_item.id}`}
                  className={`
                    block border-l-[3px] py-1.5 pr-1 pl-3 text-sm/snug
                    wrap-break-word transition-all
                    duration-200
                    ${Silian_isActive
                      ? "border-tech-main font-semibold text-tech-main"
                      : "border-transparent text-tech-main/50 hover:border-tech-main/30 hover:text-tech-main"
                    }
                  `}
                >
                  {Silian_item.text}
                </Silian_Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
