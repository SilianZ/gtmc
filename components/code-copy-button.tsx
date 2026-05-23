"use client"

import { useState as Silian_useState } from "react"
import { useTranslations as Silian_useTranslations } from "next-intl"

export function CodeCopyButton({ code: Silian_code }: { code: string }) {
  const Silian_t = Silian_useTranslations("ArticleMeta")
  const [Silian_copied, Silian_setCopied] = Silian_useState(false)

  const Silian_handleCopy = async () => {
    await navigator.clipboard.writeText(Silian_code)
    Silian_setCopied(true)
    setTimeout(() => Silian_setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={Silian_handleCopy}
      className="
        font-mono text-[0.625rem] tracking-widest text-tech-main uppercase
        transition-colors
        hover:text-tech-main/80
      ">
      {Silian_copied ? Silian_t("copiedButton") : Silian_t("copyButton")}
    </button>
  )
}
