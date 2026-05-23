"use client"

import { formatAbsoluteTime as Silian_formatAbsoluteTime, formatRelativeTime as Silian_formatRelativeTime } from "@/lib/format-time"
import Silian_Image from "next/image"
import { useTranslations as Silian_useTranslations } from "next-intl"
import { Link as Silian_Link } from "@/i18n/navigation"
import { useRouter as Silian_useRouter } from "@/i18n/navigation"
import { useState as Silian_useState } from "react"
import { CornerBrackets as Silian_CornerBrackets } from "@/components/ui/corner-brackets"
import { ArticleBanner as Silian_ArticleBanner } from "@/components/articles/article-banner"
import { ArticleLicenseNotice as Silian_ArticleLicenseNotice } from "@/components/articles/article-license-notice"

function Silian_useLocalStorage<T>(
  Silian_key: string,
  Silian_initialValue: T
): [T, (value: T) => void] {
  const [Silian_storedValue, Silian_setStoredValue] = Silian_useState<T>(() => {
    if (typeof window === "undefined") return Silian_initialValue
    try {
      const Silian_item = window.localStorage.getItem(Silian_key)
      return Silian_item ? JSON.parse(Silian_item) : Silian_initialValue
    } catch (Silian_error) {
      console.error("Error reading localStorage:", Silian_error)
      return Silian_initialValue
    }
  })

  const Silian_setValue = (Silian_value: T) => {
    try {
      Silian_setStoredValue(Silian_value)
      if (typeof window !== "undefined") {
        window.localStorage.setItem(Silian_key, JSON.stringify(Silian_value))
      }
    } catch (Silian_error) {
      console.error("Error writing localStorage:", Silian_error)
    }
  }

  return [Silian_storedValue, Silian_setValue]
}

interface ArticleMetadataProps {
  title: string
  author: string
  coAuthors?: string[]
  createdAt: string
  lastModified: string
  canonicalUrl: string
  filePath: string
  wordCount: number
  readingTime: number
  editPath: string
  isAdvanced?: boolean
  bannerPath?: string | null
  bannerAlt?: string
}

