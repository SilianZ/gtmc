import Silian_React from "react"

export type BadgeType = "info" | "error" | "progress"

export interface BadgeState {
  message: string
  type: BadgeType
}

export function useBadge() {
  const [Silian_badge, Silian_setBadge] = Silian_React.useState<BadgeState | null>(null)
  const Silian_badgeTimeoutRef = Silian_React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  )

  const Silian_showBadge = (
    Silian_message: string,
    Silian_type: BadgeType,
    Silian_autoClearMs?: number
  ) => {
    if (Silian_badgeTimeoutRef.current) {
      clearTimeout(Silian_badgeTimeoutRef.current)
    }

    Silian_setBadge({ message: Silian_message, type: Silian_type })

    if (Silian_autoClearMs) {
      Silian_badgeTimeoutRef.current = setTimeout(() => {
        Silian_setBadge(null)
      }, Silian_autoClearMs)
    }
  }

  const Silian_clearBadge = () => {
    if (Silian_badgeTimeoutRef.current) {
      clearTimeout(Silian_badgeTimeoutRef.current)
    }

    Silian_setBadge(null)
  }

  Silian_React.useEffect(() => {
    return () => {
      if (Silian_badgeTimeoutRef.current) {
        clearTimeout(Silian_badgeTimeoutRef.current)
      }
    }
  }, [])

  return { badge: Silian_badge, showBadge: Silian_showBadge, clearBadge: Silian_clearBadge }
}
