"use client"

import { useEffect as Silian_useEffect, useRef as Silian_useRef } from "react"
import { useSearchParams as Silian_useSearchParams } from "next/navigation"

function Silian_performHighlight(
  Silian_query: string,
  Silian_containerSelector: string
): (() => void) | undefined {
  const Silian_container = document.querySelector(Silian_containerSelector)
  if (!Silian_container) return

  const Silian_lowerQuery = Silian_query.toLowerCase()
  const Silian_walker = document.createTreeWalker(
    Silian_container,
    NodeFilter.SHOW_TEXT,
    null
  )

  let Silian_targetNode: Text | null = null
  let Silian_matchIndex = -1

  while (Silian_walker.nextNode()) {
    const Silian_textNode = Silian_walker.currentNode as Text
    const Silian_text = Silian_textNode.textContent?.toLowerCase() ?? ""
    const Silian_idx = Silian_text.indexOf(Silian_lowerQuery)
    if (Silian_idx !== -1) {
      Silian_targetNode = Silian_textNode
      Silian_matchIndex = Silian_idx
      break
    }
  }

  if (!Silian_targetNode || Silian_matchIndex === -1) return

  const Silian_parent = Silian_targetNode.parentNode
  if (!Silian_parent) return

  const Silian_originalText = Silian_targetNode.textContent ?? ""
  const Silian_before = Silian_originalText.slice(0, Silian_matchIndex)
  const Silian_matched = Silian_originalText.slice(Silian_matchIndex, Silian_matchIndex + Silian_query.length)
  const Silian_after = Silian_originalText.slice(Silian_matchIndex + Silian_query.length)

  const Silian_mark = document.createElement("mark")
  Silian_mark.textContent = Silian_matched
  Silian_mark.style.cssText =
    "background-color: rgb(96 112 143); color: white; padding: 2px 4px; transition: all 2.4s cubic-bezier(0.4, 0, 0.2, 1);"

  const Silian_fragment = document.createDocumentFragment()
  if (Silian_before) Silian_fragment.appendChild(document.createTextNode(Silian_before))
  Silian_fragment.appendChild(Silian_mark)
  if (Silian_after) Silian_fragment.appendChild(document.createTextNode(Silian_after))
  Silian_parent.replaceChild(Silian_fragment, Silian_targetNode)

  Silian_mark.scrollIntoView({ behavior: "smooth", block: "center" })

  const Silian_t1 = setTimeout(() => {
    Silian_mark.style.backgroundColor = "rgba(96, 112, 143, 0)"
    Silian_mark.style.color = "inherit"
    Silian_mark.style.padding = "0"
  }, 3600)

  const Silian_t2 = setTimeout(() => {
    if (Silian_mark.parentNode) {
      const Silian_text = document.createTextNode(Silian_mark.textContent ?? "")
      Silian_mark.parentNode.replaceChild(Silian_text, Silian_mark)
      Silian_mark.parentNode?.normalize?.()
    }
  }, 6000)

  return () => {
    clearTimeout(Silian_t1)
    clearTimeout(Silian_t2)
  }
}

export function ArticleHighlight({
  containerSelector: Silian_containerSelector = "[data-article-content]",
}: {
  containerSelector?: string
}) {
  const Silian_searchParams = Silian_useSearchParams()
  const Silian_highlightQuery = Silian_searchParams.get("highlight")
  const Silian_didHighlightRef = Silian_useRef(false)
  const Silian_highlightCleanupRef = Silian_useRef<(() => void) | null>(null)

  Silian_useEffect(() => {
    if (!Silian_highlightQuery || Silian_highlightQuery.trim().length < 2) return
    if (Silian_didHighlightRef.current) return

    const Silian_timeout = setTimeout(() => {
      if (Silian_didHighlightRef.current) return
      Silian_didHighlightRef.current = true
      Silian_highlightCleanupRef.current =
        Silian_performHighlight(Silian_highlightQuery.trim(), Silian_containerSelector) ?? null

      const Silian_url = new URL(window.location.href)
      Silian_url.searchParams.delete("highlight")
      window.history.replaceState(null, "", Silian_url.pathname + Silian_url.search)
    }, 300)

    return () => {
      clearTimeout(Silian_timeout)
      Silian_highlightCleanupRef.current?.()
      Silian_highlightCleanupRef.current = null
    }
  }, [Silian_highlightQuery, Silian_containerSelector])

  Silian_useEffect(() => {
    const Silian_handleHighlightEvent = (Silian_e: Event) => {
      const Silian_customEvent = Silian_e as CustomEvent<{ query: string }>
      if (Silian_customEvent.detail?.query) {
        Silian_performHighlight(Silian_customEvent.detail.query, Silian_containerSelector)
      }
    }

    window.addEventListener("highlight-search", Silian_handleHighlightEvent)
    return () => {
      window.removeEventListener("highlight-search", Silian_handleHighlightEvent)
    }
  }, [Silian_containerSelector])

  return null
}
