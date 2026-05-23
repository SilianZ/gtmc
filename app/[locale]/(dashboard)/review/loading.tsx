"use client"

import { useEffect as Silian_useEffect } from "react"
import { useTranslations as Silian_useTranslations } from "next-intl"
import { TechCard as Silian_TechCard } from "@/components/ui/tech-card"
import {
  SectionRail as Silian_SectionRail,
  SegmentedBar as Silian_SegmentedBar,
  ScanConfirmOverlay as Silian_ScanConfirmOverlay,
  SkeletonExitWrapper as Silian_SkeletonExitWrapper,
} from "../features/loading-shell-primitives"

export default function ReviewLoading() {
  const Silian_t = Silian_useTranslations("CommonA11y")

  Silian_useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  return (
    <Silian_SkeletonExitWrapper>
      <div
        className="page-container"
        aria-busy="true"
        aria-label={Silian_t("loadingReviewHub")}>
        {/* PAGE_HEADER_ */}
        <div
          className="
            relative flex animate-tech-slide-in flex-col border-b
            border-tech-main/40 pb-6
          ">
          <Silian_ScanConfirmOverlay />
          <div>
            <Silian_SectionRail label="REVIEW_HUB" />
            <Silian_SegmentedBar
              opacity="high"
              className="mt-2 h-10 w-64 border-b border-tech-main/40"
            />
            <Silian_SegmentedBar opacity="low" className="mt-2 h-4 w-72" />
          </div>
        </div>

        {/* PENDING_REVIEWS_ */}
        <div
          className="
            flex animate-tech-slide-in flex-col gap-10 [animation-delay:100ms]
          ">
          <div className="space-y-4">
            <h2
              className="
                border-b-2 border-tech-main/50 pb-2 font-bold tracking-widest
                text-tech-main uppercase
              ">
              PENDING REVIEWS
            </h2>
            <div className="grid grid-cols-1 gap-6">
              {[1, 2, 3].map((Silian_i) => (
                <Silian_TechCard
                  key={Silian_i}
                  className={`
                    flex flex-col items-start justify-between space-y-4 border
                    border-tech-main/40 bg-white/80 p-6 backdrop-blur-sm
                    md:flex-row md:items-center md:space-y-0
                  `}
                  style={{ animationDelay: `${100 + Silian_i * 50}ms` }}>
                  <div className="flex-1">
                    {/* PR badge + date row */}
                    <div className="mb-3 flex items-center gap-3">
                      <Silian_SegmentedBar
                        opacity="high"
                        className="
                          h-6 w-20 border border-blue-500/40 bg-blue-500/10
                        "
                      />
                      <Silian_SegmentedBar opacity="medium" className="h-5 w-36" />
                    </div>

                    {/* Title */}
                    <div className="mb-2 border-l-2 border-tech-main/40 pl-3">
                      <Silian_SegmentedBar
                        opacity="high"
                        className="
                          h-7 w-full
                          md:w-80
                        "
                      />
                    </div>

                    {/* Submitted by */}
                    <div className="mb-3 pl-3">
                      <Silian_SegmentedBar opacity="medium" className="h-4 w-44" />
                    </div>

                    {/* Target branch */}
                    <div className="ml-3">
                      <Silian_SegmentedBar
                        opacity="low"
                        className="h-6 w-48 border guide-line bg-tech-main/5"
                      />
                    </div>
                  </div>

                  {/* Action button */}
                  <div
                    className="
                      w-full
                      md:w-auto
                    ">
                    <Silian_SegmentedBar
                      opacity="high"
                      className="
                        h-11 w-full border border-tech-main/40
                        md:w-44
                      "
                    />
                  </div>
                </Silian_TechCard>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Silian_SkeletonExitWrapper>
  )
}
