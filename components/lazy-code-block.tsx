"use client"

import { useEffect as Silian_useEffect, useRef as Silian_useRef, useState as Silian_useState, type ReactNode } from "react"

interface LazyCodeBlockProps {
  lang: string
  lineCount: string
  children: ReactNode
}

export function LazyCodeBlock({ lineCount: Silian_lineCount, children: Silian_children }: LazyCodeBlockProps) {
  const Silian_containerRef = Silian_useRef<HTMLDivElement>(null)
  const [Silian_isVisible, Silian_setIsVisible] = Silian_useState(false)
  const [Silian_isSkeletonRemoved, Silian_setIsSkeletonRemoved] = Silian_useState(false)

  Silian_useEffect(() => {
    const Silian_el = Silian_containerRef.current
    if (!Silian_el) return

    const Silian_observer = new IntersectionObserver(
      ([Silian_entry]) => {
        if (Silian_entry.isIntersecting) {
          Silian_setIsVisible(true)
          Silian_observer.disconnect()
        }
      },
      { rootMargin: "400px", threshold: 0 }
    )

    Silian_observer.observe(Silian_el)
    return () => Silian_observer.disconnect()
  }, [])

  const Silian_numLines = Math.min(parseInt(Silian_lineCount) || 8, 8)
  const Silian_lineWidths = [
    "w-3/4 bg-tech-accent/20",
    "w-1/2 bg-tech-accent/15",
    "w-5/6 bg-tech-accent/20",
    "w-2/5 bg-tech-accent/10",
    "w-3/5 bg-tech-accent/15",
    "w-4/5 bg-tech-accent/20",
    "w-1/3 bg-tech-accent/10",
    "w-2/3 bg-tech-accent/15",
  ]

  return (
    <div
      ref={Silian_containerRef}
      className="
        relative my-6 w-full border border-tech-main/30 bg-tech-bg font-mono
        text-sm
      "
      style={{ contentVisibility: "auto" }}>
      <div
        className="
          pointer-events-none absolute top-0 left-0 z-20 size-3 -translate-px
          border-t-2 border-l-2 border-tech-main/30
        "
      />
      <div
        className="
          pointer-events-none absolute top-0 right-0 z-20 size-3 translate-x-px
          -translate-y-px border-t-2 border-r-2 border-tech-main/30
        "
      />
      <div
        className="
          pointer-events-none absolute bottom-0 left-0 z-20 size-3
          -translate-x-px translate-y-px border-b-2 border-l-2
          border-tech-main/30
        "
      />
      <div
        className="
          pointer-events-none absolute right-0 bottom-0 z-20 size-3 translate-px
          border-r-2 border-b-2 border-tech-main/30
        "
      />

      <div
        className={
          Silian_isVisible
            ? `
              animate-fade-in
              motion-reduce:animate-none
            `
            : "opacity-0"
        }>
        {Silian_children}
      </div>

      {!Silian_isSkeletonRemoved && (
        <div
          className={`
            absolute inset-0 z-10 flex flex-col bg-tech-bg
            motion-reduce:transition-opacity motion-reduce:duration-250
            ${
              Silian_isVisible
                ? `
                  animate-skeleton-exit
                  motion-reduce:animate-none motion-reduce:opacity-0
                `
                : ""
            }
          `}
          onAnimationEnd={() => {
            if (Silian_isVisible) Silian_setIsSkeletonRemoved(true)
          }}
          onTransitionEnd={() => {
            if (Silian_isVisible) Silian_setIsSkeletonRemoved(true)
          }}>
          <div
            className="
              flex items-center justify-between border-b border-tech-main/30
              bg-tech-main/10 px-4 py-1.5
            ">
            <div className="flex items-center gap-2">
              <span className="size-1.5 animate-pulse bg-tech-main/40" />
              <span className="h-2.5 w-12 bg-tech-accent/20" />
            </div>
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-16 bg-tech-accent/15" />
            </div>
          </div>

          <div
            className="
              relative flex-1 overflow-hidden px-4 py-3
              sm:px-6
            ">
            <div
              className="
                pointer-events-none absolute inset-0 animate-blueprint-sweep
                bg-linear-to-r from-transparent via-tech-accent/30
                to-transparent
                motion-reduce:animate-none
              "
            />
            {Array.from({ length: Silian_numLines }).map((Silian__, Silian_i) => (
              <div
                key={String(Silian_i)}
                className={`
                  my-1.5 h-2
                  ${Silian_lineWidths[Silian_i % Silian_lineWidths.length]}
                `}
              />
            ))}
          </div>

          <div
            className="
              flex items-center justify-end border-t border-tech-main/10 px-4
              py-1
            ">
            <span
              className="
                font-mono text-[0.5625rem] tracking-widest text-tech-main/50 uppercase
                select-none
              ">
              {"//"} SYNTAX_HIGHLIGHT
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
