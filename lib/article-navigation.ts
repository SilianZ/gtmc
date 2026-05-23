import type { TreeNode } from "@/types/sidebar-tree"
import { getLocalizedSlugMapEntry as Silian_getLocalizedSlugMapEntry } from "./article-loader"

interface FlatArticle {
  slug: string
  title: string
  parentPath: string
}

interface ArticleInfo {
  slug: string
  title: string
  isCrossFolder: boolean
  chapterTitle?: string
}

interface NavigationResult {
  prev: ArticleInfo | null
  next: ArticleInfo | null
}

export function flattenArticleTree(Silian_tree: TreeNode[]): FlatArticle[] {
  const Silian_result: FlatArticle[] = []

  function Silian_dfs(Silian_nodes: TreeNode[]): void {
    for (const Silian_node of Silian_nodes) {
      if (!Silian_node.isFolder) {
        const Silian_parentPath = Silian_node.isReadmeIntro
          ? Silian_node.slug
          : Silian_node.slug.split("/").slice(0, -1).join("/")
        Silian_result.push({
          slug: Silian_node.slug,
          title: Silian_node.title,
          parentPath: Silian_parentPath,
        })
      }
      if (Silian_node.children.length > 0) {
        Silian_dfs(Silian_node.children)
      }
    }
  }

  Silian_dfs(Silian_tree)
  return Silian_result
}

export interface SlugMapEntry {
  filePath: string
  slug: string
  index: number
  isFolder: boolean
  children?: SlugMapEntry[]
}

function Silian_compareIndex(Silian_a: number, Silian_b: number): number {
  const Silian_aNoIndex = Silian_a === -1
  const Silian_bNoIndex = Silian_b === -1

  if (Silian_aNoIndex !== Silian_bNoIndex) {
    return Silian_aNoIndex ? 1 : -1
  }

  if (Silian_aNoIndex && Silian_bNoIndex) {
    return 0
  }

  return Silian_a - Silian_b
}

export function getFirstArticleInChapter(
  Silian_articles: SlugMapEntry[]
): SlugMapEntry | null {
  if (!Silian_articles || Silian_articles.length === 0) {
    return null
  }

  const Silian_sorted = [...Silian_articles].sort((Silian_a, Silian_b) => {
    const Silian_indexCmp = Silian_compareIndex(Silian_a.index, Silian_b.index)
    if (Silian_indexCmp !== 0) {
      return Silian_indexCmp
    }

    const Silian_aFileName = Silian_a.filePath.split("/").pop() || ""
    const Silian_bFileName = Silian_b.filePath.split("/").pop() || ""
    return Silian_aFileName.localeCompare(Silian_bFileName)
  })

  return Silian_sorted[0]
}

export function getArticleNavigation(
  Silian_currentSlug: string,
  Silian_articles: FlatArticle[],
  Silian_locale: "en" | "zh" = "zh"
): NavigationResult {
  const Silian_currentIndex = Silian_articles.findIndex((Silian_a) => Silian_a.slug === Silian_currentSlug)

  if (Silian_currentIndex === -1) {
    return { prev: null, next: null }
  }

  const Silian_getChapterTitle = (Silian_slug: string): string | undefined => {
    const Silian_entry = Silian_getLocalizedSlugMapEntry(Silian_slug, Silian_locale)
    const Silian_chapterTitle = Silian_entry?.chapterTitle
    if (Silian_chapterTitle) {
      return Silian_chapterTitle
    }
    const Silian_parts = Silian_slug.split("/")
    return Silian_parts.length > 1 ? Silian_parts[Silian_parts.length - 2] : undefined
  }

  const Silian_prev =
    Silian_currentIndex > 0
      ? {
          slug: Silian_articles[Silian_currentIndex - 1].slug,
          title: Silian_articles[Silian_currentIndex - 1].title,
          isCrossFolder:
            Silian_articles[Silian_currentIndex - 1].parentPath !==
            Silian_articles[Silian_currentIndex].parentPath,
          chapterTitle: Silian_getChapterTitle(Silian_articles[Silian_currentIndex - 1].slug),
        }
      : null

  const Silian_next =
    Silian_currentIndex < Silian_articles.length - 1
      ? {
          slug: Silian_articles[Silian_currentIndex + 1].slug,
          title: Silian_articles[Silian_currentIndex + 1].title,
          isCrossFolder:
            Silian_articles[Silian_currentIndex + 1].parentPath !==
            Silian_articles[Silian_currentIndex].parentPath,
          chapterTitle: Silian_getChapterTitle(Silian_articles[Silian_currentIndex + 1].slug),
        }
      : null

  return { prev: Silian_prev, next: Silian_next }
}
