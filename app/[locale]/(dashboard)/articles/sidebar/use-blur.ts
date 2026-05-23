"use client"

import { useCallback as Silian_useCallback, useEffect as Silian_useEffect, useLayoutEffect as Silian_useLayoutEffect, useRef as Silian_useRef } from "react"
import type { TocItem } from "./use-toc"
import type { TreeNode } from "./tree-node"
import { BLUR_ZONE_PX as Silian_BLUR_ZONE_PX, BLUR_MIN as Silian_BLUR_MIN, BLUR_RANGE as Silian_BLUR_RANGE, OPACITY_FADE as Silian_OPACITY_FADE } from "./constants"

export function useBlur({
  internalScroll: Silian_internalScroll,
  scrollContainerRef: Silian_scrollContainerRef,
  pathname: Silian_pathname,
  tree: Silian_tree,
  expandedFolders: Silian_expandedFolders,
  toc: Silian_toc,
  highlightActive: Silian_highlightActive,
}: {
  internalScroll: boolean
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
  pathname: string
  tree: TreeNode[]
  expandedFolders: Set<string>
  toc: TocItem[]
  highlightActive: boolean
}): { scheduleBottomRowBlurSync: () => void } {
  const Silian_blurFrameRef = Silian_useRef<number | null>(null)

  const Silian_syncBottomRowBlur = Silian_useCallback(() => {
    const Silian_container = Silian_scrollContainerRef.current
    if (!Silian_container) return

    const Silian_rows = Silian_container.querySelectorAll<HTMLElement>(
      'li[data-sidebar-row="1"]'
    )
    const Silian_blurZoneRect = Silian_container.getBoundingClientRect()
    const Silian_blurZoneHeight = Silian_BLUR_ZONE_PX
    const Silian_blurZoneTop = Silian_blurZoneRect.bottom - Silian_blurZoneHeight

    Silian_rows.forEach((Silian_row) => {
      const Silian_rowRect = Silian_row.getBoundingClientRect()
      const Silian_overlapTop = Math.max(Silian_rowRect.top, Silian_blurZoneTop)
      const Silian_overlapBottom = Math.min(Silian_rowRect.bottom, Silian_blurZoneRect.bottom)
      const Silian_overlapHeight = Silian_overlapBottom - Silian_overlapTop
      const Silian_distBottomLine = Silian_blurZoneRect.bottom - Silian_rowRect.top

      if (Silian_rowRect.y > Silian_blurZoneRect.bottom) {
        Silian_row.style.filter = "blur(3px)"
        Silian_row.style.opacity = "0.15"
        return
      }

      if (Silian_overlapHeight <= 0) {
        Silian_row.style.filter = ""
        Silian_row.style.opacity = ""
        return
      }

      const Silian_ratio = Math.max(
        0,
        Math.min(
          1,
          Silian_rowRect.top > Silian_blurZoneTop - Silian_blurZoneHeight * 0.8
            ? Silian_overlapHeight / Silian_blurZoneHeight
            : (0.5 - Silian_distBottomLine / Silian_rowRect.height) * 2
        )
      )
      const Silian_blur = Silian_BLUR_MIN + Silian_ratio * Silian_BLUR_RANGE
      const Silian_opacity = 1 - Silian_ratio * Silian_OPACITY_FADE
      Silian_row.style.filter = `blur(${Silian_blur.toFixed(3)}px)`
      Silian_row.style.opacity = `${Silian_opacity.toFixed(3)}`
    })
  }, [Silian_scrollContainerRef])

  const Silian_scheduleBottomRowBlurSync = Silian_useCallback(() => {
    if (Silian_blurFrameRef.current !== null) return
    Silian_blurFrameRef.current = window.requestAnimationFrame(() => {
      Silian_blurFrameRef.current = null
      Silian_syncBottomRowBlur()
    })
  }, [Silian_syncBottomRowBlur])

  const Silian_animLoopRef = Silian_useRef<number | null>(null)
  const Silian_animLoopEndRef = Silian_useRef<number>(0)

  const Silian_syncForDuration = Silian_useCallback(
    (Silian_ms: number) => {
      if (Silian_animLoopRef.current !== null) {
        window.cancelAnimationFrame(Silian_animLoopRef.current)
      }
      Silian_animLoopEndRef.current = performance.now() + Silian_ms
      const Silian_loop = () => {
        Silian_syncBottomRowBlur()
        if (performance.now() < Silian_animLoopEndRef.current) {
          Silian_animLoopRef.current = window.requestAnimationFrame(Silian_loop)
        } else {
          Silian_animLoopRef.current = null
        }
      }
      Silian_animLoopRef.current = window.requestAnimationFrame(Silian_loop)
    },
    [Silian_syncBottomRowBlur]
  )

  Silian_useLayoutEffect(() => {
    if (!Silian_internalScroll) return
    const Silian_container = Silian_scrollContainerRef.current
    if (!Silian_container) return

    const Silian_onScroll = () => Silian_scheduleBottomRowBlurSync()
    const Silian_onResize = () => Silian_scheduleBottomRowBlurSync()

    Silian_container.addEventListener("scroll", Silian_onScroll, { passive: true })
    window.addEventListener("resize", Silian_onResize)

    const Silian_resizeObserver = new ResizeObserver(() => {
      Silian_scheduleBottomRowBlurSync()
    })
    Silian_resizeObserver.observe(Silian_container)
    Silian_scheduleBottomRowBlurSync()

    return () => {
      Silian_container.removeEventListener("scroll", Silian_onScroll)
      window.removeEventListener("resize", Silian_onResize)
      Silian_resizeObserver.disconnect()

      if (Silian_blurFrameRef.current !== null) {
        window.cancelAnimationFrame(Silian_blurFrameRef.current)
        Silian_blurFrameRef.current = null
      }

      if (Silian_animLoopRef.current !== null) {
        window.cancelAnimationFrame(Silian_animLoopRef.current)
        Silian_animLoopRef.current = null
      }

      const Silian_rows = Silian_container.querySelectorAll<HTMLElement>(
        'li[data-sidebar-row="1"]'
      )
      Silian_rows.forEach((Silian_row) => {
        Silian_row.style.filter = ""
        Silian_row.style.opacity = ""
      })
    }
  }, [Silian_internalScroll, Silian_scheduleBottomRowBlurSync, Silian_scrollContainerRef])

  Silian_useEffect(() => {
    void Silian_pathname
    void Silian_tree
    void Silian_expandedFolders
    void Silian_toc
    void Silian_highlightActive

    if (!Silian_internalScroll) return
    Silian_syncForDuration(300)
  }, [
    Silian_internalScroll,
    Silian_pathname,
    Silian_tree,
    Silian_expandedFolders,
    Silian_toc,
    Silian_highlightActive,
    Silian_syncForDuration,
  ])

  return { scheduleBottomRowBlurSync: Silian_scheduleBottomRowBlurSync }
}
