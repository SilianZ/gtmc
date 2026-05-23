"use client"

import * as Silian_React from "react"
import {
  useState as Silian_useState,
  useEffect as Silian_useEffect,
  useRef as Silian_useRef,
  useCallback as Silian_useCallback,
  useMemo as Silian_useMemo,
  useSyncExternalStore as Silian_useSyncExternalStore,
} from "react"
import { createPortal as Silian_createPortal } from "react-dom"
import { useTranslations as Silian_useTranslations } from "next-intl"
import { useRouter as Silian_useRouter, usePathname as Silian_usePathname } from "@/i18n/navigation"
import { articleUrl as Silian_articleUrl } from "@/lib/article-url"
import { CornerBrackets as Silian_CornerBrackets } from "@/components/ui/corner-brackets"

interface SearchResult {
  title: string
  slug: string
  snippet: string | null
  matchType: "title" | "content"
}

const Silian_emptySubscribe = () => () => {}

export function SearchCommand() {
  const Silian_t = Silian_useTranslations("Search")
  const [Silian_isOpen, Silian_setIsOpen] = Silian_useState(false)
  const Silian_isMounted = Silian_useSyncExternalStore(
    Silian_emptySubscribe,
    () => true,
    () => false
  )
  const [Silian_query, Silian_setQuery] = Silian_useState("")
  const [Silian_results, Silian_setResults] = Silian_useState<SearchResult[]>([])
  const [Silian_isLoading, Silian_setIsLoading] = Silian_useState(false)
  const [Silian_selectedIndex, Silian_setSelectedIndex] = Silian_useState(0)
  const Silian_inputRef = Silian_useRef<HTMLInputElement>(null)
  const Silian_resultsContainerRef = Silian_useRef<HTMLDivElement>(null)
  const Silian_abortRef = Silian_useRef<AbortController | null>(null)
  const Silian_router = Silian_useRouter()
  const Silian_pathname = Silian_usePathname()

  const Silian_closeModal = Silian_useCallback(() => {
    Silian_setIsOpen(false)
    Silian_setQuery("")
    Silian_setResults([])
    Silian_setSelectedIndex(0)
    Silian_setIsLoading(false)
  }, [])

  // Global Cmd+K / Ctrl+K handler
  Silian_useEffect(() => {
    const Silian_handleKeyDown = (Silian_e: KeyboardEvent) => {
      if ((Silian_e.metaKey || Silian_e.ctrlKey) && Silian_e.key === "k") {
        Silian_e.preventDefault()
        Silian_setIsOpen((Silian_prev) => {
          if (Silian_prev) {
            // Closing — reset state synchronously
            Silian_setQuery("")
            Silian_setResults([])
            Silian_setSelectedIndex(0)
            Silian_setIsLoading(false)
          }
          return !Silian_prev
        })
      }
    }
    document.addEventListener("keydown", Silian_handleKeyDown)
    return () => document.removeEventListener("keydown", Silian_handleKeyDown)
  }, [])

  // Auto-focus input when modal opens
  Silian_useEffect(() => {
    if (Silian_isOpen) {
      requestAnimationFrame(() => {
        Silian_inputRef.current?.focus()
      })
    }
  }, [Silian_isOpen])

  Silian_useEffect(() => {
    if (!Silian_isOpen || Silian_results.length === 0) return

    const Silian_container = Silian_resultsContainerRef.current
    if (!Silian_container) return

    const Silian_selectedItem = Silian_container.querySelector<HTMLElement>(
      `[data-search-result-index="${Silian_selectedIndex}"]`
    )

    Silian_selectedItem?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
    })
  }, [Silian_isOpen, Silian_results, Silian_selectedIndex])

  // Debounced search
  Silian_useEffect(() => {
    if (!Silian_query || Silian_query.length < 2) {
      return
    }

    const Silian_timer = setTimeout(() => {
      Silian_abortRef.current?.abort()
      const Silian_controller = new AbortController()
      Silian_abortRef.current = Silian_controller

      Silian_setIsLoading(true)

      fetch(`/api/articles/search?q=${encodeURIComponent(Silian_query)}`, {
        signal: Silian_controller.signal,
      })
        .then((Silian_res) => Silian_res.json())
        .then((Silian_data) => {
          if (!Silian_controller.signal.aborted) {
            Silian_setResults(Silian_data.results || [])
            Silian_setIsLoading(false)
          }
        })
        .catch((Silian_err) => {
          if (Silian_err.name !== "AbortError") {
            Silian_setIsLoading(false)
          }
        })
    }, 300)

    return () => {
      clearTimeout(Silian_timer)
    }
  }, [Silian_query])

  const Silian_handleQueryChange = Silian_useCallback(
    (Silian_e: Silian_React.ChangeEvent<HTMLInputElement>) => {
      const Silian_value = Silian_e.target.value
      Silian_setQuery(Silian_value)
      Silian_setSelectedIndex(0)
      if (!Silian_value || Silian_value.length < 2) {
        Silian_setResults([])
        Silian_setIsLoading(false)
      }
    },
    []
  )

  const Silian_navigateToResult = Silian_useCallback(
    (Silian_result: SearchResult) => {
      const Silian_currentSlug = Silian_pathname.replace(/^\/articles\//, "")
      const Silian_decodedCurrentSlug = Silian_currentSlug
        .split("/")
        .map(decodeURIComponent)
        .join("/")

      if (Silian_decodedCurrentSlug === Silian_result.slug) {
        Silian_closeModal()
        if (Silian_result.snippet && Silian_query.trim().length >= 2) {
          const Silian_event = new CustomEvent("highlight-search", {
            detail: { query: Silian_query.trim() },
          })
          window.dispatchEvent(Silian_event)
        }
        return
      }

      Silian_closeModal()
      const Silian_highlightParam =
        Silian_result.snippet && Silian_query.trim().length >= 2
          ? `?highlight=${encodeURIComponent(Silian_query.trim())}`
          : ""
      Silian_router.push(`${Silian_articleUrl(Silian_result.slug)}${Silian_highlightParam}`)
    },
    [Silian_router, Silian_closeModal, Silian_query, Silian_pathname]
  )

  // Keyboard navigation inside modal
  const Silian_handleKeyDown = Silian_useCallback(
    (Silian_e: Silian_React.KeyboardEvent) => {
      switch (Silian_e.key) {
        case "ArrowDown":
          Silian_e.preventDefault()
          Silian_setSelectedIndex((Silian_prev) => (Silian_prev < Silian_results.length - 1 ? Silian_prev + 1 : 0))
          break
        case "ArrowUp":
          Silian_e.preventDefault()
          Silian_setSelectedIndex((Silian_prev) => (Silian_prev > 0 ? Silian_prev - 1 : Silian_results.length - 1))
          break
        case "Enter":
          Silian_e.preventDefault()
          if (Silian_results[Silian_selectedIndex]) {
            Silian_navigateToResult(Silian_results[Silian_selectedIndex])
          }
          break
        case "Escape":
          Silian_e.preventDefault()
          Silian_closeModal()
          break
      }
    },
    [Silian_results, Silian_selectedIndex, Silian_navigateToResult, Silian_closeModal]
  )

  // Highlight matched text in title/snippet
  const Silian_highlightMatch = Silian_useCallback(
    (Silian_text: string) => {
      if (!Silian_query || Silian_query.length < 2) return Silian_text
      const Silian_escapedQuery = Silian_query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      const Silian_regex = new RegExp(`(${Silian_escapedQuery})`, "gi")
      const Silian_parts = Silian_text.split(Silian_regex)
      let Silian_position = 0

      return Silian_parts.map((Silian_part, Silian_i) => {
        const Silian_start = Silian_position
        Silian_position += Silian_part.length

        return Silian_i % 2 === 1 ? (
          <mark
            key={`${Silian_part}-${Silian_start}`}
            className="bg-tech-main/20 px-0.5 text-tech-main-dark">
            {Silian_part}
          </mark>
        ) : (
          Silian_part
        )
      })
    },
    [Silian_query]
  )

  // Derive path breadcrumb from slug
  const Silian_slugToPath = (Silian_slug: string) => {
    return "/" + Silian_slug
  }

  // Platform-aware shortcut label
  const Silian_shortcutLabel = Silian_useMemo(() => {
    if (typeof navigator === "undefined") return "Ctrl+K"
    return navigator.platform?.toLowerCase().includes("mac") ? (
      <span className="flex flex-row items-center gap-0.5 leading-none">
        <span className="text-xs">{"\u2318"}</span>K
      </span>
    ) : (
      "Ctrl+K"
    )
  }, [])

  // Don't render portal until mounted (SSR safety)
  if (!Silian_isMounted) {
    return (
      <button
        type="button"
        className="
          hidden cursor-pointer items-center gap-2 border border-tech-main/40
          px-3 py-1.5 font-mono text-[0.6875rem] text-tech-main/60 transition-colors
          hover:bg-tech-main hover:text-white
          md:flex
        ">
        <span className="text-xs">&#x2315;</span>
        {Silian_t("heading")}
        <span
          className="
            ml-1 border border-tech-main/30 px-1 py-0.5 text-[0.5625rem]
            text-tech-main/40
          ">
          <span className="flex flex-row items-center gap-0.5 leading-none">
            <span className="text-xs">{"\u2318"}</span>K
          </span>
        </span>
      </button>
    )
  }

  return (
    <>
      {/* Trigger button — desktop only */}
      <button
        type="button"
        onClick={() => Silian_setIsOpen(true)}
        className="
          hidden h-8 w-40 cursor-pointer items-center
          gap-2 border border-tech-main/40 px-3 py-1.5 font-mono text-[0.6875rem] text-tech-main/60 transition-colors
          hover:bg-tech-main hover:text-white
          md:flex
        ">
        <div className="flex w-full items-center justify-between">
          <span className="flex items-center gap-1 text-lg leading-none">
            &#x2315;{/* icon */}
            <span className="mt-0.5 text-[0.625rem]">{Silian_t("heading")}</span>
          </span>
          <span
            className="
             border border-tech-main/30 px-1 text-[0.625rem]
              text-tech-main/40
            ">
            {Silian_shortcutLabel}
          </span>
        </div>
      </button>

      {/* Mobile trigger */}
      <button
        type="button"
        onClick={() => Silian_setIsOpen(true)}
        className="
          flex min-h-11 min-w-11 cursor-pointer items-center justify-center p-2
          font-mono text-[2.5rem] text-tech-main transition-colors
          hover:bg-tech-main/10
          md:hidden
        "
        aria-label={Silian_t("searchAriaLabel")}>
        &#x2315;
      </button>

      {/* Search modal (portal) */}
      {Silian_isOpen &&
        Silian_createPortal(
          <div
            className="
              fixed inset-0 z-9999 flex items-start justify-center bg-black/80
              p-4 pt-[10vh] duration-200 animate-in fade-in
              sm:pt-[15vh]
            "
            onClick={(Silian_e) => {
              if (Silian_e.target === Silian_e.currentTarget) Silian_closeModal()
            }}
            onKeyDown={(Silian_e) => {
              if (Silian_e.key === "Escape") {
                Silian_closeModal()
                return
              }

              Silian_handleKeyDown(Silian_e)
            }}
            role="dialog"
            aria-modal="true"
            aria-label={Silian_t("searchAriaLabel")}
            tabIndex={-1}>
            <div
              className="
                relative w-full max-w-xl border border-tech-main bg-white/95
                shadow-xl backdrop-blur-md duration-200 animate-in
                slide-in-from-top-4
              ">
              <Silian_CornerBrackets variant="static" />

              {/* Header */}
              <header
                className="
                  flex items-center justify-between border-b guide-line px-4
                  py-3
                ">
                <div
                  className="
                    flex items-center gap-2 font-mono text-xs font-bold
                    tracking-tech-wide text-tech-main/80 uppercase
                  ">
                  <span
                    className="
                      inline-block size-1.5 animate-pulse bg-tech-main/80
                    "
                  />
                  SYS.QUERY_ENGINE
                </div>
                <button
                  type="button"
                  onClick={Silian_closeModal}
                  className="
                    cursor-pointer border border-tech-main/40 px-2 py-0.5
                    font-mono text-[0.625rem] text-tech-main/70 transition-colors
                    hover:bg-tech-main hover:text-white
                  ">
                  ESC
                </button>
              </header>

              {/* Search input */}
              <div className="border-b guide-line px-4 py-3">
                <input
                  ref={Silian_inputRef}
                  type="text"
                  value={Silian_query}
                  onChange={Silian_handleQueryChange}
                  placeholder={Silian_t("placeholder")}
                  className="
                    w-full border border-tech-main/40 bg-white/60 px-3 py-2.5
                    font-mono text-sm text-tech-main-dark transition-colors
                    outline-none
                    placeholder:text-tech-main/50
                    focus:border-tech-main/70 focus:bg-white/80
                  "
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              {/* Results area */}
              <div
                ref={Silian_resultsContainerRef}
                className="custom-left-scrollbar max-h-[50vh] overflow-y-auto">
                {/* Status line */}
                {Silian_query.length >= 2 && (
                  <div
                    className="
                      border-b guide-line px-4 py-2 font-mono text-[0.625rem]
                      tracking-wider text-tech-main/70 uppercase
                    ">
                    {Silian_isLoading
                      ? Silian_t("scanning")
                      : Silian_results.length === 20
                        ? `SCAN_RESULTS (${Silian_results.length} - TOP MATCHES)`
                        : `SCAN_RESULTS (${Silian_results.length})`}
                  </div>
                )}

                {/* Loading state */}
                {Silian_isLoading && (
                  <div className="px-4 py-6">
                    <div className="space-y-3">
                      {[1, 2, 3].map((Silian_i) => (
                        <div key={Silian_i} className="space-y-1.5">
                          <div
                            className="
                            h-4 w-3/5 animate-pulse bg-tech-main/10
                          "
                          />
                          <div
                            className="
                            h-3 w-2/5 animate-pulse bg-tech-main/5
                          "
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Results list */}
                {!Silian_isLoading && Silian_results.length > 0 && (
                  <ul className="py-1">
                    {Silian_results.map((Silian_result, Silian_index) => (
                      <li key={Silian_result.slug}>
                        <button
                          type="button"
                          onClick={() => Silian_navigateToResult(Silian_result)}
                          onMouseEnter={() => Silian_setSelectedIndex(Silian_index)}
                          data-search-result-index={Silian_index}
                          className={`
                            group relative w-full cursor-pointer px-4 py-3
                            text-left transition-colors
                            ${
                              Silian_index === Silian_selectedIndex
                                ? "bg-tech-main/10"
                                : "hover:bg-tech-accent/10"
                            }
                          `}
                          aria-label={Silian_t("selectResult", {
                            title: Silian_result.title,
                          })}
                          tabIndex={-1}>
                          {Silian_index === Silian_selectedIndex && (
                            <Silian_CornerBrackets
                              variant="static"
                              color="border-tech-main/30"
                            />
                          )}

                          {/* Title */}
                          <div
                            className="
                              font-mono text-sm font-medium text-tech-main-dark
                            ">
                            {Silian_highlightMatch(Silian_result.title)}
                          </div>

                          {/* Path */}
                          <div
                            className="
                              mt-0.5 font-mono text-[0.625rem] tracking-wider
                              text-tech-main/60 uppercase
                            ">
                            {Silian_t("pathLabel")} {Silian_slugToPath(Silian_result.slug)}
                          </div>

                          {/* Content snippet */}
                          {Silian_result.snippet && (
                            <div
                              className="
                              mt-1 text-xs/relaxed text-tech-main/70
                            ">
                              {Silian_highlightMatch(Silian_result.snippet)}
                            </div>
                          )}

                          {/* Match type badge */}
                          <div
                            className="
                              absolute top-3 right-4 font-mono text-[0.5625rem]
                              tracking-wider text-tech-main/50 uppercase
                            ">
                            {Silian_result.matchType === "content"
                              ? Silian_t("matchBody")
                              : Silian_t("matchTitle")}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Empty state */}
                {!Silian_isLoading && Silian_query.length >= 2 && Silian_results.length === 0 && (
                  <div className="px-4 py-8 text-center">
                    <div
                      className="
                        font-mono text-xs tracking-wider text-tech-main/60
                        uppercase
                      ">
                      {Silian_t("noMatch")}
                    </div>
                    <div
                      className="
                      mt-1 font-mono text-[0.625rem] text-tech-main/40
                    ">
                      {Silian_t("tryDifferentKeywords")}
                    </div>
                  </div>
                )}

                {/* Initial state */}
                {Silian_query.length < 2 && (
                  <div className="px-4 py-8 text-center">
                    <div
                      className="
                        font-mono text-xs tracking-wider text-tech-main/60
                        uppercase
                      ">
                      {Silian_t("awaitingInput")}
                    </div>
                    <div
                      className="
                      mt-1 font-mono text-[0.625rem] text-tech-main/40
                    ">
                      {Silian_t("minCharsHint")}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer hints */}
              <footer
                className="
                  flex items-center gap-4 border-t guide-line px-4 py-2
                  font-mono text-[0.625rem] text-tech-main/60
                ">
                <span>
                  <kbd className="kbd-badge">&#x2191;&#x2193;</kbd>{" "}
                  {Silian_t("navigateHint")}
                </span>
                <span>
                  <kbd className="kbd-badge">&#x23CE;</kbd> {Silian_t("openHint")}
                </span>
                <span>
                  <kbd className="kbd-badge">ESC</kbd> {Silian_t("dismissHint")}
                </span>
              </footer>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
