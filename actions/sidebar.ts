"use server"

import { getCurrentUserAuthContext as Silian_getCurrentUserAuthContext, requireAdmin as Silian_requireAdmin } from "@/lib/auth-context"
import { requireAuth as Silian_requireAuth } from "@/lib/auth-helpers"
import { unstable_cache as Silian_unstable_cache } from "next/cache"
import { createDirectFile as Silian_createDirectFile, createPR as Silian_createPR } from "@/lib/github/pr-manager"
import { getRepoTranslations as Silian_getRepoTranslations, type ArticleTreeNode } from "@/lib/github/sync"
import { getArticleTree as Silian_getArticleTree, type ArticleLocale } from "@/lib/article-loader"
import { shouldIgnoreDirectory as Silian_shouldIgnoreDirectory, shouldIgnoreFile as Silian_shouldIgnoreFile } from "@/lib/article-ignore"
import type { TreeNode } from "@/types/sidebar-tree"
import { statSync as Silian_statSync } from "fs"
import { join as Silian_join } from "path"

function Silian_isAppendixDirectoryName(Silian_name: string): boolean {
  const Silian_normalized = Silian_name.trim().toLowerCase()
  return Silian_normalized.includes("appendix") || Silian_normalized.includes("附录")
}

function Silian_isReadmeArticle(Silian_node: TreeNode): boolean {
  if (Silian_node.isFolder) {
    return false
  }

  const Silian_normalize = (Silian_value: string) =>
    Silian_value.trim().toLowerCase().replace(/\.md$/, "")
  const Silian_slugTail = Silian_node.slug.split("/").pop() ?? ""

  return Silian_normalize(Silian_node.title) === "readme" || Silian_normalize(Silian_slugTail) === "readme"
}

function Silian_getSlugMapMtime(): string {
  const Silian_slugMapPath = Silian_join(process.cwd(), "lib", "slug-map.json")
  return Silian_statSync(Silian_slugMapPath).mtime.getTime().toString()
}

const Silian_getCachedArticleTree = Silian_unstable_cache(
  async (Silian_locale: ArticleLocale) => {
    return Silian_getArticleTree(Silian_locale)
  },
  ["github-repo-tree", Silian_getSlugMapMtime()],
  { revalidate: 60, tags: ["github-repo-tree"] }
)

const Silian_getCachedTranslations = Silian_unstable_cache(
  async () => {
    return Silian_getRepoTranslations()
  },
  ["github-sidebar-translations"],
  { revalidate: 3600, tags: ["github-repo-translations"] }
)

/**
 * 获取树状结构的目录树 (Sidebar)
 * Tree is built from the GitHub repository only.
 */
