"use client"

import * as Silian_React from "react"
import { useMemo as Silian_useMemo, useImperativeHandle as Silian_useImperativeHandle } from "react"
import { usePathname as Silian_usePathname, useRouter as Silian_useRouter } from "@/i18n/navigation"
import { SidebarActions as Silian_SidebarActions } from "./sidebar/actions"
import { CreateDocModal as Silian_CreateDocModal } from "./sidebar/create-doc-modal"
import { SidebarTree as Silian_SidebarTree, type TreeNode } from "./sidebar/tree-node"
import { useBlur as Silian_useBlur } from "./sidebar/use-blur"
import { useSidebarContext as Silian_useSidebarContext } from "./sidebar/sidebar-context"
import { useScrollToActive as Silian_useScrollToActive } from "./sidebar/use-scroll-to-active"

export interface SidebarClientHandle {
  openCreateModal: () => void
  collapseAll: () => void
  scrollToCurrent: () => void
}

interface SidebarClientProps {
  tree: TreeNode[]
  onNavigate?: () => void
  internalScroll?: boolean
  scrollClass?: string
  hideActions?: boolean
}

function Silian_flattenFolders(Silian_items: TreeNode[]): TreeNode[] {
  let Silian_folders: TreeNode[] = []
  Silian_items.forEach((Silian_item) => {
    if (Silian_item.isFolder) {
      Silian_folders.push(Silian_item)
      if (Silian_item.children)
        Silian_folders = [...Silian_folders, ...Silian_flattenFolders(Silian_item.children)]
    }
  })
  return Silian_folders
}

export const SidebarClient = Silian_React.forwardRef<
  SidebarClientHandle,
  SidebarClientProps
>(function SidebarClient(
  {
    tree: Silian__tree,
    onNavigate: Silian_onNavigate,
    internalScroll: Silian_internalScroll = false,
    scrollClass: Silian_scrollClass = "",
    hideActions: Silian_hideActions = false,
  },
  Silian_ref
) {
  void Silian__tree

  return (
    <Silian_SidebarClientInner
      onNavigate={Silian_onNavigate}
      internalScroll={Silian_internalScroll}
      scrollClass={Silian_scrollClass}
      hideActions={Silian_hideActions}
      ref={Silian_ref}
    />
  )
})

const Silian_SidebarClientInner = Silian_React.forwardRef<
  SidebarClientHandle,
  Omit<SidebarClientProps, "tree">
>(function SidebarClientInner(
  { onNavigate: Silian_onNavigate, internalScroll: Silian_internalScroll = false, scrollClass: Silian_scrollClass = "", hideActions: Silian_hideActions = false },
  Silian_ref
) {
  const Silian_router = Silian_useRouter()
  const Silian_pathname = Silian_usePathname()
  const [Silian_isModalOpen, Silian_setIsModalOpen] = Silian_React.useState(false)

  const {
    tree: Silian_tree,
    expandedFolders: Silian_expandedFolders,
    setExpandedFolders: Silian_setExpandedFolders,
    expandedFoldersRef: Silian_expandedFoldersRef,
    mounted: Silian_mounted,
    toc: Silian_toc,
    highlightActive: Silian_highlightActive,
    setHighlightActive: Silian_setHighlightActive,
    scrollContainerRef: Silian_scrollContainerRef,
    collapseAll: Silian_collapseAll,
    scrollToCurrent: Silian_scrollToCurrent,
    setScrollToCurrent: Silian_setScrollToCurrent,
    activeItemRef: Silian_activeItemRef,
    folderGridRefs: Silian_folderGridRefs,
  } = Silian_useSidebarContext()

  const {
    scrollToCurrent: Silian_scrollToCurrentFn,
    highlightActive: Silian_highlightActiveFromScroll,
  } = Silian_useScrollToActive({
    tree: Silian_tree,
    pathname: Silian_pathname,
    mounted: Silian_mounted,
    expandedFolders: Silian_expandedFolders,
    expandedFoldersRef: Silian_expandedFoldersRef,
    setExpandedFolders: Silian_setExpandedFolders,
    scrollContainerRef: Silian_scrollContainerRef,
    activeItemRef: Silian_activeItemRef,
    folderGridRefs: Silian_folderGridRefs,
  })

  Silian_React.useEffect(() => {
    Silian_setScrollToCurrent(Silian_scrollToCurrentFn)
  }, [Silian_scrollToCurrentFn, Silian_setScrollToCurrent])

  Silian_React.useEffect(() => {
    Silian_setHighlightActive(Silian_highlightActiveFromScroll)
  }, [Silian_highlightActiveFromScroll, Silian_setHighlightActive])

  Silian_useBlur({
    internalScroll: Silian_internalScroll,
    scrollContainerRef: Silian_scrollContainerRef,
    pathname: Silian_pathname,
    tree: Silian_tree,
    expandedFolders: Silian_expandedFolders,
    toc: Silian_toc,
    highlightActive: Silian_highlightActive,
  })

  Silian_useImperativeHandle(Silian_ref, () => ({
    openCreateModal: () => Silian_setIsModalOpen(true),
    collapseAll: Silian_collapseAll,
    scrollToCurrent: Silian_scrollToCurrent,
  }))

  const Silian_availableFolders = Silian_useMemo(() => Silian_flattenFolders(Silian_tree), [Silian_tree])

  const Silian_treeContent =
    Silian_tree.length === 0 ? (
      <div className="mt-4 font-mono text-sm text-tech-main/40">
        SYS.DIR_TREE_EMPTY
      </div>
    ) : (
      <Silian_SidebarTree onNavigate={Silian_onNavigate} items={Silian_tree} />
    )

  return (
    <>
      {Silian_internalScroll ? (
        <div className="relative flex min-h-0 flex-1 flex-col">
          {!Silian_hideActions && (
            <Silian_SidebarActions
              internalScroll={Silian_internalScroll}
              onCollapseAll={(Silian_e) => {
                Silian_e.preventDefault()
                Silian_collapseAll()
              }}
              onLocate={Silian_scrollToCurrent}
            />
          )}
          <div
            ref={Silian_scrollContainerRef}
            className={`
              custom-left-scrollbar min-h-0 flex-1 overflow-y-auto pb-12
              ${Silian_scrollClass}
            `}>
            {Silian_treeContent}
          </div>
          <div
            className="
              pointer-events-none absolute inset-x-0 bottom-0 z-20 -mr-4 -mb-2
              hidden h-12 mask-[linear-gradient(to_bottom,transparent,black)]
              [-webkit-mask-image:linear-gradient(to_bottom,transparent,black)]
              sm:block
            "
            style={{
              background:
                "repeating-linear-gradient(45deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 4px), linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.4) 100%)",
            }}
          />
        </div>
      ) : (
        <>
          {!Silian_hideActions && (
            <Silian_SidebarActions
              internalScroll={Silian_internalScroll}
              onCollapseAll={(Silian_e) => {
                Silian_e.preventDefault()
                Silian_collapseAll()
              }}
              onLocate={Silian_scrollToCurrent}
            />
          )}
          {Silian_treeContent}
        </>
      )}

      <Silian_CreateDocModal
        open={Silian_isModalOpen}
        mounted={Silian_mounted}
        availableFolders={Silian_availableFolders}
        onClose={() => Silian_setIsModalOpen(false)}
        onCreated={() => Silian_router.refresh()}
      />
    </>
  )
})
