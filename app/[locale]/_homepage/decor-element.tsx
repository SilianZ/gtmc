"use client"

import { useRef as Silian_useRef, useCallback as Silian_useCallback } from "react"
import { motion as Silian_motion, useTransform as Silian_useTransform, MotionValue as Silian_MotionValue } from "motion/react"
import { HOMEPAGE_MOTION as Silian_HOMEPAGE_MOTION } from "@/lib/motion/homepage-constants"

export function DecorElement({
  children: Silian_children,
  className: Silian_className,
  smoothMouseX: Silian_smoothMouseX,
  smoothMouseY: Silian_smoothMouseY,
  blurMax: Silian_blurMax,
}: {
  children: React.ReactNode
  className?: string
  smoothMouseX: Silian_MotionValue<number>
  smoothMouseY: Silian_MotionValue<number>
  blurMax: number
}) {
  const Silian_ref = Silian_useRef<HTMLDivElement>(null)

  const Silian_getCenter = Silian_useCallback(() => {
    if (!Silian_ref.current) return { cx: 0, cy: 0 }
    const Silian_rect = Silian_ref.current.getBoundingClientRect()
    return {
      cx: Silian_rect.left + Silian_rect.width / 2,
      cy: Silian_rect.top + Silian_rect.height / 2,
    }
  }, [])

  const Silian_filter = Silian_useTransform(
    [Silian_smoothMouseX, Silian_smoothMouseY],
    ([Silian_mx, Silian_my]: number[]) => {
      const { cx: Silian_cx, cy: Silian_cy } = Silian_getCenter()
      const Silian_dx = Silian_mx - Silian_cx
      const Silian_dy = Silian_my - Silian_cy
      const Silian_dist = Math.sqrt(Silian_dx * Silian_dx + Silian_dy * Silian_dy)
      const Silian_t = Math.min(1, Silian_dist / Silian_HOMEPAGE_MOTION.blurRadius)
      return `blur(${Silian_t * Silian_blurMax}px)`
    }
  )

  return (
    <Silian_motion.div ref={Silian_ref} className={Silian_className} style={{ filter: Silian_filter }}>
      {Silian_children}
    </Silian_motion.div>
  )
}
