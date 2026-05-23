import Silian_path from "path"
import { Suspense as Silian_Suspense } from "react"
import "katex/dist/katex.min.css"
import type { Metadata } from "next"
import { notFound as Silian_notFound, redirect as Silian_redirect } from "next/navigation"
import { getTranslations as Silian_getTranslations } from "next-intl/server"
import Silian_matter from "gray-matter"
import {
  calculateReadingMetrics as Silian_calculateReadingMetrics,
  generateDescription as Silian_generateDescription,
  MarkdownRenderer as Silian_MarkdownRenderer,
} from "@/lib/markdown"
import { getCachedRehypeShiki as Silian_getCachedRehypeShiki } from "@/lib/markdown/plugins/rehype-shiki"
import {
  getArticleContent as Silian_getArticleContent,
  getArticleTree as Silian_getArticleTree,
  getLocalizedSlugMapEntry as Silian_getLocalizedSlugMapEntry,
  type ArticleLocale,
} from "@/lib/article-loader"
import {
  resolveSlug as Silian_resolveSlug,
  getSlugForFilePath as Silian_getSlugForFilePath,
} from "@/lib/slug-resolver"
import { decodeSlugPath as Silian_decodeSlugPath, encodeSlug as Silian_encodeSlug } from "@/lib/slug-utils"
import { formatIndexPrefix as Silian_formatIndexPrefix } from "@/lib/index-formatter"
import { getSiteUrl as Silian_getSiteUrl } from "@/lib/site-url"
import { articleAbsoluteUrl as Silian_articleAbsoluteUrl } from "@/lib/article-url"
import { CornerBrackets as Silian_CornerBrackets } from "@/components/ui/corner-brackets"
import { ArticleHighlight as Silian_ArticleHighlight } from "@/components/articles/article-highlight"
import { ArticleMetadata as Silian_ArticleMetadata } from "@/components/articles/article-metadata"
import { ArticleMetadataSimple as Silian_ArticleMetadataSimple } from "@/components/articles/article-metadata-simple"
import { ArticleNavigation as Silian_ArticleNavigation } from "@/components/article-navigation"
import {
  flattenArticleTree as Silian_flattenArticleTree,
  getArticleNavigation as Silian_getArticleNavigation,
  getFirstArticleInChapter as Silian_getFirstArticleInChapter,
} from "@/lib/article-navigation"
import { getSidebarTree as Silian_getSidebarTree } from "@/actions/sidebar"
import type { ArticleTreeNode as BaseArticleTreeNode } from "@/lib/github/sync"

export const revalidate = 3600

export async function generateStaticParams(): Promise<{ slug: string[] }[]> {
  const Silian_tree = await Silian_getArticleTree()

  const Silian_collectArticleSlugs = (Silian_nodes: ArticleTreeNode[]): string[] => {
    const Silian_slugs: string[] = []

    for (const Silian_node of Silian_nodes) {
      if (!Silian_node.isFolder) {
        Silian_slugs.push(Silian_node.slug)
      }

      if (Silian_node.children && Silian_node.children.length > 0) {
        Silian_slugs.push(...Silian_collectArticleSlugs(Silian_node.children))
      }
    }

    return Silian_slugs
  }

  return Silian_collectArticleSlugs(Silian_tree).map((Silian_slug) => ({
    slug: Silian_slug.split("/").filter(Boolean),
  }))
}

interface ArticlePageProps {
  params: Promise<{
    locale: string
    slug?: string[]
  }>
}

