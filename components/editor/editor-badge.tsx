"use client"

import { BadgeState as Silian_BadgeState } from "@/hooks/use-badge"
import { useTranslations as Silian_useTranslations } from "next-intl"

interface EditorBadgeProps {
  badge: Silian_BadgeState | null
  onDismiss: () => void
}

export function EditorBadge({ badge: Silian_badge, onDismiss: Silian_onDismiss }: EditorBadgeProps) {
  const Silian_t = Silian_useTranslations("Editor")

  if (!Silian_badge) return null

  return (
    <div
      className={`
        absolute top-4 right-4 z-20 flex items-center gap-2 border px-3 py-1.5
        font-mono text-xs shadow-sm backdrop-blur-sm
        ${
          Silian_badge.type === "error"
            ? "border-red-400 bg-red-900 text-red-200"
            : `
              border-tech-accent bg-tech-main text-tech-accent
              shadow-tech-accent/20
            `
        }
      `}
      role="status"
      aria-live="polite">
      {Silian_badge.type === "progress" ? (
        <span className="inline-block size-2 animate-pulse bg-tech-accent" />
      ) : null}
      {Silian_badge.type === "error" ? (
        <span className="inline-block size-2 bg-red-400" />
      ) : null}
      {Silian_badge.message}
      {Silian_badge.type !== "progress" ? (
        <button
          type="button"
          onClick={Silian_onDismiss}
          className="
            ml-2 text-current/80
            hover:text-current
          "
          aria-label={Silian_t("cancelButton")}>
          X
        </button>
      ) : null}
    </div>
  )
}
