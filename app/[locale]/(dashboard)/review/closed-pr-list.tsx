"use client"

import { useCallback as Silian_useCallback, useEffect as Silian_useEffect, useRef as Silian_useRef, useState as Silian_useState } from "react"
import { CornerBrackets as Silian_CornerBrackets } from "@/components/ui/corner-brackets"
import { TechCard as Silian_TechCard } from "@/components/ui/tech-card"
import type { ClosedPRListItem } from "./page"

const Silian_PAGE_SIZE = 10

type ClosedPRListProps = {
  getClosedPRsAction: (page: number) => Promise<ClosedPRListItem[]>
}

function Silian_ClosedPRSkeletonRows() {
  const Silian_skeletonKeys = ["alpha", "beta", "gamma"]

  return (
    <div className="grid grid-cols-1 gap-6">
      {Silian_skeletonKeys.map((Silian_key) => (
        <Silian_TechCard
          key={`closed-pr-skeleton-${Silian_key}`}
          className="relative border border-tech-line bg-white/80 p-6 backdrop-blur-sm">
          <Silian_CornerBrackets variant="hover" />
          <div className="relative z-10 animate-pulse space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="h-5 w-20 border border-tech-line bg-tech-bg" />
              <div className="h-4 w-28 bg-tech-accent/40" />
              <div className="h-5 w-24 border border-tech-line bg-tech-bg" />
            </div>
            <div className="h-6 w-3/4 border-l-2 border-tech-line bg-tech-accent/35 pl-3" />
            <div className="h-4 w-40 bg-tech-accent/30" />
            <div className="h-6 w-36 border border-tech-line bg-tech-bg" />
          </div>
        </Silian_TechCard>
      ))}
    </div>
  )
}

function Silian_ClosedPRCard({ pr: Silian_pr }: { pr: ClosedPRListItem }) {
  const Silian_statusClassName = Silian_pr.isMerged
    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700"
    : "border-[var(--color-tech-line)] bg-[var(--color-tech-bg)] text-[var(--color-tech-main)]"

  return (
    <Silian_TechCard className="group relative border border-tech-line bg-white/80 p-6 backdrop-blur-sm">
      <Silian_CornerBrackets variant="hover" />

      <div className="relative z-10 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="border border-blue-500/40 bg-blue-500/10 px-2 py-0.5 font-mono text-xs tracking-wider text-blue-600">
            [PR #{Silian_pr.number}]
          </span>
          <span className="mono-label">
            {new Date(Silian_pr.createdAt).toLocaleString()}
          </span>
          <span
            className={`border px-2 py-0.5 font-mono text-[0.6875rem] tracking-widest ${Silian_statusClassName}`}>
            {Silian_pr.isMerged ? "MERGED_" : "CLOSED_"}
          </span>
        </div>

        <h3 className="border-l-2 border-tech-main/40 pl-3 text-lg font-bold tracking-tight text-tech-main-dark uppercase md:text-xl">
          {Silian_pr.title || "UNTITLED"}
        </h3>

        <p className="pl-3 font-mono text-xs text-tech-main/80">
          Submitted by:{" "}
          <span className="font-bold text-tech-main-dark">
            {Silian_pr.userLogin || "UNKNOWN"}
          </span>
        </p>

        <p className="ml-3 inline-flex items-center border guide-line bg-tech-main/5 px-2 py-1 font-mono text-xs text-tech-main">
          <span className="mr-2 size-1.5 bg-tech-main"></span> TARGET:{" "}
          {Silian_pr.headRef}
        </p>
      </div>
    </Silian_TechCard>
  )
}

export function ClosedPRList({ getClosedPRsAction: Silian_getClosedPRsAction }: ClosedPRListProps) {
  const [Silian_closedPRs, Silian_setClosedPRs] = Silian_useState<ClosedPRListItem[]>([])
  const [Silian_page, Silian_setPage] = Silian_useState(0)
  const [Silian_hasMore, Silian_setHasMore] = Silian_useState(true)
  const [Silian_isInitialLoading, Silian_setIsInitialLoading] = Silian_useState(true)
  const [Silian_isFetchingMore, Silian_setIsFetchingMore] = Silian_useState(false)
  const [Silian_error, Silian_setError] = Silian_useState<string | null>(null)
  const Silian_sentinelRef = Silian_useRef<HTMLDivElement | null>(null)
  const Silian_isRequestInFlightRef = Silian_useRef(false)

  const Silian_loadPage = Silian_useCallback(
    async (Silian_nextPage: number) => {
      if (Silian_isRequestInFlightRef.current) {
        return
      }

      Silian_isRequestInFlightRef.current = true
      Silian_setError(null)

      if (Silian_nextPage === 1) {
        Silian_setIsInitialLoading(true)
      } else {
        Silian_setIsFetchingMore(true)
      }

      try {
        const Silian_nextPRs = await Silian_getClosedPRsAction(Silian_nextPage)

        Silian_setClosedPRs((Silian_current) =>
          Silian_nextPage === 1 ? Silian_nextPRs : [...Silian_current, ...Silian_nextPRs]
        )
        Silian_setPage(Silian_nextPage)
        Silian_setHasMore(Silian_nextPRs.length === Silian_PAGE_SIZE)
      } catch (Silian_err) {
        Silian_setError(Silian_err instanceof Error ? Silian_err.message : String(Silian_err))
      } finally {
        Silian_isRequestInFlightRef.current = false
        Silian_setIsInitialLoading(false)
        Silian_setIsFetchingMore(false)
      }
    },
    [Silian_getClosedPRsAction]
  )

  Silian_useEffect(() => {
    void Silian_loadPage(1)
  }, [Silian_loadPage])

  Silian_useEffect(() => {
    if (
      !Silian_sentinelRef.current ||
      !Silian_hasMore ||
      Silian_isInitialLoading ||
      Silian_isFetchingMore
    ) {
      return
    }

    const Silian_observer = new IntersectionObserver(
      (Silian_entries) => {
        if (Silian_entries[0]?.isIntersecting) {
          void Silian_loadPage(Silian_page + 1)
        }
      },
      { rootMargin: "240px 0px" }
    )

    Silian_observer.observe(Silian_sentinelRef.current)

    return () => Silian_observer.disconnect()
  }, [Silian_hasMore, Silian_isFetchingMore, Silian_isInitialLoading, Silian_loadPage, Silian_page])

  return (
    <div className="space-y-4">
      <h2 className="border-b-2 border-tech-main/50 pb-2 font-bold tracking-widest text-tech-main uppercase">
        CLOSED_&amp;_MERGED_
      </h2>

      {Silian_closedPRs.length > 0 && (
        <div className="grid grid-cols-1 gap-6">
          {Silian_closedPRs.map((Silian_pr) => (
            <Silian_ClosedPRCard key={Silian_pr.id} pr={Silian_pr} />
          ))}
        </div>
      )}

      {(Silian_isInitialLoading || Silian_isFetchingMore) && <Silian_ClosedPRSkeletonRows />}

      {!Silian_isInitialLoading && Silian_closedPRs.length === 0 && !Silian_error && (
        <p className="font-mono text-xs tracking-widest text-tech-main/60 uppercase">
          No closed pull requests found.
        </p>
      )}

      {Silian_error && (
        <div className="border-l-2 border-red-500/40 bg-red-500/5 px-3 py-2 font-mono text-xs text-red-600">
          {Silian_error}
        </div>
      )}

      <div ref={Silian_sentinelRef} aria-hidden="true" className="h-1 w-full" />
    </div>
  )
}
