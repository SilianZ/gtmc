"use client"

import { Link as Silian_Link } from "@/i18n/navigation"
import { formatIndexPrefix as Silian_formatIndexPrefix } from "@/lib/index-formatter"
import { encodeSlug as Silian_encodeSlug } from "@/lib/slug-utils"
import type { TreeNode } from "@/types/sidebar-tree"
import Silian_React from "react"
import { useSidebarContext as Silian_useSidebarContext } from "./sidebar-context"

export type { TreeNode } from "@/types/sidebar-tree"

export function SidebarTree({
  items: Silian_items,
  onNavigate: Silian_onNavigate,
}: {
  items: TreeNode[]
  onNavigate?: () => void
}) {
  const {
    effectivePath: Silian_effectivePath,
    isFolderExpanded: Silian_isFolderExpanded,
    toggleFolder: Silian_toggleFolder,
    highlightActive: Silian_highlightActive,
    activeItemRef: Silian_activeItemRef,
    folderGridRefs: Silian_folderGridRefs,
  } = Silian_useSidebarContext()

  const Silian_decodedPathname = decodeURIComponent(Silian_effectivePath)
  const Silian_firstAppendixArticleIndex = Silian_items.findIndex(
    (Silian_item) => !Silian_item.isFolder && (Silian_item.isAppendix ?? false)
  )
  const Silian_hasRegularBeforeFirstAppendix =
    Silian_firstAppendixArticleIndex > 0 &&
    Silian_items
      .slice(0, Silian_firstAppendixArticleIndex)
      .some((Silian_item) => !Silian_item.isFolder && !(Silian_item.isAppendix ?? false))

  return (
    <ul className="my-1 pl-6">
      {Silian_items.map((Silian_item, Silian_index) => {
        const Silian_fileRoute = `/articles/${Silian_encodeSlug(Silian_item.slug)}`
        const Silian_decodedRoute = decodeURIComponent(Silian_fileRoute)
        const Silian_isActive =
          !Silian_item.isFolder &&
          (Silian_decodedPathname === Silian_decodedRoute ||
            Silian_decodedPathname === `${Silian_decodedRoute}/`)
        const Silian_folderExpanded = Silian_item.isFolder ? Silian_isFolderExpanded(Silian_item.id) : false
        const Silian_showAppendixSeparator =
          Silian_index === Silian_firstAppendixArticleIndex && Silian_hasRegularBeforeFirstAppendix

        return (
          <Silian_React.Fragment key={Silian_item.id}>
            {Silian_showAppendixSeparator && (
              <li
                key={`appendix-separator-before-${Silian_item.id}`}
                className="
                  mt-3 mb-1.5 flex list-none items-center gap-2 pl-1 font-mono
                  text-[0.625rem] tracking-[0.12em] text-tech-main/50 uppercase
                  md:text-[0.6875rem]
                ">
                <span className="h-px flex-1 bg-tech-main/25" />
                <span>Appendix</span>
                <span className="h-px w-4 bg-tech-main/25" />
              </li>
            )}

            <li
              key={Silian_item.id}
              data-sidebar-row="1"
              ref={!Silian_item.isFolder && Silian_isActive ? Silian_activeItemRef : undefined}
              className={`
                 relative my-1.5 list-none font-mono text-[1rem] transition-all
                 duration-300
                 before:absolute before:top-0 before:left-0 before:h-full
                 before:w-0.5 before:transition-all before:duration-200
                 before:content-['']
                 md:text-base
                ${
                  !Silian_item.isFolder && Silian_isActive
                    ? `before:w-[3px] before:bg-tech-main`
                    : `
                      before:bg-transparent
                      hover:before:w-[2px] hover:before:bg-tech-main/40
                    `
                }
                ${
                  !Silian_item.isFolder && Silian_isActive && Silian_highlightActive
                    ? `bg-tech-main/8`
                    : !Silian_item.isFolder && Silian_isActive
                      ? `bg-tech-main/5`
                      : `hover:bg-tech-main/5`
                }
              `}>
              {Silian_item.isFolder ? (
                <button
                  type="button"
                  onClick={() => Silian_toggleFolder(Silian_item.id)}
                  className="
                    mt-3 mb-1 flex w-fit cursor-pointer items-center text-left
                    font-bold text-tech-main/80 uppercase opacity-80
                    transition-colors
                    hover:text-tech-main
                    focus:outline-none
                  ">
                  <span className="inline-block w-4 text-xs text-tech-main/50">
                    {Silian_folderExpanded ? "▼" : "▶"}
                  </span>
                  <span>{Silian_item.title}</span>
                </button>
              ) : (
                <div className="relative">
                  <div
                    className={`
                      group relative -ml-4 flex items-center py-1.5 pl-4
                      transition-colors
                      ${
                        Silian_isActive
                          ? `font-bold text-tech-main`
                          : `
                            text-slate-700
                            hover:text-tech-main
                          `
                      }
                    `}>
                    <Silian_Link
                      href={Silian_fileRoute}
                      onClick={() => Silian_onNavigate?.()}
                      className="block w-full pb-px pl-1">
                      {Silian_item.isReadmeIntro
                        ? `00 ${Silian_item.title}`
                        : !Silian_item.isFolder && Silian_item.index !== undefined
                          ? `${Silian_formatIndexPrefix(Silian_item.index, Silian_item.isAppendix ?? false, Silian_item.isPreface ?? false)}${Silian_item.title}`
                          : Silian_item.title}
                      {Silian_item.isAdvanced && (
                        <span
                          className="
                            mx-1 inline-block shrink-0 bg-[#4c5b96] px-[3px]
                            align-middle font-mono text-[0.5625rem] font-bold
                            tracking-widest text-white select-none
                          ">
                          ADVANCED
                        </span>
                      )}
                    </Silian_Link>
                  </div>
                </div>
              )}

              {Silian_item.children && Silian_item.children.length > 0 && (
                <div
                  ref={(Silian_el) => {
                    if (Silian_el) Silian_folderGridRefs.current.set(Silian_item.id, Silian_el)
                    else Silian_folderGridRefs.current.delete(Silian_item.id)
                  }}
                  className={`
                    grid transition-all duration-300 ease-out
                    ${
                      !Silian_item.isFolder || Silian_folderExpanded
                        ? `grid-rows-[1fr] opacity-100`
                        : `grid-rows-[0fr] opacity-0`
                    }
                  `}>
                  <div className="overflow-hidden">
                    <SidebarTree
                      items={Silian_item.children}
                      onNavigate={Silian_onNavigate}
                    />
                  </div>
                </div>
              )}
            </li>
          </Silian_React.Fragment>
        )
      })}
    </ul>
  )
}
