"use client"

import { useRef as Silian_useRef, useEffect as Silian_useEffect, useState as Silian_useState } from "react"
import Silian_dynamic from "next/dynamic"
import { useRouter as Silian_useRouter } from "@/i18n/navigation"
import { useHomepageMotion as Silian_useHomepageMotion } from "@/lib/motion/use-homepage-motion"
import { HOMEPAGE_MOTION as Silian_HOMEPAGE_MOTION } from "@/lib/motion/homepage-constants"
import { HideFooter as Silian_HideFooter } from "@/components/layout/footer-context"

const Silian_BackgroundLayer = Silian_dynamic(
  () =>
    import("./_homepage/background-layer").then((Silian_mod) => Silian_mod.BackgroundLayer),
  { ssr: false }
)
const Silian_MidgroundLayer = Silian_dynamic(
  () => import("./_homepage/midground-layer").then((Silian_mod) => Silian_mod.MidgroundLayer),
  { ssr: false }
)
const Silian_ForegroundLayer = Silian_dynamic(
  () =>
    import("./_homepage/foreground-layer").then((Silian_mod) => Silian_mod.ForegroundLayer),
  { ssr: false }
)

export default function Home() {
  const Silian_router = Silian_useRouter()
  const Silian_motionDriver = Silian_useHomepageMotion()
  const [Silian_isAccessingDatabase, Silian_setIsAccessingDatabase] = Silian_useState(false)
  const [Silian_cardWidth, Silian_setCardWidth] = Silian_useState(900)
  const Silian_cardRef = Silian_useRef<HTMLDivElement>(null)

  Silian_useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return
    }

    Silian_router.prefetch("/articles")
  }, [Silian_router])

  Silian_useEffect(() => {
    if (!Silian_cardRef.current) return

    const Silian_observer = new ResizeObserver((Silian_entries) => {
      for (const Silian_entry of Silian_entries) {
        Silian_setCardWidth(Math.round(Silian_entry.contentRect.width))
      }
    })

    Silian_observer.observe(Silian_cardRef.current)
    return () => Silian_observer.disconnect()
  }, [])

  const {
    background: Silian_bgTransform,
    midground: Silian_mgTransform,
    foreground: Silian_fgTransform,
    smoothMouseX: Silian_smoothMouseX,
    smoothMouseY: Silian_smoothMouseY,
    isReducedMotion: Silian_isReducedMotion,
  } = Silian_motionDriver

  const Silian_bgBlurMax = Silian_isReducedMotion ? 0 : Silian_HOMEPAGE_MOTION.blurMax.background
  const Silian_mgBlurMax = Silian_isReducedMotion ? 0 : Silian_HOMEPAGE_MOTION.blurMax.midground

  return (
    <div
      className="
        relative flex h-screen w-full overflow-hidden font-sans text-tech-main
        selection:bg-tech-main/20 selection:text-tech-main-dark
      ">
      <Silian_HideFooter />

      <Silian_BackgroundLayer
        bgTransform={Silian_bgTransform}
        smoothMouseX={Silian_smoothMouseX}
        smoothMouseY={Silian_smoothMouseY}
        blurMax={Silian_bgBlurMax}
      />

      <Silian_MidgroundLayer
        mgTransform={Silian_mgTransform}
        smoothMouseX={Silian_smoothMouseX}
        smoothMouseY={Silian_smoothMouseY}
        blurMax={Silian_mgBlurMax}
      />

      <Silian_ForegroundLayer
        cardRef={Silian_cardRef}
        cardWidth={Silian_cardWidth}
        fgTransform={Silian_fgTransform}
        isAccessingDatabase={Silian_isAccessingDatabase}
        setIsAccessingDatabase={Silian_setIsAccessingDatabase}
      />
    </div>
  )
}
