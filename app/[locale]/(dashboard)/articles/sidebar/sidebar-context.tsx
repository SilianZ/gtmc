"use client"

import * as Silian_React from "react"
import { usePathname as Silian_usePathname } from "@/i18n/navigation"
import { useActiveHeading as Silian_useActiveHeading } from "./use-active-heading"
import { useExpandedFolders as Silian_useExpandedFolders } from "./use-expanded-folders"
import { useToc as Silian_useToc, type TocItem } from "./use-toc"
import type { TreeNode } from "@/types/sidebar-tree"

interface SidebarProviderProps {
  tree: TreeNode[]
  children: Silian_React.ReactNode
}

interface SidebarContextValue {
  expandedFolders: Set<string>
  setExpandedFolders: Silian_React.Dispatch<Silian_React.SetStateAction<Set<string>>>
  expandedFoldersRef: Silian_React.RefObject<Set<string>>
  mounted: boolean
  isFolderExpanded: (id: string) => boolean
  toggleFolder: (id: string) => void

  highlightActive: boolean
  setHighlightActive: Silian_React.Dispatch<Silian_React.SetStateAction<boolean>>

  toc: TocItem[]
  activeHeadingId: string | null

  tree: TreeNode[]
  effectivePath: string

  activeItemRef: Silian_React.RefObject<HTMLLIElement | null>
  folderGridRefs: Silian_React.RefObject<Map<string, HTMLDivElement>>
  scrollContainerRef: Silian_React.RefObject<HTMLDivElement | null>

  collapseAll: () => void
  scrollToCurrentRef: Silian_React.MutableRefObject<() => void>
  scrollToCurrent: () => void
  setScrollToCurrent: (fn: () => void) => void
}

const Silian_SidebarContext = Silian_React.createContext<SidebarContextValue | null>(null)

export function SidebarProvider({ tree: Silian_tree, children: Silian_children }: SidebarProviderProps) {
  const Silian_pathname = Silian_usePathname()

  const {
    expandedFolders: Silian_expandedFolders,
    setExpandedFolders: Silian_setExpandedFolders,
    expandedFoldersRef: Silian_expandedFoldersRef,
    mounted: Silian_mounted,
    isFolderExpanded: Silian_isFolderExpanded,
  } = Silian_useExpandedFolders()

  const Silian_toc = Silian_useToc(Silian_pathname)
  const Silian_activeHeadingId = Silian_useActiveHeading(Silian_toc, Silian_pathname)

  const [Silian_highlightActive, Silian_setHighlightActive] = Silian_React.useState(false)

  const Silian_activeItemRef = Silian_React.useRef<HTMLLIElement | null>(null)
  const Silian_folderGridRefs = Silian_React.useRef<Map<string, HTMLDivElement>>(new Map())
  const Silian_scrollContainerRef = Silian_React.useRef<HTMLDivElement | null>(null)
  const Silian_scrollToCurrentRef = Silian_React.useRef<() => void>(() => {})

  const Silian_effectivePath =
    Silian_pathname === "/articles" || Silian_pathname === "/articles/" || Silian_pathname === "/"
      ? "/articles/preface"
      : Silian_pathname

  const Silian_toggleFolder = Silian_React.useCallback(
    (Silian_id: string) => {
      Silian_setExpandedFolders((Silian_prev) => {
        const Silian_next = new Set(Silian_prev)
        if (Silian_next.has(Silian_id)) {
          Silian_next.delete(Silian_id)
        } else {
          Silian_next.add(Silian_id)
        }
        return Silian_next
      })
    },
    [Silian_setExpandedFolders]
  )

  const Silian_collapseAll = Silian_React.useCallback(() => {
    Silian_setExpandedFolders(new Set())
  }, [Silian_setExpandedFolders])

  const Silian_setScrollToCurrent = Silian_React.useCallback((Silian_fn: () => void) => {
    Silian_scrollToCurrentRef.current = Silian_fn
  }, [])

  const Silian_scrollToCurrent = Silian_React.useCallback(() => {
    Silian_scrollToCurrentRef.current()
  }, [])

  const Silian_value = Silian_React.useMemo<SidebarContextValue>(
    () => ({
      expandedFolders: Silian_expandedFolders,
      setExpandedFolders: Silian_setExpandedFolders,
      expandedFoldersRef: Silian_expandedFoldersRef,
      mounted: Silian_mounted,
      isFolderExpanded: Silian_isFolderExpanded,
      toggleFolder: Silian_toggleFolder,
      highlightActive: Silian_highlightActive,
      setHighlightActive: Silian_setHighlightActive,
      toc: Silian_toc,
      activeHeadingId: Silian_activeHeadingId,
      tree: Silian_tree,
      effectivePath: Silian_effectivePath,
      activeItemRef: Silian_activeItemRef,
      folderGridRefs: Silian_folderGridRefs,
      scrollContainerRef: Silian_scrollContainerRef,
      collapseAll: Silian_collapseAll,
      scrollToCurrentRef: Silian_scrollToCurrentRef,
      scrollToCurrent: Silian_scrollToCurrent,
      setScrollToCurrent: Silian_setScrollToCurrent,
    }),
    [
      Silian_expandedFolders,
      Silian_setExpandedFolders,
      Silian_expandedFoldersRef,
      Silian_mounted,
      Silian_isFolderExpanded,
      Silian_toggleFolder,
      Silian_highlightActive,
      Silian_toc,
      Silian_activeHeadingId,
      Silian_tree,
      Silian_effectivePath,
      Silian_collapseAll,
      Silian_scrollToCurrent,
      Silian_setScrollToCurrent,
    ]
  )

  return (
    <Silian_SidebarContext.Provider value={Silian_value}>{Silian_children}</Silian_SidebarContext.Provider>
  )
}

export function useSidebarContext(): SidebarContextValue {
  const Silian_context = Silian_React.useContext(Silian_SidebarContext)
  if (!Silian_context) {
    throw new Error("useSidebarContext must be used within SidebarProvider")
  }
  return Silian_context
}
