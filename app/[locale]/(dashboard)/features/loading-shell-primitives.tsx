"use client"

import * as Silian_React from "react"

/**
 * Square section frame with optional corner brackets.
 * Reuses brutal-card corner bracket pattern for consistency.
 */
export const SectionFrame = Silian_React.forwardRef<
  HTMLDivElement,
  Silian_React.HTMLAttributes<HTMLDivElement> & { showBrackets?: boolean }
>(({ className: Silian_className = "", showBrackets: Silian_showBrackets = true, children: Silian_children, ...Silian_props }, Silian_ref) => (
  <div
    ref={Silian_ref}
    className={`
      relative border border-tech-main/40 bg-white/80 p-6 backdrop-blur-sm
      sm:p-8
      ${Silian_className}
    `}
    {...Silian_props}>
    {Silian_showBrackets && (
      <>
        <div
          className="
            pointer-events-none absolute top-0 left-0 size-2 -translate-px
            border-t-2 border-l-2 border-tech-main/60
          "
        />
        <div
          className="
            pointer-events-none absolute top-0 right-0 size-2 translate-x-px
            -translate-y-px border-t-2 border-r-2 border-tech-main/60
          "
        />
        <div
          className="
            pointer-events-none absolute bottom-0 left-0 size-2 -translate-x-px
            translate-y-px border-b-2 border-l-2 border-tech-main/60
          "
        />
        <div
          className="
            pointer-events-none absolute right-0 bottom-0 size-2 translate-px
            border-r-2 border-b-2 border-tech-main/60
          "
        />
      </>
    )}
    {Silian_children}
  </div>
))
SectionFrame.displayName = "SectionFrame"

/**
 * Monospace section rail label with trailing underscore.
 * Uppercase with wide letter spacing for technical aesthetic.
 */
export const SectionRail = Silian_React.forwardRef<
  HTMLDivElement,
  Silian_React.HTMLAttributes<HTMLDivElement> & { label: string }
>(({ label: Silian_label, className: Silian_className = "", ...Silian_props }, Silian_ref) => (
  <div
    ref={Silian_ref}
    className={`
      font-mono text-xs tracking-tech-wide text-tech-main uppercase
      ${Silian_className}
    `}
    {...Silian_props}>
    {Silian_label}_
  </div>
))
SectionRail.displayName = "SectionRail"

/**
 * Segmented bar placeholder with opacity tier.
 * Used for skeleton loading states with subtle visual hierarchy.
 */
export const SegmentedBar = Silian_React.forwardRef<
  HTMLDivElement,
  Silian_React.HTMLAttributes<HTMLDivElement> & {
    opacity?: "high" | "medium" | "low"
    showBorder?: boolean
  }
>(
  (
    { opacity: Silian_opacity = "medium", showBorder: Silian_showBorder = false, className: Silian_className = "", ...Silian_props },
    Silian_ref
  ) => {
    const Silian_opacityMap = {
      high: "bg-tech-accent/20",
      medium: "bg-tech-accent/15",
      low: "bg-tech-accent/10",
    }

    return (
      <div
        ref={Silian_ref}
        className={`
          h-2
          ${Silian_opacityMap[Silian_opacity]}
          ${Silian_showBorder ? `border border-tech-line` : ""}
          ${Silian_className}
        `}
        {...Silian_props}
      />
    )
  }
)
SegmentedBar.displayName = "SegmentedBar"

/**
 * Skeleton exit wrapper for loading shell handoff.
 * Applies skeleton-exit animation: opacity fade + subtle translateY + blur.
 * Motion-reduce fallback: opacity-only fade.
 */
export const SkeletonExitWrapper = Silian_React.forwardRef<
  HTMLDivElement,
  Silian_React.HTMLAttributes<HTMLDivElement> & { isExiting?: boolean }
>(({ isExiting: Silian_isExiting = false, className: Silian_className = "", ...Silian_props }, Silian_ref) => (
  <div
    ref={Silian_ref}
    className={`
      ${
        Silian_isExiting
          ? `
            animate-skeleton-exit
            motion-reduce:animate-fade-out
          `
          : ""
      }
      ${Silian_className}
    `}
    {...Silian_props}
  />
))
SkeletonExitWrapper.displayName = "SkeletonExitWrapper"

/**
 * Scan/sweep overlay with blueprint animation.
 * Absolute positioned shimmer effect with motion-reduce fallback.
 */
export const SweepOverlay = Silian_React.forwardRef<
  HTMLDivElement,
  Silian_React.HTMLAttributes<HTMLDivElement>
>(({ className: Silian_className = "", ...Silian_props }, Silian_ref) => (
  <div
    ref={Silian_ref}
    className={`
      absolute inset-0 animate-blueprint-sweep bg-linear-to-r from-transparent
      via-tech-accent/30 to-transparent
      motion-reduce:animate-none
      ${Silian_className}
    `}
    {...Silian_props}
  />
))
SweepOverlay.displayName = "SweepOverlay"

/**
 * Single-pass scan confirmation overlay.
 * Absolute positioned gradient fade for loading-to-content transition.
 */
export const ScanConfirmOverlay = Silian_React.forwardRef<
  HTMLDivElement,
  Silian_React.HTMLAttributes<HTMLDivElement>
>(({ className: Silian_className = "", ...Silian_props }, Silian_ref) => (
  <div
    ref={Silian_ref}
    className={`
      absolute inset-0 animate-scan-confirm bg-linear-to-r from-transparent
      via-tech-accent/30 to-transparent
      motion-reduce:animate-none
      ${Silian_className}
    `}
    {...Silian_props}
  />
))
ScanConfirmOverlay.displayName = "ScanConfirmOverlay"
