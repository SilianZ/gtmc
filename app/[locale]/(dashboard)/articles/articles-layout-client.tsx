"use client"

import * as Silian_React from "react"
import { useState as Silian_useState, useRef as Silian_useRef, useEffect as Silian_useEffect } from "react"
import { usePathname as Silian_usePathname } from "@/i18n/navigation"
import { SidebarClient as Silian_SidebarClient, type SidebarClientHandle } from "./sidebar-client"
import { SidebarProvider as Silian_SidebarProvider } from "./sidebar/sidebar-context"
import { MobileTreeCard as Silian_MobileTreeCard } from "./mobile-tree-card"
import {
  ScanConfirmOverlay as Silian_ScanConfirmOverlay,
  SectionRail as Silian_SectionRail,
  SegmentedBar as Silian_SegmentedBar,
} from "../features/loading-shell-primitives"
import type { TreeNode } from "@/types/sidebar-tree"
import { useTranslations as Silian_useTranslations } from "next-intl"
import { ArticleTocRail as Silian_ArticleTocRail } from "@/components/articles/article-toc-rail"
import { MobileTocBar as Silian_MobileTocBar } from "@/components/articles/mobile-toc-bar"

interface ArticlesLayoutProps {
  children: Silian_React.ReactNode
  tree: TreeNode[]
}

interface SidebarTreeWrapperProps {
  sidebarRef: Silian_React.Ref<SidebarClientHandle>
  showPlaceholder: boolean
  onNavigate: () => void
  internalScroll?: boolean
  scrollClass?: string
  hideActions?: boolean
}

function Silian_TreeLoadingPlaceholder() {
  return (
    <div
      className="
        relative h-full animate-tree-drop-in overflow-hidden border guide-line
        bg-white/80 px-3 py-4
        motion-reduce:animate-none
        md:min-h-160 md:px-4 md:py-5
      "
      style={{
        animation: "tree-drop-in 1.05s cubic-bezier(0.16, 1, 0.3, 1) both",
      }}
      aria-hidden="true">
      <Silian_ScanConfirmOverlay className="opacity-40" />
      <Silian_SectionRail
        label="TREE_BOOTSTRAP"
        className="mb-3 text-[0.625rem] opacity-75"
      />

      <div className="space-y-6 pr-3">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="size-1 bg-tech-main/45" />
            <Silian_SegmentedBar opacity="high" className="h-4 w-4/5" />
          </div>

          <div className="nested-list">
            <div className="flex items-center gap-2">
              <span className="h-px w-2 bg-tech-main/40" />
              <Silian_SegmentedBar opacity="medium" className="h-3.5 w-3/4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="h-px w-2 bg-tech-main/40" />
              <Silian_SegmentedBar opacity="medium" className="h-3.5 w-2/3" />
            </div>

            <div className="ml-2 nested-list">
              <div className="flex items-center gap-2">
                <span className="size-1 rounded-full bg-tech-main/35" />
                <Silian_SegmentedBar opacity="low" className="h-3 w-3/5" />
              </div>
              <div className="flex items-center gap-2">
                <span className="size-1 rounded-full bg-tech-main/35" />
                <Silian_SegmentedBar opacity="low" className="h-3 w-2/5" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="size-1 bg-tech-main/45" />
            <Silian_SegmentedBar opacity="high" className="h-4 w-2/3" />
          </div>

          <div className="nested-list">
            <div className="flex items-center gap-2">
              <span className="h-px w-2 bg-tech-main/40" />
              <Silian_SegmentedBar opacity="medium" className="h-3.5 w-3/5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="h-px w-2 bg-tech-main/40" />
              <Silian_SegmentedBar opacity="low" className="h-3.5 w-1/3" />
            </div>
          </div>
        </div>

        <div className="nested-list">
          <div className="flex items-center gap-2">
            <span className="h-px w-2 bg-tech-main/35" />
            <Silian_SegmentedBar opacity="medium" className="h-3.5 w-1/2" />
          </div>
          <div className="flex items-center gap-2">
            <span className="h-px w-2 bg-tech-main/35" />
            <Silian_SegmentedBar opacity="low" className="h-3.5 w-2/5" />
          </div>
          <div className="flex items-center gap-2">
            <span className="h-px w-2 bg-tech-main/35" />
            <Silian_SegmentedBar opacity="low" className="h-3.5 w-1/3" />
          </div>
        </div>
      </div>
    </div>
  )
}

