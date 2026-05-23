"use client"

import { useState as Silian_useState } from "react"
import { useTranslations as Silian_useTranslations } from "next-intl"
import { ConflictMode as Silian_ConflictMode, ModeAnalysis as Silian_ModeAnalysis } from "@/types/review"
import { TechButton as Silian_TechButton } from "@/components/ui/tech-button"
import { CornerBrackets as Silian_CornerBrackets } from "@/components/ui/corner-brackets"

interface ModeSelectorProps {
  modeAnalysis: Silian_ModeAnalysis
  onSelectMode: (mode: Silian_ConflictMode) => void
  hasConflicts: boolean
  isSelecting?: boolean
}

export function ModeSelector({
  modeAnalysis: Silian_modeAnalysis,
  onSelectMode: Silian_onSelectMode,
  hasConflicts: Silian_hasConflicts,
  isSelecting: Silian_isSelecting,
}: ModeSelectorProps) {
  const Silian_t = Silian_useTranslations("Review")
  const Silian_homepageT = Silian_useTranslations("Homepage")
  const [Silian_selectedMode, Silian_setSelectedMode] = Silian_useState<Silian_ConflictMode>(
    Silian_modeAnalysis.recommendation
  )
  const Silian_modeCards = [
    {
      mode: "FINE_GRAINED" as Silian_ConflictMode,
      title: Silian_t("modeFineGrained"),
      subtitle: Silian_t("modeFineGrainedDesc"),
      detail: Silian_t("modeFineGrainedDetail"),
    },
    {
      mode: "SIMPLE" as Silian_ConflictMode,
      title: Silian_t("modeSimple"),
      subtitle: Silian_t("modeSimpleDesc"),
      detail: Silian_t("modeSimpleDetail"),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      {!Silian_hasConflicts && (
        <div className="relative border border-green-500/30 bg-green-500/5 px-4 py-3">
          <Silian_CornerBrackets color="border-green-500/30" />
          <div className="flex items-center gap-2">
            <span
              className="inline-block size-2 bg-green-500"
              role="img"
              title="No conflicts"
            />
            <span className="font-mono text-xs tracking-widest text-green-700 uppercase">
              {Silian_t("noConflicts")}
            </span>
          </div>
          <p className="mt-1 font-mono text-xs text-green-700/70">
            {Silian_t("allFilesClean")}
          </p>
        </div>
      )}

      <div>
        <p className="font-mono text-xs tracking-widest text-tech-main/60 uppercase">
          {Silian_t("conflictResolution")}
        </p>
        <h2 className="mt-1 font-mono text-sm tracking-widest text-tech-main uppercase">
          {Silian_t("selectMode")}
        </h2>
      </div>

      <div className="border border-tech-main/30 bg-tech-main/5 px-4 py-3">
        <p className="mb-2 mono-label tracking-widest uppercase">
          {Silian_t("analysis")}
        </p>
        <p className="font-mono text-xs/relaxed text-tech-main/80">
          {Silian_modeAnalysis.adminMessage}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="border border-tech-main/30 bg-tech-main/10 px-2 py-0.5 font-mono text-[0.6875rem] tracking-widest text-tech-main uppercase">
            {Silian_t("commitsCount", { count: Silian_modeAnalysis.commitCount })}
          </span>
          <span className="border border-tech-main/30 bg-tech-main/10 px-2 py-0.5 font-mono text-[0.6875rem] tracking-widest text-tech-main uppercase">
            {Silian_t("filesCount", { count: Silian_modeAnalysis.filesAffected })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Silian_modeCards.map(({ mode: Silian_mode, title: Silian_title, subtitle: Silian_subtitle, detail: Silian_detail }) => {
          const Silian_isSelected = Silian_selectedMode === Silian_mode
          const Silian_isRecommended = Silian_modeAnalysis.recommendation === Silian_mode

          return (
            <button
              key={Silian_mode}
              type="button"
              onClick={() => Silian_setSelectedMode(Silian_mode)}
              className={`
                group relative cursor-pointer p-4 text-left transition-all duration-200 sm:p-5
                ${
                  Silian_isSelected
                    ? "border border-tech-main bg-tech-main/10"
                    : "guide-line bg-white/70 hover:border-tech-main/50 hover:bg-white/90"
                }
              `}>
              <Silian_CornerBrackets
                color={
                  Silian_isSelected ? "border-tech-main/60" : "border-tech-main/30"
                }
              />

              {Silian_isRecommended && (
                <span className="mb-3 inline-block border border-tech-main bg-tech-main px-3 py-1 font-mono text-[0.6875rem] font-bold tracking-widest text-white uppercase">
                  {Silian_t("recommended")}
                </span>
              )}

              <p
                className={`font-mono text-sm font-bold tracking-widest uppercase ${Silian_isSelected ? "text-tech-main" : "text-tech-main/80"}`}>
                {Silian_title}
              </p>

              <p className="mt-1.5 font-mono text-xs/relaxed text-tech-main/60">
                {Silian_subtitle}
              </p>

              <p className="mt-2 font-mono text-[0.6875rem] leading-relaxed text-tech-main/40">
                {Silian_detail}
              </p>

              {Silian_isSelected && (
                <div className="mt-3 flex items-center gap-1.5">
                  <span className="inline-block size-1.5 bg-tech-main" />
                  <span className="font-mono text-[0.6875rem] tracking-widest text-tech-main uppercase">
                    {Silian_t("selected")}
                  </span>
                </div>
              )}
            </button>
          )
        })}
      </div>

      <div className="flex justify-end">
        <Silian_TechButton
          variant="primary"
          size="md"
          disabled={Silian_isSelecting}
          className="w-full"
          onClick={() => Silian_onSelectMode(Silian_selectedMode)}>
          {Silian_isSelecting
            ? Silian_homepageT("initializing")
            : `${Silian_t("resolveButton")} [${Silian_selectedMode}]`}
        </Silian_TechButton>
      </div>
    </div>
  )
}
