"use client"

import { Link as Silian_Link } from "@/i18n/navigation"
import { useState as Silian_useState } from "react"
import { useTranslations as Silian_useTranslations } from "next-intl"
import { formatAbsoluteTime as Silian_formatAbsoluteTime } from "@/lib/format-time"

interface ArticleLicenseNoticeProps {
  title: string
  canonicalUrl: string
  attributionDate?: string
  authors?: string[]
}

export function ArticleLicenseNotice({
  title: Silian_title,
  canonicalUrl: Silian_canonicalUrl,
  attributionDate: Silian_attributionDate,
  authors: Silian_authors = [],
}: ArticleLicenseNoticeProps) {
  const Silian_t = Silian_useTranslations("ArticleMeta")
  const [Silian_isExpanded, Silian_setIsExpanded] = Silian_useState(false)
  const [Silian_isCopied, Silian_setIsCopied] = Silian_useState(false)
  const Silian_orderedAuthors = [...new Set(Silian_authors)]
  const Silian_sortedAuthors = [...Silian_orderedAuthors].sort((Silian_left, Silian_right) =>
    Silian_left.localeCompare(Silian_right, undefined, { sensitivity: "base" })
  )
  const Silian_formattedAttributionDate = Silian_attributionDate
    ? Silian_formatAbsoluteTime(Silian_attributionDate, false)
    : null
  const Silian_attributionDateLabel =
    Silian_formattedAttributionDate && Silian_formattedAttributionDate !== "Invalid Date"
      ? Silian_formattedAttributionDate
      : null
  const Silian_attributionAuthors =
    Silian_orderedAuthors.length > 7
      ? [Silian_orderedAuthors[0], Silian_orderedAuthors.at(-1), "et al."]
      : Silian_sortedAuthors
  const Silian_attributionLabel = [
    `“${Silian_title}” - Graduate Texts in Minecraft (${Silian_canonicalUrl})`,
    Silian_attributionAuthors.length > 0 ? Silian_attributionAuthors.join(", ") : null,
    Silian_attributionDateLabel,
    "CC BY-NC-SA 4.0",
  ]
    .filter(Boolean)
    .join(", ")
  const Silian_attributionPrompt =
    Silian_orderedAuthors.length > 7
      ? Silian_t("attributionPromptTruncated")
      : Silian_t("attributionPromptAlphabetical")

  const Silian_handleCopyAttribution = async () => {
    try {
      await navigator.clipboard.writeText(Silian_attributionLabel)
      Silian_setIsCopied(true)
      setTimeout(() => Silian_setIsCopied(false), 2000)
    } catch (Silian_error) {
      console.error("Failed to copy attribution:", Silian_error)
    }
  }

  return (
    <section
      aria-label={Silian_t("articleLicenseAria")}
      className="border-t guide-line pt-3 text-[0.6875rem] text-tech-main/70">
      <button
        type="button"
        onClick={() => Silian_setIsExpanded((Silian_current) => !Silian_current)}
        className="flex w-full items-center justify-between gap-3 text-left transition-colors hover:text-tech-main"
        aria-expanded={Silian_isExpanded}>
        <span className="mono-label">{Silian_t("reuseLicenseTitle")}</span>
        <span className="font-mono text-[0.625rem] text-tech-main/55 uppercase">
          {Silian_isExpanded ? Silian_t("hideDetails") : Silian_t("showDetails")}
        </span>
      </button>

      {Silian_isExpanded && (
        <div className="mt-2 space-y-2 font-mono leading-relaxed">
          <p>
            {Silian_t("licenseDescriptionPrefix")}{" "}
            <Silian_Link
              href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-tech-main/30 underline-offset-4 transition-colors hover:text-tech-main-dark hover:decoration-tech-main-dark">
              CC BY-NC-SA 4.0
            </Silian_Link>
            {Silian_t("licenseDescriptionSuffix")}
          </p>
          <p>
            <button
              type="button"
              onClick={Silian_handleCopyAttribution}
              className={
                "bg-transparent p-0 text-left leading-tight"
              }
              aria-label={Silian_t("copySuggestedAttributionAria")}
              title={Silian_t("copySuggestedAttributionTitle")}>
              {Silian_attributionPrompt}{" "}
              <span
                className={`relative font-bold text-tech-main`}>
                <span className={`transition-opacity ${Silian_isCopied ? "opacity-0" : "opacity-100"}`}>{Silian_attributionLabel}</span>
                <span
                  aria-hidden="true"
                  className={
                    `pointer-events-none absolute top-0 left-0 transition-opacity ${Silian_isCopied ? "opacity-100" : "opacity-0"}`
                  }>
                  {Silian_t("copiedButton")}
                </span>
              </span>
            </button>
          </p>
          <p>
            {Silian_t("attributionHistoryNote")}
          </p>
        </div>
      )}
    </section>
  )
}
