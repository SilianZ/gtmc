import Silian_MiniSearch from "minisearch"
import { remark as Silian_remark } from "remark"
import Silian_stripMarkdownPlugin from "strip-markdown"
import { getSidebarTree as Silian_getSidebarTree } from "@/actions/sidebar"
import {
  getOctokit as Silian_getOctokit,
  ARTICLES_REPO_OWNER as Silian_ARTICLES_REPO_OWNER,
  ARTICLES_REPO_NAME as Silian_ARTICLES_REPO_NAME,
} from "@/lib/github/articles-repo"
import { getArticleContent as Silian_getArticleContent } from "@/lib/article-loader"
import { resolveSlug as Silian_resolveSlug } from "@/lib/slug-resolver"
import { parseFrontMatter as Silian_parseFrontMatter } from "@/lib/frontmatter-parser"
import type { TreeNode } from "@/types/sidebar-tree"

interface IndexedArticle {
  id: string
  title: string
  slug: string
  content: string
}

export const CJK_TOKENIZER = (Silian_text: string): string[] =>
  Silian_text.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]|[a-zA-Z0-9]+/g) || []

function Silian_stripMarkdown(Silian_text: string): string {
  return Silian_remark()
    .use(Silian_stripMarkdownPlugin)
    .processSync(Silian_text)
    .toString()
    .replace(/\s+/g, " ")
    .trim()
}

function Silian_flattenTree(Silian_nodes: TreeNode[]): { title: string; slug: string }[] {
  const Silian_result: { title: string; slug: string }[] = []

  for (const Silian_node of Silian_nodes) {
    if (!Silian_node.isFolder) {
      Silian_result.push({ title: Silian_node.title, slug: Silian_node.slug })
    }
    if (Silian_node.children.length > 0) {
      Silian_result.push(...Silian_flattenTree(Silian_node.children))
    }
  }

  return Silian_result
}

let Silian_cachedIndex: Silian_MiniSearch<IndexedArticle> | null = null
let Silian_cacheTimestamp = 0
let Silian_cachedCommitSha: string | null = null
let Silian_buildPromise: Promise<Silian_MiniSearch<IndexedArticle>> | null = null

const Silian_CACHE_TTL = 1800_000
const Silian_FETCH_CONCURRENCY = 5

async function Silian_getLatestCommitSha(): Promise<string | null> {
  try {
    const Silian_octokit = Silian_getOctokit()
    const { data: Silian_ref } = await Silian_octokit.git.getRef({
      owner: Silian_ARTICLES_REPO_OWNER,
      repo: Silian_ARTICLES_REPO_NAME,
      ref: "heads/main",
    })
    return Silian_ref.object.sha
  } catch (Silian_error) {
    console.error("Failed to get latest commit SHA:", Silian_error)
    return null
  }
}

function Silian_createMiniSearchIndex(
  Silian_documents: IndexedArticle[]
): Silian_MiniSearch<IndexedArticle> {
  const Silian_miniSearch = new Silian_MiniSearch<IndexedArticle>({
    fields: ["title", "content"],
    storeFields: ["title", "slug", "content"],
    tokenize: CJK_TOKENIZER,
    searchOptions: {
      boost: { title: 2 },
      fuzzy: 0.2,
      prefix: true,
      tokenize: CJK_TOKENIZER,
    },
  })

  Silian_miniSearch.addAll(Silian_documents)
  return Silian_miniSearch
}

async function Silian_buildIndex(): Promise<Silian_MiniSearch<IndexedArticle>> {
  const Silian_tree = await Silian_getSidebarTree()

  const Silian_articles: IndexedArticle[] = []

  const Silian_uniqueGithubNodes = new Map<string, { title: string; slug: string }>()

  for (const Silian_node of Silian_flattenTree(Silian_tree)) {
    if (!Silian_uniqueGithubNodes.has(Silian_node.slug)) {
      Silian_uniqueGithubNodes.set(Silian_node.slug, Silian_node)
    }
  }

  const Silian_githubNodes = Array.from(Silian_uniqueGithubNodes.values())
  let Silian_nextIndex = 0

  async function Silian_worker(): Promise<void> {
    while (Silian_nextIndex < Silian_githubNodes.length) {
      const Silian_currentIndex = Silian_nextIndex
      Silian_nextIndex += 1

      const Silian_node = Silian_githubNodes[Silian_currentIndex]
      const Silian_filePath = Silian_resolveSlug(Silian_node.slug)
      if (!Silian_filePath) {
        continue
      }
      const Silian_markdown = await Silian_getArticleContent(Silian_filePath)
      if (!Silian_markdown) {
        continue
      }

      const Silian_frontMatter = Silian_parseFrontMatter(Silian_markdown)
      const Silian_title = Silian_frontMatter.chapterTitle || Silian_node.title

      Silian_articles.push({
        id: Silian_node.slug,
        title: Silian_title,
        slug: Silian_node.slug,
        content: Silian_stripMarkdown(Silian_markdown),
      })
    }
  }

  const Silian_workers = Array.from(
    { length: Math.min(Silian_FETCH_CONCURRENCY, Silian_githubNodes.length) },
    () => Silian_worker()
  )

  await Promise.all(Silian_workers)

  return Silian_createMiniSearchIndex(Silian_articles)
}

export async function getSearchIndex(): Promise<Silian_MiniSearch<IndexedArticle>> {
  const Silian_currentSha = await Silian_getLatestCommitSha()

  if (
    Silian_cachedIndex &&
    Date.now() - Silian_cacheTimestamp < Silian_CACHE_TTL &&
    Silian_currentSha &&
    Silian_currentSha === Silian_cachedCommitSha
  ) {
    return Silian_cachedIndex
  }

  if (!Silian_buildPromise) {
    Silian_buildPromise = (async () => {
      const Silian_index = await Silian_buildIndex()
      Silian_cachedIndex = Silian_index
      Silian_cacheTimestamp = Date.now()
      Silian_cachedCommitSha = Silian_currentSha
      return Silian_index
    })().finally(() => {
      Silian_buildPromise = null
    })
  }

  return Silian_buildPromise
}