export async function generateMetadata({
  params: Silian_params,
}: ArticlePageProps): Promise<Metadata> {
  const { locale: Silian_rawLocale, slug: Silian_slug } = await Silian_params
  const Silian_locale = Silian_resolveLocale(Silian_rawLocale)
  const Silian_slugPath = Silian_decodeSlugPath(Silian_slug ?? []) || "preface"
  const Silian_target = await Silian_resolveArticleTarget(Silian_slugPath, Silian_locale)
  const Silian_t = await Silian_getTranslations("Article")

  if (Silian_target === null) {
    return {
      title: Silian_t("notFound"),
      description: "The requested article could not be found.",
    }
  }

  try {
    const Silian_content = await Silian_getArticleContent(Silian_target.filePath)
    if (Silian_content === null) {
      return {
        title: Silian_t("notFound"),
        description: "The requested article could not be found.",
      }
    }

    const { data: Silian_data } = Silian_matter(Silian_content)
    const Silian_siteUrl = Silian_getSiteUrl()
    const Silian_effectiveSlug =
      Silian_target.canonicalSlug ?? Silian_getSlugForFilePath(Silian_target.filePath) ?? Silian_slugPath
    const Silian_canonicalUrl = Silian_articleAbsoluteUrl(Silian_effectiveSlug)

    const Silian_resolvedTitle = Silian_resolveDisplayedArticleTitle(
      Silian_data["chapter-title"],
      Silian_target.filePath,
      Silian_target.canonicalSlug,
      Silian_target.isReadmeIntro,
      Silian_locale
    )
    const Silian_articleTitle = Silian_formatArticleTitle(
      Silian_resolvedTitle,
      Silian_target.index,
      Silian_target.isAppendix,
      Silian_target.isPreface,
      Silian_target.isReadmeIntro
    )

    // Build page title with chapter prefix if available
    const Silian_slugMapEntry = Silian_getLocalizedSlugMapEntry(Silian_effectiveSlug, Silian_locale)
    const Silian_chapterTitle = Silian_slugMapEntry?.chapterTitle
    const Silian_pageTitle = Silian_chapterTitle
      ? `${Silian_chapterTitle} › ${Silian_articleTitle} — Graduate Texts in Minecraft`
      : `${Silian_articleTitle} — Graduate Texts in Minecraft`

    const Silian_description = Silian_generateDescription(
      Silian_content,
      Silian_data.description as string | undefined
    )

    const Silian_ogImageUrl = `${Silian_siteUrl}/api/og/articles/${Silian_effectiveSlug}`

    return {
      title: Silian_pageTitle,
      description: Silian_description,
      alternates: {
        canonical: Silian_canonicalUrl,
        languages: {
          "zh": `${Silian_getSiteUrl()}/zh/articles/${Silian_encodeSlug(Silian_effectiveSlug)}`,
          "en": `${Silian_getSiteUrl()}/en/articles/${Silian_encodeSlug(Silian_effectiveSlug)}`,
          "x-default": `${Silian_getSiteUrl()}/zh/articles/${Silian_encodeSlug(Silian_effectiveSlug)}`,
        },
      },
      openGraph: {
        title: Silian_pageTitle,
        description: Silian_description,
        type: "article",
        url: Silian_canonicalUrl,
        images: [{ url: Silian_ogImageUrl, width: 1200, height: 630, alt: Silian_pageTitle }],
      },
      twitter: {
        card: "summary_large_image",
        title: Silian_pageTitle,
        description: Silian_description,
        images: [Silian_ogImageUrl],
      },
    }
  } catch {
    return {
      title: Silian_t("notFound"),
      description: "The requested article could not be found.",
    }
  }
}

