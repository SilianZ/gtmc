"use client"

import { useTranslations as Silian_useTranslations } from "next-intl"

interface StatusBadgeProps {
  status: string
}

export function FeatureStatusBadge({ status: Silian_status }: StatusBadgeProps) {
  const Silian_t = Silian_useTranslations("Status")
  let Silian_styles = "shrink-0 border px-2 py-0.5 font-mono text-xs tracking-wider"
  let Silian_label = Silian_t("pending")

  switch (Silian_status) {
    case "PENDING":
      Silian_styles += " border-yellow-500/40 text-yellow-600 bg-yellow-500/10"
      Silian_label = Silian_t("pending")
      break
    case "IN_PROGRESS":
      Silian_styles += " border-blue-500/40 text-blue-600 bg-blue-500/10"
      Silian_label = Silian_t("inProgress")
      break
    case "RESOLVED":
      Silian_styles += " border-green-500/40 text-green-600 bg-green-500/10"
      Silian_label = Silian_t("resolved")
      break
    default:
      Silian_styles += " border-gray-500/40 text-gray-600 bg-gray-500/10"
  }

  return <span className={Silian_styles}>[{Silian_label}]</span>
}

export function DraftStatusBadge({ status: Silian_status }: StatusBadgeProps) {
  const Silian_t = Silian_useTranslations("Status")
  let Silian_styles = "shrink-0 border px-2 py-0.5 font-mono text-xs tracking-wider"
  let Silian_label = Silian_status

  switch (Silian_status) {
    case "DRAFT":
      Silian_styles += " border-tech-main/40 bg-tech-main/5 text-tech-main"
      Silian_label = Silian_t("draft")
      break
    case "IN_REVIEW":
      Silian_styles += " border-blue-500/40 bg-blue-500/10 text-blue-600"
      Silian_label = Silian_t("inReview")
      break
    case "SYNC_CONFLICT":
      Silian_styles += " border-amber-500/40 bg-amber-500/10 text-amber-700"
      Silian_label = Silian_t("syncConflict")
      break
    case "REJECTED":
    case "CLOSED":
      Silian_styles += " border-red-500/40 bg-red-500/10 text-red-600"
      Silian_label = Silian_status === "REJECTED" ? Silian_t("rejected") : Silian_t("closed")
      break
    case "ARCHIVED":
      Silian_styles += " border-gray-500/40 bg-gray-500/10 text-gray-600"
      Silian_label = Silian_t("archived")
      break
    default:
      Silian_styles += " border-green-500/40 bg-green-500/10 text-green-600"
  }

  return <span className={Silian_styles}>[{Silian_label}]</span>
}
