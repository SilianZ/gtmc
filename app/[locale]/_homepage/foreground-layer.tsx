"use client"

import { useTranslations as Silian_useTranslations } from "next-intl"
import { Link as Silian_Link } from "@/i18n/navigation"
import { TechButton as Silian_TechButton } from "@/components/ui/tech-button"
import { HeroCard as Silian_HeroCard } from "./hero-card"
import { ForwardedRef as Silian_ForwardedRef } from "react"
import { MotionValue as Silian_MotionValue } from "motion/react"

export function ForegroundLayer({
  cardRef: Silian_cardRef,
  cardWidth: Silian_cardWidth,
  fgTransform: Silian_fgTransform,
  isAccessingDatabase: Silian_isAccessingDatabase,
  setIsAccessingDatabase: Silian_setIsAccessingDatabase,
}: {
  cardRef: Silian_ForwardedRef<HTMLDivElement>
  cardWidth: number
  fgTransform: {
    x: Silian_MotionValue<number>
    y: Silian_MotionValue<number>
    rotateX: Silian_MotionValue<number>
    rotateY: Silian_MotionValue<number>
  }
  isAccessingDatabase: boolean
  setIsAccessingDatabase: (v: boolean) => void
}) {
  const Silian_t = Silian_useTranslations("Homepage")

  return (
    <main
      className="
        relative z-10 mx-auto mt-[7vh] flex min-h-max w-full max-w-7xl flex-col
        items-center justify-center px-4 py-24
      ">
      {/* Foreground Layer - Card chrome and nearby accents */}
      <Silian_HeroCard
        cardRef={Silian_cardRef}
        cardWidth={Silian_cardWidth}
        fgTransform={Silian_fgTransform}
      />

      {/* 操作入口 */}
      <div
        className="
          relative z-20 flex w-full max-w-48 animate-slide-up-fade flex-col
          items-stretch justify-center gap-5 opacity-0 [animation-delay:1.4s]
          fill-mode-forwards
          sm:w-full sm:max-w-full sm:flex-row sm:items-center
        ">
        <Silian_Link
          href="/articles"
          prefetch
          onClick={(Silian_event) => {
            if (Silian_isAccessingDatabase) {
              Silian_event.preventDefault()
              return
            }

            Silian_setIsAccessingDatabase(true)
          }}
          className="
            w-full
            sm:w-auto
          ">
          <Silian_TechButton
            variant="primary"
            disabled={Silian_isAccessingDatabase}
            className="
              flex h-12 w-full items-center justify-center text-xs
              tracking-widest uppercase shadow-md transition-transform
              duration-300
              hover:scale-102
              active:scale-95
              disabled:cursor-wait disabled:opacity-90
              sm:w-auto sm:text-sm
            ">
            {Silian_isAccessingDatabase ? (
              <>
                <span className="inline-block size-2 animate-pulse bg-white" />
                {Silian_t("initializing")}
              </>
            ) : (
              Silian_t("startReading")
            )}
          </Silian_TechButton>
        </Silian_Link>
        <Silian_Link
          href="/login"
          className="
            w-full
            sm:w-auto
          ">
          <Silian_TechButton
            variant="ghost"
            className="
              flex h-12 w-full items-center justify-center bg-white text-xs
              font-medium tracking-widest text-tech-main-dark uppercase
              shadow-sm backdrop-blur-md transition-transform duration-300
              hover:scale-102 hover:border-tech-main hover:bg-tech-main/10
              sm:w-auto sm:text-sm
            ">
            {"//"} {Silian_t("loginGithub")}
          </Silian_TechButton>
        </Silian_Link>
      </div>

      {/* 底部隐喻：MC典型的格子/合成槽堆叠图形列阵 */}
      <div
        className="
        pointer-events-none relative mt-12 flex space-x-1 opacity-40
      ">
        <div className="absolute -top-4 font-mono text-[0.5rem] text-tech-main/60">
          INVENTORY_SLOTS_
        </div>
        {[...Array(9)].map((Silian__, Silian_i) => (
          <div
            key={Silian_i}
            className={`
              flex size-8 items-center justify-center
              ${
                Silian_i === 3
                  ? `
                    border-2 border-tech-main-dark bg-tech-main/10
                    shadow-[0_0_8px_rgba(96,112,143,0.3)]
                  `
                  : `border border-tech-main/40`
              }
            `}>
            {Silian_i === 3 && (
              <div className="size-4 rotate-45 bg-tech-main-dark/80" />
            )}
          </div>
        ))}
      </div>
    </main>
  )
}