export default async function ArticlePage({ params: Silian_params }: ArticlePageProps) {
  const { locale: Silian_rawLocale, slug: Silian_slug } = await Silian_params
  const Silian_locale = Silian_resolveLocale(Silian_rawLocale)

  const Silian_slugPath = Silian_decodeSlugPath(Silian_slug ?? []) || "preface"
  const Silian_target = await Silian_resolveArticleTarget(Silian_slugPath, Silian_locale)

  if (Silian_target === null) {
    Silian_notFound()
  }

  if (Silian_target.redirectToSlug) {
    const Silian_redirectPath = Silian_encodeSlug(Silian_target.redirectToSlug)
    Silian_redirect(`/${Silian_locale}/articles/${Silian_redirectPath}`)
  }

  const Silian_content = await Silian_getArticleContent(Silian_target.filePath)

  if (Silian_content === null) {
    Silian_notFound()
  }

  const { data: Silian_data, content: Silian_renderedContent } = Silian_matter(Silian_content)
  const Silian_resolvedTitle = Silian_resolveDisplayedArticleTitle(
    Silian_data["chapter-title"],
    Silian_target.filePath,
    Silian_target.canonicalSlug,
    Silian_target.isReadmeIntro,
    Silian_locale
  )
  const Silian_articleTitle = Silian_formatArticleTitle(
    Silian_resolvedTitle,
    Silian_target.index,
    Silian_target.isAppendix,
    Silian_target.isPreface,
    Silian_target.isReadmeIntro
  )
  const Silian_embeddedArticleContent = Silian_embedTitleInMarkdown(
    Silian_renderedContent,
    Silian_articleTitle
  )

  const Silian_editPath = Silian_normalizeDraftTargetPath(Silian_target.filePath)

  const { wordCount: Silian_wordCount, readingTime: Silian_readingTime } = Silian_calculateReadingMetrics(Silian_content)
  const Silian_shikiPlugin = await Silian_getCachedRehypeShiki(Silian_content)

  const Silian_siteUrl = Silian_getSiteUrl()
  const Silian_effectiveSlug =
    Silian_target.canonicalSlug ?? Silian_getSlugForFilePath(Silian_target.filePath) ?? Silian_slugPath
  const Silian_canonicalUrl = Silian_articleAbsoluteUrl(Silian_effectiveSlug)
  const Silian_description = Silian_generateDescription(
    Silian_content,
    Silian_data.description as string | undefined
  )

  const Silian_author = Silian_data.author as string | undefined
  const Silian_coAuthors = (Silian_data["co-authors"] as string[] | undefined) || []
  const Silian_createdAt = Silian_data.date as string | undefined
  const Silian_lastModified = Silian_data.lastmod as string | undefined
  const Silian_isAdvanced = Silian_data["is-advanced"] === true

  const Silian_allAuthors = [
    ...new Set([Silian_author, ...Silian_coAuthors].filter(Boolean) as string[]),
  ]
  const Silian_authorArray = Silian_allAuthors.map((Silian_name) => ({
    "@type": "Person" as const,
    name: Silian_name,
    url: `https://github.com/${Silian_name}`,
  }))

  const Silian_slugMapEntry = Silian_getLocalizedSlugMapEntry(Silian_effectiveSlug, Silian_locale)
  const Silian_chapterTitle = Silian_slugMapEntry?.chapterTitle

  const Silian_bannerSrc = (Silian_data.banner as { src?: string } | undefined)?.src
  const Silian_bannerUrl = Silian_resolveBannerUrl(Silian_bannerSrc, Silian_target.filePath, Silian_siteUrl)
  const Silian_bannerPath = Silian_resolveBannerPath(Silian_bannerSrc, Silian_target.filePath)
  const Silian_bannerAlt =
    (Silian_data.banner as { alt?: string } | undefined)?.alt || Silian_articleTitle

  const Silian_techArticleJsonLd: {
    "@context": "https://schema.org"
    "@type": "TechArticle"
    headline: string
    url: string
    datePublished?: string
    dateModified?: string
    author?: Array<{
      "@type": "Person"
      name: string
      url: string
    }>
    description: string
    wordCount: number
    timeRequired: string
    articleSection?: string
    proficiencyLevel: string
    image?: string
  } = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: Silian_articleTitle,
    url: Silian_canonicalUrl,
    ...(Silian_createdAt ? { datePublished: Silian_createdAt } : {}),
    ...(Silian_lastModified ? { dateModified: Silian_lastModified } : {}),
    ...(Silian_authorArray.length > 0 ? { author: Silian_authorArray } : {}),
    description: Silian_description,
    wordCount: Silian_wordCount,
    timeRequired: `PT${Silian_readingTime}M`,
    ...(Silian_chapterTitle ? { articleSection: Silian_chapterTitle } : {}),
    proficiencyLevel: Silian_isAdvanced ? "Expert" : "Beginner",
    ...(Silian_bannerUrl ? { image: Silian_bannerUrl } : {}),
  }

  const Silian_breadcrumbJsonLd: {
    "@context": "https://schema.org"
    "@type": "BreadcrumbList"
    itemListElement: Array<{
      "@type": "ListItem"
      position: number
      name: string
      item: string
    }>
  } = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: Silian_siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: Silian_chapterTitle || "Articles",
        item: `${Silian_siteUrl}/articles`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: Silian_articleTitle,
        item: Silian_canonicalUrl,
      },
    ],
  }

  // Get navigation data
  const Silian_tree = await Silian_getSidebarTree(Silian_locale)
  const Silian_flattenedArticles = Silian_flattenArticleTree(Silian_tree)
  const Silian_currentSlug = Silian_target.canonicalSlug || Silian_slugPath
  const Silian_navigation = Silian_getArticleNavigation(Silian_currentSlug, Silian_flattenedArticles, Silian_locale)

  return (
    <div
      className="
        relative min-h-screen border border-tech-main/40 bg-transparent
        p-6 backdrop-blur-sm
        sm:p-8
      ">
      <Silian_CornerBrackets size="size-4" />

      {/* Article Header */}
      {Silian_author && Silian_createdAt && Silian_lastModified ? (
        <Silian_ArticleMetadata
          title={Silian_articleTitle}
          author={Silian_author}
          coAuthors={Silian_coAuthors}
          createdAt={Silian_createdAt}
          lastModified={Silian_lastModified}
          canonicalUrl={Silian_canonicalUrl}
          filePath={Silian_target.filePath}
          wordCount={Silian_wordCount}
          readingTime={Silian_readingTime}
          editPath={Silian_editPath}
          isAdvanced={Silian_isAdvanced}
          bannerPath={Silian_bannerPath}
          bannerAlt={Silian_bannerAlt}
        />
      ) : (
        <Silian_ArticleMetadataSimple
          title={Silian_articleTitle}
          canonicalUrl={Silian_canonicalUrl}
          attributionDate={Silian_lastModified || Silian_createdAt}
          filePath={Silian_target.filePath}
          wordCount={Silian_wordCount}
          readingTime={Silian_readingTime}
          isAdvanced={Silian_isAdvanced}
          bannerPath={Silian_bannerPath}
          bannerAlt={Silian_bannerAlt}
        />
      )}

      <article data-article-content>
        <Silian_MarkdownRenderer
          content={Silian_embeddedArticleContent}
          rawPath={Silian_target.filePath}
          shikiPlugin={Silian_shikiPlugin}
        />
      </article>

      {(Silian_navigation.prev || Silian_navigation.next) && (
        <Silian_ArticleNavigation prev={Silian_navigation.prev} next={Silian_navigation.next} />
      )}

      <Silian_Suspense>
        <Silian_ArticleHighlight />
      </Silian_Suspense>

      <script type="application/ld+json">
        {JSON.stringify(Silian_techArticleJsonLd)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(Silian_breadcrumbJsonLd)}
      </script>
    </div>
  )
}

