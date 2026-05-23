import { getTranslations as Silian_getTranslations } from "next-intl/server"
import { Link as Silian_Link } from "@/i18n/navigation"
import { articleUrl as Silian_articleUrl } from "@/lib/article-url"
import { CornerBrackets as Silian_CornerBrackets } from "./ui/corner-brackets"

interface ArticleInfo {
  slug: string
  title: string
  isCrossFolder: boolean
  chapterTitle?: string
}

interface ArticleNavigationProps {
  prev: ArticleInfo | null
  next: ArticleInfo | null
}

export async function ArticleNavigation({
  prev: Silian_prev,
  next: Silian_next,
}: ArticleNavigationProps) {
  const Silian_t = await Silian_getTranslations("ArticleMeta")

  return (
    <nav className="relative mt-12 border-t guide-line pt-8">
      <Silian_CornerBrackets size="size-3" color="border-tech-main/30" />

      <div
        className="
          grid grid-cols-1 gap-4
          md:grid-cols-2 md:gap-6
        ">
        {Silian_prev ? (
          <Silian_Link
            href={Silian_articleUrl(Silian_prev.slug)}
            className="
              group relative flex min-h-[44px] w-full flex-col gap-2 border
              border-tech-main/40 bg-tech-bg p-4 transition-colors
              hover:border-tech-main hover:bg-tech-accent/10
            ">
            <div
              className="
                flex items-center gap-2 font-mono text-xs text-tech-main/60
              ">
              <span>←</span>
              <span>{Silian_t("prev")}</span>
              {Silian_prev.isCrossFolder && (
                <span
                  className="
                    rounded-sm border border-tech-main/40 px-1.5 py-0.5
                    text-[0.625rem]
                  ">
                  ↗
                </span>
              )}
              {Silian_prev.isCrossFolder && Silian_prev.chapterTitle && (
                <span className="text-tech-main/40">{Silian_prev.chapterTitle}</span>
              )}
            </div>
            <div className="line-clamp-2 font-mono text-sm text-tech-main">
              {Silian_prev.title}
            </div>
          </Silian_Link>
        ) : (
          <div
            className="
              pointer-events-none flex min-h-[44px] w-full flex-col gap-2 border
              guide-line bg-tech-bg p-4 opacity-50
            ">
            <div
              className="
                flex items-center gap-2 font-mono text-xs text-tech-main/40
              ">
              <span>←</span>
              <span>{Silian_t("prev")}</span>
            </div>
            <div className="font-mono text-sm text-tech-main/40">
              {Silian_t("noPrevArticle")}
            </div>
          </div>
        )}

        {Silian_next ? (
          <Silian_Link
            href={Silian_articleUrl(Silian_next.slug)}
            className="
              group relative flex min-h-[44px] w-full flex-col gap-2 border
              border-tech-main/40 bg-tech-bg p-4 transition-colors
              hover:border-tech-main hover:bg-tech-accent/10
              md:items-end md:text-right
            ">
            <div
              className="
                flex items-center gap-2 font-mono text-xs text-tech-main/60
              ">
              {Silian_next.isCrossFolder && (
                <span
                  className="
                    rounded-sm border border-tech-main/40 px-1.5 py-0.5
                    text-[0.625rem]
                  ">
                  ↗
                </span>
              )}
              <span>{Silian_t("next")}</span>
              <span>→</span>
              {Silian_next.isCrossFolder && Silian_next.chapterTitle && (
                <span className="text-tech-main/40">{Silian_next.chapterTitle}</span>
              )}
            </div>
            <div className="line-clamp-2 font-mono text-sm text-tech-main">
              {Silian_next.title}
            </div>
          </Silian_Link>
        ) : (
          <div
            className="
              pointer-events-none flex min-h-[44px] w-full flex-col gap-2 border
              guide-line bg-tech-bg p-4 opacity-50
              md:items-end md:text-right
            ">
            <div
              className="
                flex items-center gap-2 font-mono text-xs text-tech-main/40
              ">
              <span>{Silian_t("next")}</span>
              <span>→</span>
            </div>
            <div className="font-mono text-sm text-tech-main/40">
              {Silian_t("noNextArticle")}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