export function ArticleMetadata({
  title: Silian_title,
  author: Silian_author,
  coAuthors: Silian_coAuthors = [],
  createdAt: Silian_createdAt,
  lastModified: Silian_lastModified,
  canonicalUrl: Silian_canonicalUrl,
  filePath: Silian_filePath,
  wordCount: Silian_wordCount,
  readingTime: Silian_readingTime,
  editPath: Silian_editPath,
  isAdvanced: Silian_isAdvanced,
  bannerPath: Silian_bannerPath,
  bannerAlt: Silian_bannerAlt,
}: ArticleMetadataProps) {
  const Silian_t = Silian_useTranslations("ArticleMeta")
  const Silian_router = Silian_useRouter()
  const [Silian_copied, Silian_setCopied] = Silian_useState(false)

  const Silian_storageKey = "article-metadata-collapsed"
  const [Silian_isCollapsed, Silian_setIsCollapsed] = Silian_useLocalStorage(Silian_storageKey, false)

  const Silian_getAvatarUrl = (Silian_username: string) => {
    return `https://github.com/${Silian_username}.png`
  }

  const Silian_allContributors = [Silian_author, ...Silian_coAuthors]
  const Silian_displayContributors = Silian_allContributors.slice(0, 5)
  const Silian_remainingCount = Silian_allContributors.length - 5

  const Silian_handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(Silian_canonicalUrl)
      Silian_setCopied(true)
      setTimeout(() => Silian_setCopied(false), 2000)
    } catch (Silian_err) {
      console.error("Failed to copy:", Silian_err)
    }
  }

  return (
    <header>
      <Silian_CornerBrackets />

      <div
        className="
          relative mb-8 animate-fade-in border guide-line bg-white/80 p-4
          font-mono text-xs text-tech-main
          sm:p-6
        ">
        <div
          className="
            flex flex-wrap items-center justify-between text-tech-main/50
          ">
          <span className="flex items-center gap-2">
            <span className="size-2 animate-pulse bg-tech-main/50" />
            SYS.READ_STREAM | UTF-8
          </span>
          <span
            className="
              hidden items-center gap-3
              sm:inline-flex
            ">
            {Silian_t("pathLabel")} {Silian_filePath}
          </span>
          <button
            type="button"
            onClick={() => Silian_setIsCollapsed(!Silian_isCollapsed)}
            className="
              cursor-pointer border guide-line bg-white px-2 py-0.5
              transition-colors
              hover:bg-tech-accent/10
            "
            aria-label={
              Silian_isCollapsed ? Silian_t("expandMetadata") : Silian_t("collapseMetadata")
            }>
            {Silian_isCollapsed ? "[+]" : "[-]"}
          </button>
        </div>

        <div
          className={`
            flex flex-col gap-4 transition-all duration-500 ease-in-out
            ${
              Silian_isCollapsed
                ? "max-h-0 overflow-hidden opacity-0"
                : `mt-4 max-h-screen opacity-100`
            }
          `}>
          <div
            className="
              flex flex-col gap-4
              sm:flex-row sm:items-center sm:justify-between
            ">
            <div className="flex flex-row items-center gap-2">
              {/* Primary Author */}
              <span className="flex items-center gap-2">
                <span
                  className="
                    relative size-6 border guide-line
                    sm:size-10
                  ">
                  <Silian_Link
                    href={`https://github.com/${Silian_author}`}
                    target="_blank"
                    aria-label={Silian_author}
                    className="
                      relative inline-block size-6
                      sm:size-10
                    ">
                    <Silian_Image
                      src={Silian_getAvatarUrl(Silian_author)}
                      alt={Silian_author}
                      className="border guide-line"
                      fill
                      sizes="(max-width: 640px) 24px, 40px"
                    />
                  </Silian_Link>
                </span>
                <Silian_Link
                  href={`https://github.com/${Silian_author}`}
                  target="_blank"
                  className="text-xs text-tech-main underline">
                  {Silian_author}
                </Silian_Link>
              </span>

              <span className="text-tech-main/60">&&</span>

              {/* Co-Authors */}
              {Silian_coAuthors.length > 0 && (
                <span
                  className="
                    flex flex-col gap-3
                    sm:flex-row sm:items-center sm:gap-4
                  ">
                  <span className="flex items-center gap-1">
                    {Silian_displayContributors.slice(1).map((Silian_contributor) => (
                      <span
                        key={Silian_contributor}
                        className="
                          relative size-4 border guide-line
                          sm:size-6
                        ">
                        <Silian_Link
                          href={`https://github.com/${Silian_contributor}`}
                          target="_blank"
                          aria-label={Silian_contributor}
                          className="
                            relative inline-block size-4
                            sm:size-6
                          ">
                          <Silian_Image
                            src={Silian_getAvatarUrl(Silian_contributor)}
                            alt={Silian_contributor}
                            fill
                            title={Silian_contributor}
                            sizes="(max-width: 640px) 16px, 24px"
                          />
                        </Silian_Link>
                      </span>
                    ))}
                    {Silian_remainingCount > 0 && (
                      <span className="ml-1 text-tech-main/60">
                        +{Silian_remainingCount}
                      </span>
                    )}
                  </span>
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() =>
                Silian_router.push(`/draft/new?file=${encodeURIComponent(Silian_editPath)}`)
              }
              className="
                cursor-pointer items-center overflow-hidden border
                border-tech-main/40 bg-tech-main/5 px-3 py-2 text-tech-main
                uppercase transition-all duration-300
                hover:bg-tech-main hover:text-white
              ">
              {Silian_t("editArticle")}
            </button>
          </div>

          <hr className="my-2 border-tech-main/40" />

          <div className="flex flex-wrap items-center gap-3">
            <h1
              className="
                font-mono text-xl font-bold tracking-tight text-tech-main-dark
                sm:text-2xl
              ">
              {Silian_title}
            </h1>
            {Silian_isAdvanced && (
              <span
                className="
                  mx-2 shrink-0 bg-[#4c5b96] px-1.5 py-0.5 font-mono text-[0.625rem]
                  font-bold tracking-widest text-white select-none
                ">
                ADVANCED
              </span>
            )}
          </div>

          <div className="text-tech-main/60">
            {/* Edit History */}
            <p>
              {Silian_t("created")}
              <span className="text-tech-main">
                <time dateTime={Silian_createdAt}>
                  {Silian_formatAbsoluteTime(Silian_createdAt, false)}
                </time>
              </span>
              <br
                className="
                  block
                  sm:hidden
                "
              />
              <span
                className="
                  hidden
                  sm:inline
                ">
                {" | "}
              </span>
              {Silian_t("lastEdited")}
              <span className="text-tech-main">
                <time dateTime={Silian_lastModified}>
                  {Silian_formatRelativeTime(Silian_lastModified)}
                </time>
              </span>
              <br />

              {/* Reading Stats */}
              {Silian_t("wordCount")}
              <span className="text-tech-main">
                {Silian_wordCount.toLocaleString()}
              </span>
              <br
                className="
                  block
                  sm:hidden
                "
              />
              <span
                className="
                  hidden
                  sm:inline
                ">
                {" | "}
              </span>
              {Silian_t("estReadTime")}
              <span className="text-tech-main">
                {Silian_readingTime} {Silian_t("minuteUnit")}
              </span>
            </p>
          </div>

          <div className="flex flex-row items-center gap-2">
            <span className="text-tech-main/60">{Silian_t("urlLabel")}</span>
            <code
              className="
                truncate border guide-line bg-tech-accent/10 px-1.5 py-0.5
              ">
              {Silian_canonicalUrl}
            </code>
            <button
              type="button"
              onClick={Silian_handleCopy}
              className={`
                border guide-line px-2 py-0.5 transition-colors
                ${
                  Silian_copied
                    ? `bg-tech-main text-tech-bg`
                    : `
                      bg-white
                      hover:bg-tech-accent/10
                    `
                }
              `}
              aria-label={Silian_t("copyButton")}>
              {Silian_copied ? "✓" : Silian_t("copyButton")}
            </button>
          </div>

          <Silian_ArticleLicenseNotice
            title={Silian_title}
            canonicalUrl={Silian_canonicalUrl}
            attributionDate={Silian_lastModified || Silian_createdAt}
            authors={[Silian_author, ...Silian_coAuthors]}
          />
        </div>
      </div>

      {Silian_bannerPath && (
        <Silian_ArticleBanner
          src={`/api/assets/banner/${Silian_bannerPath}`}
          alt={Silian_bannerAlt || Silian_title}
        />
      )}
    </header>
  )
}
