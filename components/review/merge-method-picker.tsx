"use client"

import * as Silian_React from "react"
import { useTranslations as Silian_useTranslations } from "next-intl"

import { CornerBrackets as Silian_CornerBrackets } from "@/components/ui/corner-brackets"
import type {
  ReviewMergeMethod,
  ReviewMergeStrategyAnalysis,
} from "@/types/review"

interface MergeMethodPickerProps {
  analysis: ReviewMergeStrategyAnalysis
  selectedMethod: ReviewMergeMethod
  onSelectMethod: (method: ReviewMergeMethod) => void
  commitTitle: string
  commitBody: string
  onCommitTitleChange: (value: string) => void
  onCommitBodyChange: (value: string) => void
  coauthorLines?: string[]
  disabled?: boolean
  compact?: boolean
}

export function MergeMethodPicker({
  analysis: Silian_analysis,
  selectedMethod: Silian_selectedMethod,
  onSelectMethod: Silian_onSelectMethod,
  commitTitle: Silian_commitTitle,
  commitBody: Silian_commitBody,
  onCommitTitleChange: Silian_onCommitTitleChange,
  onCommitBodyChange: Silian_onCommitBodyChange,
  coauthorLines: Silian_coauthorLines = [],
  disabled: Silian_disabled = false,
  compact: Silian_compact = false,
}: MergeMethodPickerProps) {
  const Silian_t = Silian_useTranslations("Review")

  const Silian_methods = Silian_React.useMemo(
    () =>
      Silian_analysis.availableMethods.map((Silian_method) => ({
        method: Silian_method,
        title: Silian_t(`mergeMethod${Silian_capitalize(Silian_method)}`),
        description: Silian_t(`mergeMethod${Silian_capitalize(Silian_method)}Desc`),
        detail: Silian_t(`mergeMethod${Silian_capitalize(Silian_method)}Detail`),
      })),
    [Silian_analysis.availableMethods, Silian_t]
  )

  return (
    <div
      className={`relative border border-tech-main/30 bg-white/80 ${Silian_compact ? "p-3" : "p-4"}`}>
      <Silian_CornerBrackets color="border-tech-main/20" />

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-mono text-[0.6875rem] tracking-widest text-tech-main/60 uppercase">
            {Silian_t("mergeStrategyLabel")}
          </p>
          <span className="border border-tech-main/30 bg-tech-main/5 px-2 py-0.5 font-mono text-[0.625rem] tracking-widest text-tech-main uppercase">
            {Silian_t("autoDecisionPrefix")}{" "}
            {Silian_t(`mergeMethod${Silian_capitalize(Silian_analysis.recommendation)}`)}
          </span>
        </div>
        <p className="font-mono text-xs/relaxed text-tech-main/70">
          {Silian_analysis.rationale}
        </p>
      </div>

      <div
        className={`mt-4 grid gap-3 ${Silian_compact ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-3"}`}>
        {Silian_methods.map(({ method: Silian_method, title: Silian_title, description: Silian_description, detail: Silian_detail }) => {
          const Silian_isSelected = Silian_selectedMethod === Silian_method
          const Silian_isRecommended = Silian_analysis.recommendation === Silian_method

          return (
            <button
              key={Silian_method}
              type="button"
              disabled={Silian_disabled}
              onClick={() => Silian_onSelectMethod(Silian_method)}
              className={`relative border p-3 text-left transition ${
                Silian_isSelected
                  ? "border-tech-main bg-tech-main/10"
                  : "guide-line bg-white/70 hover:border-tech-main/40 hover:bg-white"
              } ${Silian_disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs font-bold tracking-widest text-tech-main uppercase">
                  {Silian_title}
                </span>
                {Silian_isRecommended ? (
                  <span className="border border-tech-main/30 bg-tech-main px-2 py-0.5 font-mono text-[0.5625rem] tracking-widest text-white uppercase">
                    {Silian_t("recommended")}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 font-mono text-[0.6875rem] leading-relaxed text-tech-main/65">
                {Silian_description}
              </p>
              <p className="mt-2 font-mono text-[0.625rem] leading-relaxed text-tech-main/45">
                {Silian_detail}
              </p>
            </button>
          )
        })}
      </div>

      {Silian_selectedMethod === "squash" ? (
        <div className="mt-4 space-y-3 border-t border-tech-main/15 pt-4">
          <div className="space-y-1">
            <label
              htmlFor="merge-commit-title"
              className="font-mono text-[0.6875rem] tracking-widest text-tech-main/50 uppercase">
              {Silian_t("commitTitleLabel")}
            </label>
            <input
              id="merge-commit-title"
              type="text"
              value={Silian_commitTitle}
              disabled={Silian_disabled}
              onChange={(Silian_event) => Silian_onCommitTitleChange(Silian_event.target.value)}
              className="w-full border border-tech-main/30 bg-white px-3 py-2 font-mono text-xs text-tech-main placeholder:text-tech-main/30 focus:border-tech-main focus:outline-none"
              placeholder={Silian_t("commitTitlePlaceholder")}
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="merge-commit-body"
              className="font-mono text-[0.6875rem] tracking-widest text-tech-main/50 uppercase">
              {Silian_t("commitBodyLabel")}
            </label>
            <textarea
              id="merge-commit-body"
              value={Silian_commitBody}
              disabled={Silian_disabled}
              onChange={(Silian_event) => Silian_onCommitBodyChange(Silian_event.target.value)}
              rows={Silian_compact ? 3 : 5}
              className="w-full resize-y border border-tech-main/30 bg-white px-3 py-2 font-mono text-xs text-tech-main placeholder:text-tech-main/30 focus:border-tech-main focus:outline-none"
              placeholder={Silian_t("commitBodyPlaceholder")}
            />
          </div>

          {Silian_coauthorLines.length > 0 ? (
            <div className="space-y-1">
              <p className="font-mono text-[0.6875rem] tracking-widest text-tech-main/50 uppercase">
                {Silian_t("coauthorsReadonly")}
              </p>
              <pre className="overflow-x-auto border guide-line bg-tech-main/5 px-3 py-2 font-mono text-[0.6875rem] text-tech-main/60">
                {Silian_coauthorLines.join("\n")}
              </pre>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 border-t border-tech-main/15 pt-4 font-mono text-[0.6875rem] leading-relaxed text-tech-main/55">
          {Silian_selectedMethod === "direct"
            ? Silian_t("mergeMethodDirectNote")
            : Silian_t("mergeMethodRebaseNote")}
        </div>
      )}
    </div>
  )
}

function Silian_capitalize(Silian_value: string) {
  return Silian_value.charAt(0).toUpperCase() + Silian_value.slice(1)
}