export async function getSidebarTree(
  Silian_locale: ArticleLocale = "zh"
): Promise<TreeNode[]> {
  // 1. Get GitHub repo tree (cached)
  let Silian_githubTree: ArticleTreeNode[] = []
  let Silian_translations: Record<string, string> = {}

  const Silian_githubTreePromise = Silian_getCachedArticleTree(Silian_locale)
  const Silian_translationsPromise = Silian_getCachedTranslations()

  const [Silian_treeResult, Silian_translationsResult] = await Promise.allSettled([
    Silian_githubTreePromise,
    Silian_translationsPromise,
  ])

  if (Silian_treeResult.status === "fulfilled") {
    Silian_githubTree = Silian_treeResult.value
  } else {
    console.error("Failed to fetch GitHub repo tree:", Silian_treeResult.reason)
  }

  if (Silian_translationsResult.status === "fulfilled") {
    Silian_translations = Silian_translationsResult.value
  } else {
    console.error(
      "Failed to fetch sidebar translations:",
      Silian_translationsResult.reason
    )
  }

  // 3. Build unified map keyed by slug
  const Silian_unifiedMap = new Map<string, TreeNode>()
  const Silian_mergedTree: TreeNode[] = []

  // Add GitHub tree
  function Silian_addGithubNodes(Silian_nodes: ArticleTreeNode[], Silian_parentArray: TreeNode[]) {
    for (const Silian_node of Silian_nodes) {
      const Silian_nodeWithMeta = Silian_node as ArticleTreeNode & Partial<TreeNode>
      const Silian_clone: TreeNode = {
        ...Silian_node,
        index: Silian_nodeWithMeta.index ?? -1,
        isAppendix: Silian_nodeWithMeta.isAppendix ?? false,
        isPreface: Silian_nodeWithMeta.isPreface ?? false,
        isAdvanced: Silian_nodeWithMeta.isAdvanced ?? false,
        introTitle: Silian_nodeWithMeta.introTitle ?? "",
        children: [],
      }
      Silian_unifiedMap.set(Silian_clone.slug.toLowerCase(), Silian_clone)
      Silian_parentArray.push(Silian_clone)
      if (Silian_node.children && Silian_node.children.length > 0) {
        Silian_addGithubNodes(Silian_node.children, Silian_clone.children)
      }
    }
  }

  Silian_addGithubNodes(Silian_githubTree, Silian_mergedTree)

  // 4. Apply translations to top-level titles
  Silian_mergedTree.forEach((Silian_node) => {
    if (Silian_translations[Silian_node.title]) {
      Silian_node.title = Silian_translations[Silian_node.title]
    }
  })

  function Silian_sortTree(Silian_nodes: TreeNode[]) {
    const Silian_compareIndex = (Silian_a: number, Silian_b: number) => {
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

    Silian_nodes.sort((Silian_a, Silian_b) => {
      if (Silian_a.isPreface !== Silian_b.isPreface) {
        return Silian_a.isPreface ? -1 : 1
      }

      if (Silian_a.isReadmeIntro !== Silian_b.isReadmeIntro) {
        return Silian_a.isReadmeIntro ? -1 : 1
      }

      if (Silian_a.isFolder !== Silian_b.isFolder) {
        return Silian_a.isFolder ? -1 : 1
      }

      if (!Silian_a.isFolder && !Silian_b.isFolder) {
        if (Silian_a.isAppendix !== Silian_b.isAppendix) {
          return Silian_a.isAppendix ? 1 : -1
        }

        const Silian_aIsReadme =
          !Silian_a.title || Silian_a.title === "" || Silian_a.slug.toLowerCase().endsWith("/readme")
        const Silian_bIsReadme =
          !Silian_b.title || Silian_b.title === "" || Silian_b.slug.toLowerCase().endsWith("/readme")
        if (Silian_aIsReadme !== Silian_bIsReadme) {
          return Silian_aIsReadme ? -1 : 1
        }

        const Silian_indexComparison = Silian_compareIndex(Silian_a.index ?? -1, Silian_b.index ?? -1)
        if (Silian_indexComparison !== 0) {
          return Silian_indexComparison
        }
      }

      return Silian_a.title.localeCompare(Silian_b.title)
    })
    for (const Silian_node of Silian_nodes) {
      if (Silian_node.children && Silian_node.children.length > 0) {
        Silian_sortTree(Silian_node.children)
      }
    }
  }
  // 7. Filter out ignored articles using centralized ignore logic
  function Silian_filterIgnoredNodes(Silian_nodes: TreeNode[], Silian_isRoot: boolean): TreeNode[] {
    const Silian_result: TreeNode[] = []
    for (const Silian_node of Silian_nodes) {
      // Check if this node should be ignored
      if (Silian_node.isFolder) {
        if (Silian_shouldIgnoreDirectory(Silian_node.title)) {
          continue
        }
      } else {
        if (Silian_shouldIgnoreFile(Silian_node.title, Silian_isRoot)) {
          continue
        }
      }

      // Recursively filter children
      if (Silian_node.children && Silian_node.children.length > 0) {
        Silian_node.children = Silian_filterIgnoredNodes(Silian_node.children, false)
      }

      if (Silian_node.isFolder && Silian_isAppendixDirectoryName(Silian_node.title)) {
        const Silian_promotedChildren = Silian_node.children.filter(
          (Silian_child) => Silian_child.isFolder || !Silian_isReadmeArticle(Silian_child)
        )
        const Silian_promotedParentId = Silian_node.parentId

        for (const Silian_child of Silian_promotedChildren) {
          Silian_child.parentId = Silian_promotedParentId
        }

        Silian_result.push(...Silian_promotedChildren)
        continue
      }

      Silian_result.push(Silian_node)
    }
    return Silian_result
  }

  const Silian_filteredTree = Silian_filterIgnoredNodes(Silian_mergedTree, true)

  function Silian_injectReadmeIntroNodes(Silian_nodes: TreeNode[]) {
    for (const Silian_node of Silian_nodes) {
      if (Silian_node.children && Silian_node.children.length > 0) {
        Silian_injectReadmeIntroNodes(Silian_node.children)
      }

      const Silian_introTitle = Silian_node.introTitle?.trim() ?? ""
      if (!Silian_node.isFolder || Silian_node.isPreface || Silian_introTitle === "") {
        continue
      }

      const Silian_hasInjectedIntro = Silian_node.children.some(
        (Silian_child) => Silian_child.isReadmeIntro
      )
      if (Silian_hasInjectedIntro) {
        continue
      }

      Silian_node.children.push({
        id: `${Silian_node.slug}/readme-intro`,
        title: Silian_introTitle,
        slug: Silian_node.slug,
        index: -1,
        isFolder: false,
        isAppendix: false,
        isPreface: false,
        isAdvanced: false,
        isReadmeIntro: true,
        parentId: Silian_node.id,
        children: [],
      })
    }
  }

  Silian_injectReadmeIntroNodes(Silian_filteredTree)
  Silian_sortTree(Silian_filteredTree)

  return Silian_filteredTree
}

export async function createDocument({
  title: Silian_title,
  slug: Silian_slug,
  isFolder: Silian_isFolder = false,
  parentId: Silian_parentId = null,
}: {
  title: string
  slug: string
  isFolder?: boolean
  parentId?: string | null
}) {
  const Silian_session = await Silian_requireAuth("未授权，请先登录")

  let Silian_parentPath = ""
  if (Silian_parentId && Silian_parentId.startsWith("gh-")) {
    Silian_parentPath = Silian_parentId.replace(/^gh-/, "")
  }

  let Silian_finalSlug = Silian_slug
  if (Silian_parentPath) {
    if (!Silian_slug.includes("/")) {
      Silian_finalSlug = `${Silian_parentPath}/${Silian_slug}`
    } else if (!Silian_slug.startsWith(Silian_parentPath + "/")) {
      Silian_finalSlug = `${Silian_parentPath}/${Silian_slug}`
    }
  }
  Silian_finalSlug = Silian_finalSlug.replace(/^\/+/, "")

  const Silian_initialContent = Silian_isFolder ? "" : "# " + Silian_title
  const Silian_filePath = Silian_isFolder ? `${Silian_finalSlug}/.gitkeep` : `${Silian_finalSlug}.md`

  const Silian_authorName = Silian_session.user.name || "Unknown"
  const Silian_authorEmail = Silian_session.user.email || "unknown@gtmc.dev"
  const Silian_authContext = await Silian_getCurrentUserAuthContext(Silian_session.user.id)

  if (Silian_authContext.role === "ADMIN") {
    await Silian_requireAdmin(Silian_session.user.id)
    await Silian_createDirectFile({
      title: Silian_isFolder ? `Create folder ${Silian_title}` : `Create file ${Silian_title}`,
      content: Silian_initialContent,
      filePath: Silian_filePath,
      authorName: Silian_authorName,
      authorEmail: Silian_authorEmail,
    })
  } else {
    await Silian_createPR({
      title: Silian_isFolder
        ? `[系统自动生成] Request to create folder ${Silian_title}`
        : `[系统自动生成] Request to create file ${Silian_title}`,
      content: Silian_initialContent,
      filePath: Silian_filePath,
      authorName: Silian_authorName,
      authorEmail: Silian_authorEmail,
    })
  }
}