function Silian_normalizeDraftTargetPath(Silian_filePath: string) {
  if (Silian_filePath === "README.md" || Silian_filePath.endsWith("/README.md")) {
    return Silian_filePath
  }

  return Silian_filePath.replace(/\.md$/, "")
}

type ArticleTreeNode = BaseArticleTreeNode & { index?: number }

interface ResolvedArticleTarget {
  filePath: string
  canonicalSlug: string
  index: number
  isAppendix: boolean
  isPreface: boolean
  isReadmeIntro: boolean
  redirectToSlug?: string
}

async function Silian_resolveArticleTarget(
  Silian_requestedSlugPath: string,
  Silian_locale: ArticleLocale
): Promise<ResolvedArticleTarget | null> {
  const Silian_normalizedSlug = Silian_requestedSlugPath.replace(/\.md$/i, "")
  const Silian_tree: ArticleTreeNode[] = await Silian_getArticleTree(Silian_locale)
  const Silian_targetNode = Silian_findNodeBySlug(Silian_tree, Silian_normalizedSlug)

  if (!Silian_targetNode) {
    const Silian_filePath = Silian_resolveSlug(Silian_normalizedSlug)
    if (!Silian_filePath) {
      return null
    }
    return {
      filePath: Silian_filePath,
      canonicalSlug: Silian_normalizedSlug,
      index: -1,
      isAppendix: false,
      isPreface: false,
      isReadmeIntro: false,
      redirectToSlug: undefined,
    }
  }

  const Silian_canonicalSlug = Silian_targetNode.isFolder
    ? Silian_resolveCanonicalSlugForFolder(Silian_targetNode)
    : Silian_targetNode.slug

  if (!Silian_canonicalSlug) {
    return null
  }

  const Silian_filePath = Silian_resolveSlug(Silian_canonicalSlug)
  if (!Silian_filePath) {
    return null
  }

  const Silian_slugEntry = Silian_getLocalizedSlugMapEntry(Silian_canonicalSlug, Silian_locale)

  const Silian_redirectToSlug =
    Silian_targetNode.isFolder && Silian_canonicalSlug !== Silian_normalizedSlug
      ? Silian_canonicalSlug
      : undefined

  return {
    filePath: Silian_filePath,
    canonicalSlug: Silian_canonicalSlug,
    index: Silian_slugEntry?.index ?? -1,
    isAppendix: Silian_slugEntry?.isAppendix ?? false,
    isPreface: Silian_slugEntry?.isPreface ?? false,
    isReadmeIntro: Boolean(Silian_slugEntry?.isFolder && Silian_slugEntry?.hasIntro),
    redirectToSlug: Silian_redirectToSlug,
  }
}