function Silian_SidebarTreeWrapper({
  sidebarRef: Silian_sidebarRef,
  showPlaceholder: Silian_showPlaceholder,
  onNavigate: Silian_onNavigate,
  internalScroll: Silian_internalScroll = false,
  scrollClass: Silian_scrollClass = "",
  hideActions: Silian_hideActions = false,
}: SidebarTreeWrapperProps) {
  return (
    <div
      className={`
         w-full pb-4 font-mono text-[0.9375rem] wrap-break-word
         [&_li]:mt-1.5
         [&_ul]:list-none
         [&_ul_ul]:mt-1.5 [&_ul_ul]:mb-3 [&_ul_ul]:border-l [&_ul_ul]:guide-line
         [&_ul_ul]:pl-3
         [&>ul]:pl-0
         ${Silian_showPlaceholder ? "h-full min-h-full pb-0" : ""}
       `}
      aria-busy={Silian_showPlaceholder}>
      {Silian_showPlaceholder ? (
        <div className="h-full min-h-full pr-4">
          <Silian_TreeLoadingPlaceholder />
        </div>
      ) : (
        <Silian_SidebarClient
          tree={[]}
          onNavigate={Silian_onNavigate}
          ref={Silian_sidebarRef}
          internalScroll={Silian_internalScroll}
          scrollClass={Silian_scrollClass}
          hideActions={Silian_hideActions}
        />
      )}
    </div>
  )
}

