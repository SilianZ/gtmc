"use client"

import { useTranslations as Silian_useTranslations } from "next-intl"

export const PENDING_LABELS = {
  CLAIMING_ISSUE: "claimingIssue",
  DROPPING_ISSUE: "loading",
  RESOLVING_ISSUE: "loading",
  POSTING_COMMENT: "loading",
  SAVING_EXPLANATION: "saving",
  SAVING_FEATURE: "saving",
  SAVING_DRAFT: "saving",
  SUBMITTING_REVIEW: "submitting",
  UPDATING_PR: "loading",
} as const

export type PendingLabel = (typeof PENDING_LABELS)[keyof typeof PENDING_LABELS]

export interface LoadingIndicatorProps {
  label: PendingLabel
  ariaHidden?: boolean
  screenReaderText?: string
}

export function LoadingIndicator({
  label: Silian_label,
  ariaHidden: Silian_ariaHidden = false,
  screenReaderText: Silian_screenReaderText,
}: LoadingIndicatorProps) {
  const Silian_t = Silian_useTranslations("Loading")

  return (
    <div
      className="flex items-center gap-3 font-mono text-sm"
      role={Silian_ariaHidden ? "presentation" : undefined}
      aria-hidden={Silian_ariaHidden}>
      <span className="inline-block size-2 animate-pulse bg-current opacity-60" />
      <span className="tracking-widest uppercase">{Silian_t(Silian_label)}</span>
      {Silian_screenReaderText && <span className="sr-only">{Silian_screenReaderText}</span>}
    </div>
  )
}