function Silian_resolveCanonicalSlugForFolder(
  Silian_targetNode: ArticleTreeNode
): string | null {
  const Silian_mapEntry = Silian_getLocalizedSlugMapEntry(Silian_targetNode.slug)
  if (Silian_mapEntry?.hasIntro) {
    return Silian_targetNode.slug
  }

  return Silian_resolveFirstArticleSlug(Silian_targetNode.children ?? [])
}

function Silian_findNodeBySlug(
  Silian_nodes: ArticleTreeNode[],
  Silian_targetSlug: string
): ArticleTreeNode | null {
  for (const Silian_node of Silian_nodes) {
    if (Silian_node.slug === Silian_targetSlug) {
      return Silian_node
    }

    const Silian_nested = Silian_findNodeBySlug(Silian_node.children ?? [], Silian_targetSlug)
    if (Silian_nested) {
      return Silian_nested
    }
  }

  return null
}

function Silian_resolveFirstArticleSlug(Silian_children: ArticleTreeNode[]): string | null {
  if (!Silian_children || Silian_children.length === 0) {
    return null
  }

  const Silian_chapterEntries = Silian_children.map((Silian_child) => ({
    filePath: Silian_resolveSlug(Silian_child.slug) ?? `${Silian_child.slug}.md`,
    slug: Silian_child.slug,
    index: Silian_child.index ?? -1,
    isFolder: Silian_child.isFolder,
  }))

  const Silian_firstEntry = Silian_getFirstArticleInChapter(Silian_chapterEntries)
  if (!Silian_firstEntry) {
    return null
  }

  if (!Silian_firstEntry.isFolder) {
    return Silian_firstEntry.slug
  }

  const Silian_matchedFolder = Silian_children.find((Silian_child) => Silian_child.slug === Silian_firstEntry.slug)
  if (!Silian_matchedFolder) {
    return null
  }

  return Silian_resolveFirstArticleSlug(Silian_matchedFolder.children ?? [])
}