export function ArticlesLayoutClient({ children: Silian_children, tree: Silian_tree }: ArticlesLayoutProps) {
  const Silian_SIDEBAR_HIDDEN_KEY = "gtmc_sidebar_hidden"
  const [Silian_isOpen, Silian_setIsOpen] = Silian_useState(false)
  const [Silian_isStuck, Silian_setIsStuck] = Silian_useState(false)
  const [Silian_showFullText, Silian_setShowFullText] = Silian_useState(true)
  const [Silian_treeData, Silian_setTreeData] = Silian_useState<TreeNode[]>(Silian_tree)
  const [Silian_isTreeLoading, Silian_setIsTreeLoading] = Silian_useState(Silian_tree.length === 0)
  const [Silian_sidebarHidden, Silian_setSidebarHidden] = Silian_useState(false)
  const Silian_pathname = Silian_usePathname()
  const Silian_desktopSidebarRef = Silian_useRef<SidebarClientHandle>(null)
  const Silian_floatingCardSidebarRef = Silian_useRef<SidebarClientHandle>(null)
  const Silian_t = Silian_useTranslations("Sidebar")
  const Silian_tA11y = Silian_useTranslations("CommonA11y")

  Silian_useEffect(() => {
    try {
      if (localStorage.getItem(Silian_SIDEBAR_HIDDEN_KEY) === "true") {
        Silian_setSidebarHidden(true)
      }
    } catch { }
  }, [])

  const Silian_toggleSidebarHidden = () => {
    Silian_setSidebarHidden((Silian_prev) => {
      const Silian_next = !Silian_prev
      try {
        localStorage.setItem(Silian_SIDEBAR_HIDDEN_KEY, String(Silian_next))
      } catch { }
      return Silian_next
    })
  }

  Silian_useEffect(() => {
    if (Silian_pathname) {
      Silian_setIsOpen(false)
    }
  }, [Silian_pathname])

  Silian_useEffect(() => {
    const Silian_timer = setTimeout(
      () => {
        Silian_setShowFullText(!Silian_isStuck)
      },
      Silian_isStuck ? 0 : 250
    )
    return () => clearTimeout(Silian_timer)
  }, [Silian_isStuck])

  Silian_useEffect(() => {
    const Silian_NAVBAR_HEIGHT = 64

    const Silian_handleScroll = () => {
      const Silian_currentlyStuck = window.scrollY > Silian_NAVBAR_HEIGHT
      Silian_setIsStuck((Silian_prev) => {
        if (Silian_currentlyStuck && !Silian_prev) {
          Silian_setIsOpen(false)
        }
        return Silian_currentlyStuck
      })
    }

    // Sync immediately on mount in case page is already scrolled
    Silian_handleScroll()

    window.addEventListener("scroll", Silian_handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", Silian_handleScroll)
  }, [])

  Silian_useEffect(() => {
    if (Silian_tree.length > 0) {
      Silian_setTreeData(Silian_tree)
      Silian_setIsTreeLoading(false)
      return
    }

    const Silian_controller = new AbortController()
    let Silian_active = true

    const Silian_loadTree = async () => {
      try {
        Silian_setIsTreeLoading(true)
        const Silian_response = await fetch("/api/articles/tree", {
          method: "GET",
          signal: Silian_controller.signal,
        })

        if (!Silian_response.ok) {
          return
        }

        const Silian_payload = (await Silian_response.json()) as TreeNode[]
        if (Silian_active && Array.isArray(Silian_payload)) {
          Silian_setTreeData(Silian_payload)
        }
      } catch (Silian_error) {
        if (Silian_error instanceof Error && Silian_error.name === "AbortError") {
          return
        }
      } finally {
        if (Silian_active) {
          Silian_setIsTreeLoading(false)
        }
      }
    }

    void Silian_loadTree()

    return () => {
      Silian_active = false
      Silian_controller.abort()
    }
  }, [Silian_tree, Silian_tree.length])

  const Silian_showTreePlaceholder = Silian_isTreeLoading && Silian_treeData.length === 0

  const Silian_onNavigate = () => Silian_setIsOpen(false)

  const Silian_fixedTreeContent = (
    <Silian_SidebarTreeWrapper
      sidebarRef={Silian_desktopSidebarRef}
      showPlaceholder={Silian_showTreePlaceholder}
      onNavigate={Silian_onNavigate}
      internalScroll
      scrollClass="pr-4"
    />
  )

  const Silian_floatingTreeContent = (
    <Silian_SidebarTreeWrapper
      sidebarRef={Silian_floatingCardSidebarRef}
      showPlaceholder={Silian_showTreePlaceholder}
      onNavigate={Silian_onNavigate}
      internalScroll
    />
  )

  return (
    <Silian_SidebarProvider tree={Silian_treeData}>
      <Silian_MobileTocBar />
      <div
        className="
          relative isolate flex min-h-[calc(100dvh-8rem)] flex-col
          md:flex-row md:justify-center md:gap-8
        ">
        <div
          className={`
            sticky z-30
            md:hidden ${window.scrollY > 64 ? "top-24" : "top-16"}
          `}>
          <div
            className="relative transition-all duration-500 ease-out"
            style={
              {
                padding: Silian_isStuck ? "1rem 1rem 0 1rem" : "0",
                justifyContent: Silian_isStuck ? "flex-end" : "stretch",
              } as Silian_React.CSSProperties
            }>
            <button
              type="button"
              onClick={(Silian_e) => {
                Silian_e.preventDefault()
                Silian_e.stopPropagation()
                Silian_setIsOpen(!Silian_isOpen)
              }}
              className="
                absolute cursor-pointer overflow-hidden
                border border-tech-main/40 bg-white/70 font-mono text-xs
                font-bold tracking-[0.15em] text-tech-main backdrop-blur-sm
                transition-all duration-400 ease-out
                hover:bg-tech-main/5
              "
              style={
                {
                  width: Silian_isStuck ? "5rem" : "100%",
                  minHeight: Silian_isStuck ? "" : "3rem",
                  padding: Silian_isStuck ? "0.125rem 0.5rem" : "1rem",
                  borderBottom: Silian_isStuck ? undefined : "1px solid",
                  boxShadow: Silian_isStuck
                    ? "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                    : "none",
                  right: Silian_isStuck ? "1rem" : 0,
                } as Silian_React.CSSProperties
              }
              aria-label={Silian_tA11y("toggleArticleTree")}
              aria-expanded={Silian_isOpen}
              data-testid="mobile-tree-toggle">
              <div className="relative flex w-full items-center justify-between">
                <span
                  className="transition-opacity duration-150"
                  style={{ opacity: Silian_showFullText ? 1 : 0 }}>
                  {Silian_t("title")}
                </span>
                <span
                  className="
                    absolute left-1/2 line-clamp-none w-full
                    -translate-x-1/2 transition-opacity
                  "
                  style={{ opacity: Silian_showFullText ? 0 : 1 }}>
                  {Silian_t("titleShort")}
                </span>
                <span
                  className="text-sm font-bold transition-opacity duration-200"
                  style={{ opacity: Silian_showFullText ? 1 : 0 }}>
                  {Silian_isOpen ? "▼" : "▶"}
                </span>
              </div>
            </button>
            <div className="h-12" />
          </div>

          <div
            className={`
              grid transition-all duration-300 ease-out
              ${Silian_isOpen && !Silian_isStuck
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0"
              }
            `}>
            <div className="overflow-hidden">
              <div
                className="
                  max-h-[calc(100dvh-12rem)] overflow-y-auto overscroll-contain
                  border-t guide-line bg-white/95 px-4 pt-3 pb-4
                ">
                {Silian_fixedTreeContent}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile floating tree card */}
        <Silian_MobileTreeCard
          isOpen={Silian_isOpen}
          onClose={() => Silian_setIsOpen(false)}
          isFloating={Silian_isStuck}>
          {Silian_floatingTreeContent}
        </Silian_MobileTreeCard>

        {/* Desktop sidebar */}
        <div
          className="
            relative hidden shrink-0 self-stretch
            md:block
          "
          data-sidebar-wrapper
          data-sidebar-hidden={Silian_sidebarHidden ? "" : undefined}>
          <div className="flex h-full">
            <aside
              className="
                h-full w-64 overflow-clip border-r guide-line
                transition-[width,opacity,border-color] duration-300
                ease-[cubic-bezier(0.16,1,0.3,1)]
                lg:w-80
              "
              style={{
                width: Silian_sidebarHidden ? 0 : undefined,
                opacity: Silian_sidebarHidden ? 0 : 1,
                borderRightWidth: Silian_sidebarHidden ? 0 : undefined,
              }}>
              <div
                className="
                  sticky top-20 flex w-64 flex-col justify-center
                  hover:z-20
                  sm:top-26 sm:h-[calc(100dvh-128px)]
                  lg:top-28 lg:h-[calc(100dvh-144px)] lg:w-80
                ">
                <div
                  className="
                    group relative flex max-h-4/5 min-h-0 flex-1 flex-col
                    overflow-visible border-b guide-line text-tech-main
                    md:px-4 md:py-2
                  ">
                  <div className="flex shrink-0 flex-col">
                    <div
                      className="
                        group/title flex shrink-0 items-center justify-between
                        border-b guide-line px-4 pb-2
                      ">
                      <div
                        className="
                          flex items-center font-mono text-xs font-bold
                          tracking-tech-wide text-tech-main/60 uppercase
                        ">
                        <span
                          className="
                            mr-2 inline-block size-1.5 animate-pulse
                            bg-tech-main/60
                          "
                        />
                        SYS.DIR_TREE
                      </div>
                    </div>
                  </div>

                  {Silian_showTreePlaceholder ? (
                    <div
                      className="
                        custom-left-scrollbar h-full min-h-0 flex-1
                        overflow-y-auto
                      ">
                      <Silian_TreeLoadingPlaceholder />
                    </div>
                  ) : (
                    <Silian_SidebarClient
                      ref={Silian_desktopSidebarRef}
                      tree={Silian_treeData}
                      internalScroll
                      scrollClass="pr-4"
                    />
                  )}
                </div>
              </div>
            </aside>

            <div className="relative h-full w-0">
              <div className="sticky top-[50vh] -translate-y-1/2 justify-center overflow-visible">
                <button
                  type="button"
                  onClick={Silian_toggleSidebarHidden}
                  aria-label={
                    Silian_sidebarHidden
                      ? Silian_tA11y("showSidebar")
                      : Silian_tA11y("hideSidebar")
                  }
                  aria-expanded={!Silian_sidebarHidden}
                  data-sidebar-toggle=""
                  className="
                      absolute top-0 -left-3 z-40 flex size-6
                      -translate-y-1/2 cursor-pointer items-center justify-center
                      border guide-line bg-tech-bg text-tech-main/40
                      transition-[opacity,color,background-color] duration-300
                      ease-[cubic-bezier(0.16,1,0.3,1)]
                      hover:bg-tech-main/5 hover:text-tech-main
                    ">
                  <span
                    className="
                      text-[0.5rem] leading-none font-bold select-none
                    ">
                    {Silian_sidebarHidden ? "▶" : "◀"}
                  </span>
                </button>
                <span className="absolute top-4 -right-3 inline-block text-right font-mono text-[0.625rem] font-bold text-tech-main/40">
                  {" "}
                  {Silian_sidebarHidden ? "table of contents" : ""}
                </span>
              </div>
            </div>
          </div>
        </div>

        <main
          className={`
            relative my-6 w-full flex-1 transition-all duration-300
            ease-[cubic-bezier(0.16,1,0.3,1)]
            ${Silian_sidebarHidden
              ? `
                  md:max-w-3xl
                  xl:max-w-3xl
                  [1920px]:max-w-4xl
                `
              : `
                  md:max-w-2xl
                  xl:max-w-3xl
                  [1920px]:max-w-4xl
                `
            }
          `}>
          {Silian_children}
        </main>

        <Silian_ArticleTocRail />
      </div>
    </Silian_SidebarProvider>
  )
}
