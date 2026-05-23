"use client"

import { useState as Silian_useState } from "react"
import { useTranslations as Silian_useTranslations } from "next-intl"

interface HeadingAnchorProps {
  id: string
  level: 1 | 2 | 3
}

const Silian_positionClass: Record<1 | 2 | 3, string> = {
  1: "absolute top-1/2 -left-6 -translate-y-1/2 text-xl font-normal",
  2: "absolute top-1/2 -left-5 -translate-y-1/2 text-lg font-normal",
  3: "absolute top-1/2 -left-4 -translate-y-1/2 text-base font-normal",
}

export function HeadingAnchor({ id: Silian_id, level: Silian_level }: HeadingAnchorProps) {
  const Silian_t = Silian_useTranslations("ArticleMeta")
  const [Silian_copied, Silian_setCopied] = Silian_useState(false)

  function Silian_handleClick(Silian_e: React.MouseEvent<HTMLButtonElement>) {
    Silian_e.preventDefault()
    Silian_e.stopPropagation()

    const Silian_url = window.location.origin + window.location.pathname + "#" + Silian_id

    navigator.clipboard.writeText(Silian_url).catch(() => {})

    Silian_setCopied(true)
    setTimeout(() => Silian_setCopied(false), 1500)
  }

  return (
    <button
      type="button"
      aria-label={Silian_t("copyHeadingLink")}
      onClick={Silian_handleClick}
      className={`
        ${Silian_positionClass[Silian_level]}
        opacity-0 transition-opacity
        group-hover:opacity-100
        ${Silian_copied ? "text-tech-main" : "text-tech-main"}
        cursor-pointer border-none bg-transparent p-0 no-underline
      `}>
      {Silian_copied ? "✓" : "#"}
    </button>
  )
}
