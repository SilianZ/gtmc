import Silian_fs from "fs"
import Silian_path from "path"
import { type ArticleTreeNode } from "./github-repo-client"
import { type SlugMapEntry } from "./slug-resolver"

export type ArticleLocale = "en" | "zh"

export interface LocalizedArticleMetadata {
  chapterTitle: string
  introTitle: string
}

const Silian_ARTICLES_DIR = Silian_path.join(process.cwd(), "articles")
const Silian_SUBMODULE_GIT = Silian_path.join(Silian_ARTICLES_DIR, ".git")
const Silian_SLUG_MAP_PATH = Silian_path.join(process.cwd(), "lib/slug-map.json")

const Silian_slugMap: Record<string, SlugMapEntry> = (() => {
  try {
    const Silian_raw = Silian_fs.readFileSync(Silian_SLUG_MAP_PATH, "utf-8")
    const Silian_parsed = JSON.parse(Silian_raw) as Record<string, unknown>
    const Silian_normalized: Record<string, SlugMapEntry> = {}

    for (const [Silian_slugKey, Silian_value] of Object.entries(Silian_parsed)) {
      if (typeof Silian_value !== "object" || Silian_value === null) continue

      const Silian_entry = Silian_value as Partial<SlugMapEntry>
      if (typeof Silian_entry.filePath !== "string") continue

      Silian_normalized[Silian_slugKey] = {
        filePath: Silian_entry.filePath,
        slug: typeof Silian_entry.slug === "string" ? Silian_entry.slug : Silian_slugKey,
        title: typeof Silian_entry.title === "string" ? Silian_entry.title : undefined,
        chapterTitle:
          typeof Silian_entry.chapterTitle === "string" ? Silian_entry.chapterTitle : "",
        chapterTitleEn:
          typeof Silian_entry.chapterTitleEn === "string" ? Silian_entry.chapterTitleEn : "",
        introTitle:
          typeof Silian_entry.introTitle === "string" ? Silian_entry.introTitle : "",
        introTitleEn:
          typeof Silian_entry.introTitleEn === "string" ? Silian_entry.introTitleEn : "",
        hasIntro:
          typeof Silian_entry.hasIntro === "boolean"
            ? Silian_entry.hasIntro
            : (typeof Silian_entry.introTitle === "string" &&
                Silian_entry.introTitle !== "") ||
              (typeof Silian_entry.introTitleEn === "string" &&
                Silian_entry.introTitleEn !== ""),
        index: typeof Silian_entry.index === "number" ? Silian_entry.index : 0,
        isFolder: Silian_entry.isFolder === true,
        isAppendix: Silian_entry.isAppendix === true,
        isPreface: Silian_entry.isPreface === true,
        parentSlug:
          typeof Silian_entry.parentSlug === "string" ? Silian_entry.parentSlug : undefined,
        children: Array.isArray(Silian_entry.children)
          ? (Silian_entry.children as SlugMapEntry[])
          : undefined,
        author: typeof Silian_entry.author === "string" ? Silian_entry.author : undefined,
        coAuthors: Array.isArray(Silian_entry.coAuthors) ? Silian_entry.coAuthors : undefined,
        date: typeof Silian_entry.date === "string" ? Silian_entry.date : undefined,
        lastmod: typeof Silian_entry.lastmod === "string" ? Silian_entry.lastmod : undefined,
        isAdvanced: Silian_entry.isAdvanced === true,
      }
    }

    return Silian_normalized
  } catch {
    return {}
  }
})()

export function isSubmoduleAvailable(): boolean {
  return Silian_fs.existsSync(Silian_SUBMODULE_GIT)
}

