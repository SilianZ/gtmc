"use client"

import { useEffect as Silian_useEffect } from "react"
import { useTranslations as Silian_useTranslations } from "next-intl"
import { TechCard as Silian_TechCard } from "@/components/ui/tech-card"
import {
  SectionRail as Silian_SectionRail,
  SegmentedBar as Silian_SegmentedBar,
  ScanConfirmOverlay as Silian_ScanConfirmOverlay,
  SkeletonExitWrapper as Silian_SkeletonExitWrapper,
} from "./loading-shell-primitives"

export default function FeaturesLoading() {
  const Silian_t = Silian_useTranslations("CommonA11y")

  Silian_useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  return (
    <Silian_SkeletonExitWrapper>
      <div
        className="page-container-pb"
        aria-busy="true"
        aria-label={Silian_t("loadingFeaturesList")}>
        <div
          className="
            relative mt-8 flex animate-tech-slide-in flex-col items-start
            justify-between gap-4 border-b border-tech-main/40 pb-6
            md:flex-row md:items-end
          ">
          <Silian_ScanConfirmOverlay />
          <div
            className="
              w-full
              md:w-auto
            ">
            <Silian_SectionRail label="FEATURE_HEADER" />
            <Silian_SegmentedBar
              opacity="high"
              className="mt-2 h-10 w-64 border-b border-tech-main/40"
            />
            <Silian_SegmentedBar opacity="low" className="mt-2 h-4 w-80" />
          </div>
          <div
            className="
              w-full
              md:w-auto
            ">
            <Silian_SegmentedBar
              opacity="high"
              className="
                h-10 w-full border border-tech-main/40
                md:w-48
              "
            />
          </div>
        </div>

        <div className="space-y-6">
          <Silian_TechCard
            className="
              animate-tech-slide-in border-tech-main/40 bg-white/80 p-6
              backdrop-blur-sm [animation-delay:100ms]
            ">
            <div className="space-y-4">
              <div>
                <h4
                  className="
                    mb-3 font-mono text-sm tracking-widest text-tech-main
                    uppercase
                  ">
                  FILTER_BY_STATUS_
                </h4>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((Silian_i) => (
                    <Silian_SegmentedBar
                      key={Silian_i}
                      opacity="low"
                      className="h-8 w-24 border guide-line"
                    />
                  ))}
                </div>
              </div>
              <div>
                <h4
                  className="
                    mb-3 font-mono text-sm tracking-widest text-tech-main
                    uppercase
                  ">
                  FILTER_BY_TAGS_
                </h4>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3].map((Silian_i) => (
                    <Silian_SegmentedBar
                      key={Silian_i}
                      opacity="low"
                      className="h-8 w-20 border guide-line"
                    />
                  ))}
                </div>
              </div>
            </div>
          </Silian_TechCard>

          {[
            { label: "PENDING", delay: "200ms", cards: [1, 2] },
            { label: "IN_PROGRESS", delay: "300ms", cards: [3, 4] },
            { label: "RESOLVED", delay: "400ms", cards: [5, 6] },
          ].map((Silian_group) => (
            <div
              key={Silian_group.label}
              className="animate-tech-slide-in"
              style={{ animationDelay: Silian_group.delay }}>
              <div className="mb-8">
                <h2
                  className="
                    mb-6 border-b guide-line pb-2 text-lg font-bold
                    tracking-widest text-tech-main-dark uppercase
                    md:text-xl
                  ">
                  {Silian_group.label} ({Silian_group.cards.length})
                </h2>
                <div
                  className="
                    grid grid-cols-1 gap-6
                    md:grid-cols-2
                    lg:grid-cols-3
                  ">
                  {Silian_group.cards.map((Silian_cardNum) => (
                    <Silian_TechCard
                      key={Silian_cardNum}
                      className="
                        flex h-auto flex-col justify-between border
                        border-tech-main/40 bg-white/80 p-6 backdrop-blur-sm
                        sm:h-64
                      ">
                      {/* Status badge + date row */}
                      <div className="card-header-row">
                        <Silian_SegmentedBar
                          opacity="high"
                          className="
                            h-6 w-24 border border-yellow-200/50
                            bg-yellow-100/50
                          "
                        />
                        <Silian_SegmentedBar opacity="high" className="h-5 w-20" />
                      </div>

                      {/* Title block */}
                      <div className="mb-4">
                        <Silian_SegmentedBar
                          opacity="high"
                          className="mb-2 h-6 w-full"
                        />
                        <Silian_SegmentedBar opacity="high" className="h-6 w-3/4" />
                      </div>

                      {/* Author/assignee rows */}
                      <div className="my-4 flex flex-col gap-2">
                        <Silian_SegmentedBar
                          opacity="medium"
                          className="
                            h-5 w-40 border border-zinc-200/50 bg-zinc-100/50
                          "
                        />
                        <Silian_SegmentedBar
                          opacity="medium"
                          className="
                            h-5 w-32 border border-zinc-200/50 bg-zinc-100/50
                          "
                        />
                      </div>

                      {/* Tags row at bottom */}
                      <div className="mt-auto flex flex-wrap gap-1 pt-4">
                        <Silian_SegmentedBar
                          opacity="low"
                          className="h-5 w-20 border guide-line"
                        />
                        <Silian_SegmentedBar
                          opacity="low"
                          className="h-5 w-24 border guide-line"
                        />
                      </div>
                    </Silian_TechCard>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Silian_SkeletonExitWrapper>
  )
}