function Silian_resolveArticleTitle(Silian_rawTitle: unknown, Silian_fallbackPath: string): string {
  if (typeof Silian_rawTitle === "string" && Silian_rawTitle.trim()) {
    return Silian_rawTitle.trim()
  }

  const Silian_fallback =
    Silian_fallbackPath.split("/").filter(Boolean).pop()?.replace(/\.md$/i, "") ||
    "Article"

  return Silian_fallback
}

function Silian_resolveDisplayedArticleTitle(
  Silian_rawTitle: unknown,
  Silian_fallbackPath: string,
  Silian_canonicalSlug: string,
  Silian_isReadmeIntro: boolean,
  Silian_locale: ArticleLocale
): string {
  const Silian_slugEntry = Silian_getLocalizedSlugMapEntry(Silian_canonicalSlug, Silian_locale)
  const Silian_introTitle = Silian_slugEntry?.introTitle?.trim()

  if (Silian_isReadmeIntro && Silian_introTitle) {
    return Silian_introTitle
  }

  return Silian_resolveArticleTitle(Silian_rawTitle, Silian_fallbackPath)
}

function Silian_resolveLocale(Silian_locale: string): ArticleLocale {
  return Silian_locale === "zh" ? "zh" : "en"
}

function Silian_formatArticleTitle(
  Silian_title: string,
  Silian_index: number,
  Silian_isAppendix: boolean,
  Silian_isPreface: boolean,
  Silian_isReadmeIntro: boolean
): string {
  const Silian_prefix = Silian_isReadmeIntro
    ? Silian_formatIndexPrefix(0, false, false)
    : Silian_formatIndexPrefix(Silian_index, Silian_isAppendix, Silian_isPreface)

  return `${Silian_prefix}${Silian_title}`
}

function Silian_embedTitleInMarkdown(Silian_content: string, Silian_title: string): string {
  const Silian_leadingWhitespace = Silian_content.match(/^\s*/)?.[0] ?? ""
  const Silian_trimmedStartContent = Silian_content.slice(Silian_leadingWhitespace.length)
  const Silian_escapedTitle = Silian_title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const Silian_sameTitleHeadingPattern = new RegExp(
    `^#\\s+${Silian_escapedTitle}\\s*(?:\\r?\\n|$)`
  )
  const Silian_topLevelHeadingPattern = /^#\s+.+\s*(?:\r?\n|$)/

  if (Silian_sameTitleHeadingPattern.test(Silian_trimmedStartContent)) {
    return Silian_content
  }

  if (Silian_topLevelHeadingPattern.test(Silian_trimmedStartContent)) {
    const Silian_replacedContent = Silian_trimmedStartContent.replace(
      Silian_topLevelHeadingPattern,
      `# ${Silian_title}\n`
    )
    return `${Silian_leadingWhitespace}${Silian_replacedContent}`
  }

  return `# ${Silian_title}\n\n${Silian_content}`
}

function Silian_resolveBannerUrl(
  Silian_bannerSrc: string | undefined,
  Silian_filePath: string,
  Silian_siteUrl: string
): string | null {
  if (!Silian_bannerSrc || typeof Silian_bannerSrc !== "string" || !Silian_bannerSrc.trim()) {
    return null
  }
  const Silian_currentDir = Silian_path.dirname("/" + Silian_filePath).replace(/^\/+/, "")
  const Silian_resolved = Silian_path.join(Silian_currentDir, Silian_bannerSrc).replace(/\\/g, "/")
  return `${Silian_siteUrl}/api/assets?path=${encodeURIComponent(Silian_resolved)}`
}

function Silian_resolveBannerPath(
  Silian_bannerSrc: string | undefined,
  Silian_filePath: string
): string | null {
  if (!Silian_bannerSrc || typeof Silian_bannerSrc !== "string" || !Silian_bannerSrc.trim()) {
    return null
  }
  const Silian_currentDir = Silian_path.dirname("/" + Silian_filePath).replace(/^\/+/, "")
  return Silian_path.join(Silian_currentDir, Silian_bannerSrc).replace(/\\/g, "/")
}