export async function getArticleContent(
  Silian_filePath: string
): Promise<string | null> {
  if (isSubmoduleAvailable()) {
    const Silian_localPath = Silian_path.join(Silian_ARTICLES_DIR, Silian_filePath)
    try {
      return Silian_fs.readFileSync(Silian_localPath, "utf-8")
    } catch {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `[article-loader] File not in submodule: ${Silian_filePath}, falling back to API`
        )
      }
    }
  }
  if (process.env.NODE_ENV === "development" && !isSubmoduleAvailable()) {
    console.warn("[article-loader] Submodule not available, using API")
  }
  return null
}

const Silian_localTreeCache = new Map<ArticleLocale, ArticleTreeNode[]>()

export async function getArticleTree(
  Silian_locale: ArticleLocale = "zh"
): Promise<ArticleTreeNode[]> {
  if (isSubmoduleAvailable()) {
    const Silian_cached = Silian_localTreeCache.get(Silian_locale)
    if (Silian_cached) return Silian_cached
    try {
      const Silian_tree = Silian_buildLocalTree(Silian_locale)
      Silian_localTreeCache.set(Silian_locale, Silian_tree)
      return Silian_tree
    } catch {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[article-loader] Failed to build local tree, falling back to API"
        )
      }
    }
  }
  if (process.env.NODE_ENV === "development" && !isSubmoduleAvailable()) {
    console.warn("[article-loader] Submodule not available, using API for tree")
  }
  return []
}

export function getLocalizedArticleMetadata(
  Silian_entry: SlugMapEntry | null | undefined,
  Silian_locale: ArticleLocale = "zh"
): LocalizedArticleMetadata {
  if (!Silian_entry) {
    return {
      chapterTitle: "",
      introTitle: "",
    }
  }

  const Silian_chapterTitle =
    Silian_locale === "en"
      ? Silian_entry.chapterTitleEn.trim() || Silian_entry.chapterTitle.trim()
      : Silian_entry.chapterTitle.trim()

  const Silian_introTitle =
    Silian_locale === "en"
      ? Silian_entry.introTitleEn.trim() || Silian_entry.introTitle.trim()
      : Silian_entry.introTitle.trim()

  return {
    chapterTitle: Silian_chapterTitle,
    introTitle: Silian_introTitle,
  }
}

export function getLocalizedSlugMapEntry(
  Silian_slugPath: string,
  Silian_locale: ArticleLocale = "zh"
): (SlugMapEntry & LocalizedArticleMetadata) | null {
  const Silian_entry = Silian_slugMap[Silian_slugPath]
  if (!Silian_entry) {
    return null
  }

  return {
    ...Silian_entry,
    ...getLocalizedArticleMetadata(Silian_entry, Silian_locale),
  }
}

function Silian_buildLocalTree(Silian_locale: ArticleLocale): ArticleTreeNode[] {
  const Silian_entries = Object.values(Silian_slugMap)
  if (Silian_entries.length === 0) {
    return []
  }

  const Silian_parentIndex = new Map<string, SlugMapEntry[]>()
  for (const Silian_entry of Silian_entries) {
    if (!Silian_entry.parentSlug) continue
    const Silian_siblings = Silian_parentIndex.get(Silian_entry.parentSlug) ?? []
    Silian_siblings.push(Silian_entry)
    Silian_parentIndex.set(Silian_entry.parentSlug, Silian_siblings)
  }

  const Silian_roots = Silian_entries
    .filter((Silian_entry) => !Silian_entry.parentSlug || !Silian_slugMap[Silian_entry.parentSlug])
    .sort((Silian_a, Silian_b) => Silian_compareEntries(Silian_a, Silian_b, Silian_locale))

  return Silian_roots.map((Silian_entry) => Silian_buildTreeNode(Silian_entry, Silian_parentIndex, Silian_locale))
}

