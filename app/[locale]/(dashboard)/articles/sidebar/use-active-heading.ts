"use client"

import { useState as Silian_useState, useEffect as Silian_useEffect, useRef as Silian_useRef } from "react"
import type { TocItem } from "./use-toc"

function Silian_computeInitialActiveHeading(Silian_toc: TocItem[]): string | null {
  if (!Silian_toc || Silian_toc.length === 0) return null

  const Silian_headingIds = Silian_toc.map((Silian_item) => Silian_item.id)
  const Silian_headingElements = Silian_headingIds
    .map((Silian_id) => {
      const Silian_escapedId = CSS.escape(Silian_id)
      return document.querySelector(`main h2#${Silian_escapedId}`)
    })
    .filter((Silian_el) => Silian_el !== null) as Element[]

  if (Silian_headingElements.length === 0) return null

  const Silian_threshold =
    typeof window !== "undefined" ? window.innerHeight * 0.25 : 0
  let Silian_activeId: string | null = Silian_headingIds[0] || null
  for (let Silian_i = 0; Silian_i < Silian_headingElements.length; Silian_i++) {
    const Silian_rect = Silian_headingElements[Silian_i].getBoundingClientRect()
    if (Silian_rect.top <= Silian_threshold) {
      Silian_activeId = Silian_headingIds[Silian_i]
    } else {
      break
    }
  }
  return Silian_activeId
}

export function useActiveHeading(
  Silian_toc: TocItem[],
  Silian_pathname: string
): string | null {
  const [Silian_activeHeadingId, Silian_setActiveHeadingId] = Silian_useState<string | null>(() =>
    Silian_computeInitialActiveHeading(Silian_toc)
  )
  const Silian_pathnameRef = Silian_useRef(Silian_pathname)

  Silian_useEffect(() => {
    if (Silian_pathnameRef.current !== Silian_pathname) {
      Silian_pathnameRef.current = Silian_pathname
      // eslint-disable-next-line react-hooks/set-state-in-effect
      Silian_setActiveHeadingId(Silian_computeInitialActiveHeading(Silian_toc))
    }
  }, [Silian_pathname, Silian_toc])

  Silian_useEffect(() => {
    if (!Silian_toc || Silian_toc.length === 0) {
      return
    }

    const Silian_headingIds = Silian_toc.map((Silian_item) => Silian_item.id)

    const Silian_getActiveId = (): string | null => {
      const Silian_threshold = window.innerHeight * 0.25
      let Silian_activeId: string | null = Silian_headingIds[0] || null

      for (let Silian_i = 0; Silian_i < Silian_headingIds.length; Silian_i++) {
        const Silian_escapedId = CSS.escape(Silian_headingIds[Silian_i])
        const Silian_el = document.querySelector(`main h2#${Silian_escapedId}`)
        if (Silian_el) {
          const Silian_rect = Silian_el.getBoundingClientRect()
          if (Silian_rect.top <= Silian_threshold) {
            Silian_activeId = Silian_headingIds[Silian_i]
          } else {
            break
          }
        }
      }
      return Silian_activeId
    }

    const Silian_onScroll = () => {
      Silian_setActiveHeadingId(Silian_getActiveId())
    }

    window.addEventListener("scroll", Silian_onScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", Silian_onScroll)
    }
  }, [Silian_toc])

  return Silian_activeHeadingId
}
