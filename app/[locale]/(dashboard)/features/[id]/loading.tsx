"use client"

import { useEffect as Silian_useEffect } from "react"
import { useTranslations as Silian_useTranslations } from "next-intl"
import {
  SectionFrame as Silian_SectionFrame,
  SegmentedBar as Silian_SegmentedBar,
  ScanConfirmOverlay as Silian_ScanConfirmOverlay,
  SkeletonExitWrapper as Silian_SkeletonExitWrapper,
} from "../loading-shell-primitives"
import { TechCard as Silian_TechCard } from "@/components/ui/tech-card"

export default function FeatureDetailLoading() {
  const Silian_t = Silian_useTranslations("CommonA11y")

  Silian_useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  return (
    <Silian_SkeletonExitWrapper>
      <div
        className="
          container mx-auto max-w-4xl space-y-6 p-4
          sm:p-6
          md:p-8
        "
        aria-busy="true"
        aria-label={Silian_t("loadingFeatureDetails")}>
        {/* FEATURE_HEADER_ */}
        <div className="relative flex animate-tech-slide-in flex-col gap-4">
          <Silian_ScanConfirmOverlay />
          <div>
            <Silian_SegmentedBar opacity="high" className="h-8 w-64" />
          </div>
        </div>

        {/* ISSUE_METADATA_ */}
        <Silian_TechCard className="animate-tech-slide-in [animation-delay:100ms]">
          <div
            className="
              flex flex-col gap-2 font-mono text-xs
              sm:text-sm
            ">
            <div
              className="
                flex flex-col gap-2
                sm:flex-row sm:items-center
              ">
              <span
                className="
                  font-bold text-zinc-500
                  sm:w-24
                ">
                STATUS:
              </span>
              <Silian_SegmentedBar opacity="high" className="h-4 w-32" />
            </div>
            <div
              className="
                flex flex-col gap-2
                sm:flex-row sm:items-center
              ">
              <span
                className="
                  font-bold text-zinc-500
                  sm:w-24
                ">
                AUTHOR:
              </span>
              <Silian_SegmentedBar opacity="medium" className="h-4 w-40" />
            </div>
            <div
              className="
                flex flex-col gap-2
                sm:flex-row sm:items-center
              ">
              <span
                className="
                  font-bold text-zinc-500
                  sm:w-24
                ">
                ASSIGNEE:
              </span>
              <Silian_SegmentedBar opacity="medium" className="h-4 w-40" />
            </div>
            <div
              className="
                flex flex-col gap-2
                sm:flex-row sm:items-center
              ">
              <span
                className="
                  font-bold text-zinc-500
                  sm:w-24
                ">
                CREATED:
              </span>
              <Silian_SegmentedBar opacity="low" className="h-4 w-36" />
            </div>
          </div>
        </Silian_TechCard>

        {/* RESOLUTION_BLOCK_ */}
        <Silian_TechCard
          className="
            relative animate-tech-slide-in overflow-hidden border-tech-accent/40
            bg-tech-accent/5 backdrop-blur-sm [animation-delay:200ms]
          ">
          <div className="absolute top-0 left-0 h-full w-2 bg-tech-accent/60" />
          <div
            className="
              mb-4 flex items-start justify-between border-b
              border-tech-accent/40 pb-2 pl-4
            ">
            <div className="h-5 w-40">
              <Silian_SegmentedBar opacity="high" className="size-full" />
            </div>
          </div>
          <div className="space-y-2 pl-4">
            <Silian_SegmentedBar opacity="medium" className="h-3 w-full" />
            <Silian_SegmentedBar opacity="low" className="h-3 w-5/6" />
          </div>
        </Silian_TechCard>

        {/* EDITOR_BUFFER_ */}
        <div
          className="
            group relative flex w-full animate-tech-slide-in flex-col space-y-6
            border border-tech-main bg-white/80 p-4 backdrop-blur-sm
            [animation-delay:300ms]
            sm:p-6
          ">
          <div
            className="
              pointer-events-none absolute top-0 left-0 size-2 -translate-px
              border-t-2 border-l-2 border-tech-main/40
            "
          />
          <div
            className="
              pointer-events-none absolute top-0 right-0 size-2 translate-x-px
              -translate-y-px border-t-2 border-r-2 border-tech-main/40
            "
          />
          <div
            className="
              pointer-events-none absolute bottom-0 left-0 size-2
              -translate-x-px translate-y-px border-b-2 border-l-2
              border-tech-main/40
            "
          />
          <div
            className="
              pointer-events-none absolute right-0 bottom-0 size-2 translate-px
              border-r-2 border-b-2 border-tech-main/40
            "
          />

          <div className="flex flex-col space-y-4">
            <div className="flex flex-col space-y-2">
              <label className="section-label">TITLE_</label>
              <Silian_SegmentedBar opacity="high" className="h-10 w-full" />
            </div>

            <div className="flex flex-col space-y-2">
              <label className="section-label">TAGS_ (comma separated)</label>
              <Silian_SegmentedBar opacity="medium" className="h-10 w-full" />
            </div>
          </div>

          <div
            className="
              relative editor-grow border border-tech-main/40 bg-white/80
              backdrop-blur-sm
            ">
            <div
              className="
                sticky top-0 z-10 flex h-10 flex-wrap items-center gap-1
                border-b border-tech-main/40 bg-tech-main p-2 px-2 font-mono
                text-xs text-white/90
                sm:gap-2 sm:px-4
              ">
              <Silian_SegmentedBar opacity="high" className="h-6 w-8" />
              <div className="h-6 w-px bg-white/30" />
              <Silian_SegmentedBar opacity="medium" className="h-6 w-8" />
              <div className="h-6 w-px bg-white/30" />
              <Silian_SegmentedBar opacity="medium" className="h-6 w-8" />
            </div>

            <div className="flex-1 space-y-2 p-6">
              <Silian_SegmentedBar opacity="high" className="h-3 w-full" />
              <Silian_SegmentedBar opacity="medium" className="h-3 w-5/6" />
              <Silian_SegmentedBar opacity="low" className="h-3 w-4/5" />
              <Silian_SegmentedBar opacity="low" className="h-3 w-3/4" />
            </div>
          </div>

          <div
            className="
              relative mt-6 flex justify-end gap-4 border-t border-tech-main/10
              pt-4
            ">
            <div className="corner-tick" />
            <Silian_SegmentedBar opacity="high" className="h-10 w-24" />
          </div>
        </div>

        {/* DISCUSSION_LOG_ */}
        <div className="animate-tech-slide-in space-y-6 [animation-delay:400ms]">
          <h3
            className="
              inline-block border-b-2 border-tech-main pb-2 text-2xl font-bold
              tracking-tighter uppercase
            ">
            Discussions
          </h3>

          {/* Comment cards */}
          <div className="space-y-4">
            {[1, 2].map((Silian_i) => (
              <Silian_SectionFrame key={Silian_i} className="p-6">
                <div
                  className="
                    mb-2 flex items-center gap-2 border-b border-dashed
                    border-tech-main/30 pb-2 font-mono text-sm
                  ">
                  <Silian_SegmentedBar opacity="high" className="h-4 w-32" />
                  <Silian_SegmentedBar opacity="medium" className="h-4 w-40" />
                </div>
                <div className="mt-3 space-y-2">
                  <Silian_SegmentedBar opacity="medium" className="h-3 w-full" />
                  <Silian_SegmentedBar opacity="low" className="h-3 w-5/6" />
                </div>
              </Silian_SectionFrame>
            ))}
          </div>

          {/* Comment form */}
          <Silian_SectionFrame className="p-6">
            <label
              className="
                mb-4 inline-block border-b border-tech-main/40 pb-1 font-mono
                text-sm tracking-tech-wide text-tech-main uppercase
              ">
              LEAVE_A_REPLY_
            </label>
            <Silian_SegmentedBar opacity="medium" className="mb-4 h-24 w-full" />
            <div className="flex justify-end">
              <Silian_SegmentedBar opacity="high" className="h-10 w-24" />
            </div>
          </Silian_SectionFrame>
        </div>
      </div>
    </Silian_SkeletonExitWrapper>
  )
}