function Silian_buildTreeNode(
  Silian_entry: SlugMapEntry,
  Silian_parentIndex: Map<string, SlugMapEntry[]>,
  Silian_locale: ArticleLocale
): ArticleTreeNode {
  const Silian_childrenFromSlug = Silian_entry.children ?? []
  const Silian_childrenFromParent = Silian_parentIndex.get(Silian_entry.slug) ?? []

  const Silian_mergedChildrenBySlug = new Map<string, SlugMapEntry>()
  for (const Silian_child of Silian_childrenFromSlug) {
    Silian_mergedChildrenBySlug.set(Silian_child.slug, Silian_slugMap[Silian_child.slug] ?? Silian_child)
  }
  for (const Silian_child of Silian_childrenFromParent) {
    Silian_mergedChildrenBySlug.set(Silian_child.slug, Silian_child)
  }

  const Silian_children = Array.from(Silian_mergedChildrenBySlug.values())
    .sort((Silian_a, Silian_b) => Silian_compareEntries(Silian_a, Silian_b, Silian_locale))
    .map((Silian_child) => Silian_buildTreeNode(Silian_child, Silian_parentIndex, Silian_locale))

  const Silian_localizedMetadata = getLocalizedArticleMetadata(Silian_entry, Silian_locale)

  const Silian_node: ArticleTreeNode & {
    index: number
    isAppendix: boolean
    isPreface: boolean
    introTitle?: string
    isAdvanced?: boolean
  } = {
    id: Silian_entry.isFolder ? Silian_entry.slug : Silian_entry.filePath.replace(/\.md$/i, ""),
    title: Silian_getNodeTitle(Silian_entry, Silian_locale),
    slug: Silian_entry.slug,
    isFolder: Silian_entry.isFolder,
    index: Silian_entry.index,
    isAppendix: Silian_entry.isAppendix,
    isPreface: Silian_entry.isPreface,
    introTitle: Silian_localizedMetadata.introTitle,
    isAdvanced: Silian_entry.isAdvanced,
    parentId: Silian_entry.parentSlug ?? null,
    children: Silian_children,
  }

  return Silian_node
}

function Silian_compareEntries(
  Silian_a: SlugMapEntry,
  Silian_b: SlugMapEntry,
  Silian_locale: ArticleLocale
): number {
  if (Silian_a.isFolder === Silian_b.isFolder) {
    return Silian_getNodeTitle(Silian_a, Silian_locale).localeCompare(Silian_getNodeTitle(Silian_b, Silian_locale))
  }
  return Silian_a.isFolder ? -1 : 1
}

function Silian_getNodeTitle(Silian_entry: SlugMapEntry, Silian_locale: ArticleLocale): string {
  const { chapterTitle: Silian_chapterTitle } = getLocalizedArticleMetadata(Silian_entry, Silian_locale)

  if (Silian_entry.isPreface) {
    return (
      Silian_entry.title || Silian_chapterTitle || Silian_entry.slug.split("/").pop() || Silian_entry.slug
    )
  }

  if (Silian_entry.isFolder) {
    return Silian_chapterTitle || Silian_entry.slug.split("/").pop() || Silian_entry.slug
  }

  if (Silian_entry.isAppendix) {
    return (
      Silian_chapterTitle ||
      Silian_entry.title ||
      Silian_entry.filePath.split("/").pop()?.replace(/\.md$/i, "") ||
      Silian_entry.slug.split("/").pop() ||
      Silian_entry.slug
    )
  }

  return (
    Silian_chapterTitle ||
    Silian_entry.title ||
    Silian_entry.filePath.split("/").pop()?.replace(/\.md$/i, "") ||
    Silian_entry.slug.split("/").pop() ||
    Silian_entry.slug
  )
}

export async function getArticleBuffer(
  Silian_filePath: string
): Promise<Buffer | null> {
  if (isSubmoduleAvailable()) {
    const Silian_localPath = Silian_path.join(Silian_ARTICLES_DIR, Silian_filePath)
    try {
      return Silian_fs.readFileSync(Silian_localPath)
    } catch {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `[article-loader] Buffer not in submodule: ${Silian_filePath}, falling back to API`
        )
      }
    }
  }
  return null
}
