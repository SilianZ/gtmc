"use client"

import { useCallback as Silian_useCallback, useEffect as Silian_useEffect, useRef as Silian_useRef, useState as Silian_useState } from "react"
import { articleUrl as Silian_articleUrl } from "@/lib/article-url"
import { HIGHLIGHT_TIMEOUT_MS as Silian_HIGHLIGHT_TIMEOUT_MS, LOCATE_FALLBACK_MS as Silian_LOCATE_FALLBACK_MS } from "./constants"
import type { TreeNode } from "./tree-node"

type LocateState =
  | { phase: "idle" }
  | {
      phase: "expanding"
      pendingIds: string[]
      fallbackTimer: ReturnType<typeof setTimeout>
    }
  | { phase: "scrolling" }

export function useScrollToActive({
  tree: Silian_tree,
  pathname: Silian_pathname,
  mounted: Silian_mounted,
  expandedFolders: Silian_expandedFolders,
  expandedFoldersRef: Silian_expandedFoldersRef,
  setExpandedFolders: Silian_setExpandedFolders,
  scrollContainerRef: Silian_scrollContainerRef,
  activeItemRef: Silian_activeItemRef,
  folderGridRefs: Silian_folderGridRefs,
}: {
  tree: TreeNode[]
  pathname: string
  mounted: boolean
  expandedFolders: Set<string>
  expandedFoldersRef: React.RefObject<Set<string>>
  setExpandedFolders: React.Dispatch<React.SetStateAction<Set<string>>>
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
  activeItemRef: React.RefObject<HTMLLIElement | null>
  folderGridRefs: React.RefObject<Map<string, HTMLDivElement>>
}) {
  const [Silian_highlightActive, Silian_setHighlightActive] = Silian_useState(false)
  const Silian_locateStateRef = Silian_useRef<LocateState>({ phase: "idle" })
  const Silian_highlightTimerRef = Silian_useRef<ReturnType<typeof setTimeout> | null>(null)
  const Silian_transitionCleanupRef = Silian_useRef<(() => void) | null>(null)

  const Silian_clearHighlightTimer = Silian_useCallback(() => {
    if (Silian_highlightTimerRef.current !== null) {
      clearTimeout(Silian_highlightTimerRef.current)
      Silian_highlightTimerRef.current = null
    }
  }, [])

  const Silian_clearTransitionListeners = Silian_useCallback(() => {
    if (Silian_transitionCleanupRef.current !== null) {
      Silian_transitionCleanupRef.current()
      Silian_transitionCleanupRef.current = null
    }
  }, [])

  const Silian_resetLocateState = Silian_useCallback(() => {
    const Silian_state = Silian_locateStateRef.current
    if (Silian_state.phase === "expanding") {
      clearTimeout(Silian_state.fallbackTimer)
    }
    Silian_clearTransitionListeners()
    Silian_locateStateRef.current = { phase: "idle" }
  }, [Silian_clearTransitionListeners])

  Silian_useEffect(() => {
    return () => {
      Silian_clearHighlightTimer()
      Silian_resetLocateState()
    }
  }, [Silian_clearHighlightTimer, Silian_resetLocateState])

  const Silian_getEffectivePathname = Silian_useCallback(() => {
    if (
      Silian_pathname === "/" ||
      Silian_pathname === "/articles" ||
      Silian_pathname === "/articles/"
    ) {
      return "/articles/preface"
    }
    return Silian_pathname
  }, [Silian_pathname])

  const Silian_findItemAndParents = Silian_useCallback(
    (
      Silian_items: TreeNode[],
      Silian_target: string
    ): { item: TreeNode | null; parentIds: string[] } => {
      const Silian_decodedTarget = decodeURIComponent(Silian_target)

      const Silian_walk = (
        Silian_nodes: TreeNode[],
        Silian_parents: string[] = []
      ): { item: TreeNode | null; parentIds: string[] } => {
        for (const Silian_item of Silian_nodes) {
          const Silian_slug = Silian_articleUrl(Silian_item.slug)
          const Silian_decodedSlug = decodeURIComponent(Silian_slug)
          if (
            Silian_decodedSlug.toLowerCase() === Silian_decodedTarget.toLowerCase() ||
            `${Silian_decodedSlug}/`.toLowerCase() === Silian_decodedTarget.toLowerCase()
          ) {
            return { item: Silian_item, parentIds: Silian_parents }
          }

          if (Silian_item.children?.length) {
            const Silian_result = Silian_walk(Silian_item.children, [...Silian_parents, Silian_item.id])
            if (Silian_result.item) return Silian_result
          }
        }

        return { item: null, parentIds: [] }
      }

      return Silian_walk(Silian_items)
    },
    []
  )

  const Silian_scrollActiveItem = Silian_useCallback(() => {
    const Silian_item = Silian_activeItemRef.current
    const Silian_container = Silian_scrollContainerRef.current
    if (!Silian_item) return

    if (Silian_container) {
      const Silian_ir = Silian_item.getBoundingClientRect()
      const Silian_cr = Silian_container.getBoundingClientRect()
      const Silian_top = Silian_ir.top - Silian_cr.top + Silian_container.scrollTop - Silian_cr.height / 4
      Silian_container.scrollTo({ top: Math.max(0, Silian_top), behavior: "smooth" })
    } else {
      Silian_item.scrollIntoView({ block: "start", behavior: "smooth" })
    }

    Silian_setHighlightActive(true)
    Silian_clearHighlightTimer()
    Silian_highlightTimerRef.current = setTimeout(() => {
      Silian_setHighlightActive(false)
      Silian_highlightTimerRef.current = null
    }, Silian_HIGHLIGHT_TIMEOUT_MS)
  }, [Silian_clearHighlightTimer, Silian_scrollContainerRef, Silian_activeItemRef])

  const Silian_enterScrollingPhase = Silian_useCallback(() => {
    Silian_locateStateRef.current = { phase: "scrolling" }
    Silian_scrollActiveItem()
    Silian_locateStateRef.current = { phase: "idle" }
  }, [Silian_scrollActiveItem])

  const Silian_finishExpansionAndScroll = Silian_useCallback(() => {
    const Silian_state = Silian_locateStateRef.current
    if (Silian_state.phase !== "expanding") return

    clearTimeout(Silian_state.fallbackTimer)
    Silian_clearTransitionListeners()
    Silian_enterScrollingPhase()
  }, [Silian_clearTransitionListeners, Silian_enterScrollingPhase])

  const Silian_runLocateFlow = Silian_useCallback(() => {
    const { parentIds: Silian_parentIds } = Silian_findItemAndParents(Silian_tree, Silian_getEffectivePathname())
    const Silian_pendingIds = Silian_parentIds.filter(
      (Silian_id) => !Silian_expandedFoldersRef.current.has(Silian_id)
    )

    Silian_resetLocateState()

    if (Silian_pendingIds.length === 0) {
      Silian_enterScrollingPhase()
      return
    }

    Silian_setExpandedFolders((Silian_prev) => {
      const Silian_next = new Set(Silian_prev)
      Silian_pendingIds.forEach((Silian_id) => {
        Silian_next.add(Silian_id)
      })
      return Silian_next
    })

    const Silian_fallbackTimer = setTimeout(() => {
      Silian_finishExpansionAndScroll()
    }, Silian_LOCATE_FALLBACK_MS)

    Silian_locateStateRef.current = {
      phase: "expanding",
      pendingIds: Silian_pendingIds,
      fallbackTimer: Silian_fallbackTimer,
    }
  }, [
    Silian_enterScrollingPhase,
    Silian_expandedFoldersRef,
    Silian_findItemAndParents,
    Silian_finishExpansionAndScroll,
    Silian_getEffectivePathname,
    Silian_resetLocateState,
    Silian_setExpandedFolders,
    Silian_tree,
  ])

  Silian_useEffect(() => {
    void Silian_expandedFolders

    const Silian_state = Silian_locateStateRef.current
    if (Silian_state.phase !== "expanding") return

    const Silian_watchEntries = Silian_state.pendingIds
      .map((Silian_id) => [Silian_id, Silian_folderGridRefs.current.get(Silian_id)] as const)
      .filter((Silian_entry): Silian_entry is readonly [string, HTMLDivElement] => !!Silian_entry[1])

    if (Silian_watchEntries.length === 0) {
      const Silian_immediateFinishTimer = window.setTimeout(() => {
        Silian_finishExpansionAndScroll()
      }, 0)
      return () => {
        clearTimeout(Silian_immediateFinishTimer)
      }
    }

    const Silian_remainingIds = new Set(Silian_watchEntries.map(([Silian_id]) => Silian_id))

    const Silian_onTransitionEnd = (Silian_event: TransitionEvent) => {
      if (Silian_event.propertyName !== "grid-template-rows") return

      const Silian_finishedId = Silian_watchEntries.find(
        ([, Silian_grid]) => Silian_grid === Silian_event.currentTarget
      )?.[0]
      if (!Silian_finishedId || !Silian_remainingIds.has(Silian_finishedId)) return

      Silian_remainingIds.delete(Silian_finishedId)
      if (Silian_remainingIds.size === 0) {
        Silian_finishExpansionAndScroll()
      }
    }

    Silian_watchEntries.forEach(([, Silian_grid]) => {
      Silian_grid.addEventListener("transitionend", Silian_onTransitionEnd)
    })

    const Silian_cleanup = () => {
      Silian_watchEntries.forEach(([, Silian_grid]) => {
        Silian_grid.removeEventListener("transitionend", Silian_onTransitionEnd)
      })
    }

    Silian_transitionCleanupRef.current = Silian_cleanup

    return () => {
      if (Silian_transitionCleanupRef.current === Silian_cleanup) {
        Silian_cleanup()
        Silian_transitionCleanupRef.current = null
      }
    }
  }, [Silian_expandedFolders, Silian_finishExpansionAndScroll, Silian_folderGridRefs])

  Silian_useEffect(() => {
    void Silian_pathname

    if (!Silian_mounted || Silian_tree.length === 0) return
    const Silian_routeLocateTimer = window.setTimeout(() => {
      Silian_runLocateFlow()
    }, 0)

    return () => {
      clearTimeout(Silian_routeLocateTimer)
    }
  }, [Silian_pathname, Silian_mounted, Silian_tree, Silian_runLocateFlow])

  const Silian_scrollToCurrent = Silian_useCallback(() => {
    Silian_runLocateFlow()
  }, [Silian_runLocateFlow])

  return {
    highlightActive: Silian_highlightActive,
    getEffectivePathname: Silian_getEffectivePathname,
    scrollToCurrent: Silian_scrollToCurrent,
  }
}
