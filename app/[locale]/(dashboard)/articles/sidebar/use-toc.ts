"use client"

import { useEffect as Silian_useEffect, useState as Silian_useState } from "react"

export interface TocItem {
  id: string
  text: string
}

function Silian_scanHeadings(): TocItem[] {
  if (typeof document === "undefined") return []
  const Silian_headings = document.querySelectorAll("main h2")
  if (Silian_headings.length === 0) return []

  const Silian_tocItems: TocItem[] = []
  Silian_headings.forEach((Silian_heading) => {
    if (Silian_heading.id && Silian_heading.textContent) {
      const Silian_clone = Silian_heading.cloneNode(true) as Element
      Silian_clone.querySelectorAll('[aria-hidden="true"]').forEach((Silian_el) => {
        Silian_el.remove()
      })
      const Silian_text = Silian_clone.textContent?.replace(/^#\s*/, "") ?? ""
      Silian_tocItems.push({ id: Silian_heading.id, text: Silian_text })
    }
  })
  return Silian_tocItems
}

function Silian_getInitialToc(): TocItem[] {
  return typeof document !== "undefined" ? Silian_scanHeadings() : []
}

export function useToc(Silian_pathname: string): TocItem[] {
  const [Silian_toc, Silian_setToc] = Silian_useState<TocItem[]>(Silian_getInitialToc)

  Silian_useEffect(() => {
    if (typeof document === "undefined") return

    void Silian_pathname

    const Silian_frame = requestAnimationFrame(() => {
      Silian_setToc(Silian_scanHeadings())
    })

    const Silian_observer = new MutationObserver(() => {
      Silian_setToc(Silian_scanHeadings())
    })

    const Silian_main = document.querySelector("main") || document.body
    Silian_observer.observe(Silian_main, { childList: true, subtree: true })

    const Silian_timeout = setTimeout(() => Silian_observer.disconnect(), 10000)

    return () => {
      Silian_observer.disconnect()
      clearTimeout(Silian_timeout)
      cancelAnimationFrame(Silian_frame)
    }
  }, [Silian_pathname])

  return Silian_toc
}
