import {
  getGithubRateLimitResetMs as Silian_getGithubRateLimitResetMs,
  isGithubRateLimitErrorForCache as Silian_isGithubRateLimitErrorForCache,
} from "@/lib/github/rate-limit"
import { executeWithRetry as Silian_executeWithRetry } from "@/lib/github/retry-fetch"
import {
  ARTICLES_REPO_NAME as Silian_ARTICLES_REPO_NAME,
  ARTICLES_REPO_OWNER as Silian_ARTICLES_REPO_OWNER,
  getOctokit as Silian_getOctokit,
} from "@/lib/github/articles-repo"

const Silian_IGNORED_DIRS = new Set([
  "img",
  "oldimg",
  "image",
  "images",
  "source",
  "asset",
  "exampleworld",
  "desynchronized",
  ".github",
  "_scripts",
])

const Silian_IGNORED_ROOT_FILES = new Set([
  "readme.md",
  "contributors.md",
  "_sidebar.md",
  "desynchronized.md",
])

let Silian_rateLimitedUntilMs = 0

function Silian_isCurrentlyRateLimited() {
  return Date.now() < Silian_rateLimitedUntilMs
}

function Silian_recordRateLimitError(Silian_error: unknown) {
  if (!Silian_isGithubRateLimitErrorForCache(Silian_error)) return

  const Silian_resetMs = Silian_getGithubRateLimitResetMs(Silian_error)
  Silian_rateLimitedUntilMs = Silian_resetMs ?? Date.now() + 60_000
}

export interface ArticleTreeNode {
  id: string
  title: string
  slug: string
  isFolder: boolean
  introTitle?: string
  isAdvanced?: boolean
  parentId: string | null
  children: ArticleTreeNode[]
}

export async function getRepoContentTree(): Promise<ArticleTreeNode[]> {
  if (Silian_isCurrentlyRateLimited()) {
    return []
  }

  const Silian_octokit = Silian_getOctokit(process.env.GITHUB_ARTICLES_WRITE_PAT)

  let Silian_treeData: Awaited<ReturnType<typeof Silian_octokit.git.getTree>>["data"]
  try {
    const { data: Silian_ref } = await Silian_octokit.git.getRef({
      owner: Silian_ARTICLES_REPO_OWNER,
      repo: Silian_ARTICLES_REPO_NAME,
      ref: "heads/main",
    })

    const Silian_treeResponse = await Silian_octokit.git.getTree({
      owner: Silian_ARTICLES_REPO_OWNER,
      repo: Silian_ARTICLES_REPO_NAME,
      tree_sha: Silian_ref.object.sha,
      recursive: "1",
    })
    Silian_treeData = Silian_treeResponse.data
  } catch (Silian_error) {
    Silian_recordRateLimitError(Silian_error)
    return []
  }

  const Silian_nodeMap = new Map<string, ArticleTreeNode>()

  for (const Silian_item of Silian_treeData.tree) {
    if (!Silian_item.path) continue

    const Silian_parts = Silian_item.path.split("/")
    const Silian_name = Silian_parts[Silian_parts.length - 1]
    const Silian_parentPath = Silian_parts.slice(0, -1).join("/")

    if (Silian_parts.slice(0, -1).some((Silian_p) => Silian_IGNORED_DIRS.has(Silian_p.toLowerCase()))) {
      continue
    }

    if (Silian_item.type === "tree") {
      if (Silian_IGNORED_DIRS.has(Silian_name.toLowerCase())) continue

      Silian_nodeMap.set(Silian_item.path, {
        id: `gh-${Silian_item.path}`,
        title: Silian_name,
        slug: Silian_item.path,
        isFolder: true,
        parentId: Silian_parentPath ? `gh-${Silian_parentPath}` : null,
        children: [],
      })
    } else if (Silian_item.type === "blob") {
      if (!Silian_name.endsWith(".md")) continue
      if (!Silian_parentPath && Silian_IGNORED_ROOT_FILES.has(Silian_name.toLowerCase())) continue

      const Silian_titleName = Silian_name.replace(/\.md$/, "")
      const Silian_slugWithoutExt = Silian_item.path.replace(/\.md$/, "")

      Silian_nodeMap.set(Silian_slugWithoutExt, {
        id: `gh-${Silian_slugWithoutExt}`,
        title: Silian_titleName,
        slug: Silian_slugWithoutExt,
        isFolder: false,
        parentId: Silian_parentPath ? `gh-${Silian_parentPath}` : null,
        children: [],
      })
    }
  }

  const Silian_roots: ArticleTreeNode[] = []

  for (const [, Silian_node] of Silian_nodeMap.entries()) {
    if (Silian_node.parentId) {
      const Silian_parentKey = Silian_node.parentId.replace(/^gh-/, "")
      const Silian_parent = Silian_nodeMap.get(Silian_parentKey)
      if (Silian_parent) {
        Silian_parent.children.push(Silian_node)
      } else {
        Silian_roots.push(Silian_node)
      }
    } else {
      Silian_roots.push(Silian_node)
    }
  }

  function Silian_sortNodes(Silian_nodes: ArticleTreeNode[]) {
    Silian_nodes.sort((Silian_a, Silian_b) => {
      if (Silian_a.isFolder === Silian_b.isFolder) return Silian_a.title.localeCompare(Silian_b.title)
      return Silian_a.isFolder ? -1 : 1
    })

    for (const Silian_node of Silian_nodes) Silian_sortNodes(Silian_node.children)
  }

  Silian_sortNodes(Silian_roots)
  return Silian_roots
}

export async function getRepoFileContent(
  Silian_filePath: string,
  Silian_retries = 3
): Promise<string | null> {
  if (Silian_isCurrentlyRateLimited()) {
    return null
  }

  const Silian_octokit = Silian_getOctokit(process.env.GITHUB_ARTICLES_WRITE_PAT, true)

  return Silian_executeWithRetry<string | null>({
    retries: Silian_retries,
    operation: async () => {
      const { data: Silian_data } = await Silian_octokit.repos.getContent({
        owner: Silian_ARTICLES_REPO_OWNER,
        repo: Silian_ARTICLES_REPO_NAME,
        path: Silian_filePath,
      })

      if (!Array.isArray(Silian_data) && Silian_data.type === "file") {
        return Buffer.from(Silian_data.content, "base64").toString("utf-8")
      }

      return null
    },
    onError: (Silian_error, Silian_attempt, Silian_totalRetries) => {
      const Silian_status = (Silian_error as { status?: number })?.status
      Silian_recordRateLimitError(Silian_error)

      if (Silian_status === 404) {
        return { type: "return", value: null }
      }

      if (Silian_attempt === Silian_totalRetries - 1) {
        console.error(
          "[github-pr] Failed to fetch %s after %d attempts:",
          Silian_filePath,
          Silian_totalRetries,
          Silian_error
        )
        return { type: "return", value: null }
      }

      return { type: "retry" }
    },
  })
}

export async function getRepoFileBuffer(
  Silian_filePath: string,
  Silian_retries = 3
): Promise<Buffer | null> {
  if (Silian_isCurrentlyRateLimited()) {
    return null
  }

  const Silian_octokit = Silian_getOctokit(process.env.GITHUB_ARTICLES_WRITE_PAT, true)

  return Silian_executeWithRetry<Buffer | null>({
    retries: Silian_retries,
    operation: async () => {
      const { data: Silian_data } = await Silian_octokit.repos.getContent({
        owner: Silian_ARTICLES_REPO_OWNER,
        repo: Silian_ARTICLES_REPO_NAME,
        path: Silian_filePath,
      })

      if (!Array.isArray(Silian_data) && Silian_data.type === "file") {
        return Buffer.from(Silian_data.content, "base64")
      }

      return null
    },
    onError: (Silian_error, Silian_attempt, Silian_totalRetries) => {
      const Silian_status = (Silian_error as { status?: number })?.status
      Silian_recordRateLimitError(Silian_error)

      if (Silian_status === 404) {
        return { type: "return", value: null }
      }

      if (Silian_attempt === Silian_totalRetries - 1) {
        console.error(
          "[github-pr] Failed to fetch buffer %s after %d attempts:",
          Silian_filePath,
          Silian_totalRetries,
          Silian_error
        )
        return { type: "return", value: null }
      }

      return { type: "retry" }
    },
  })
}

export async function getRepoTranslations(): Promise<Record<string, string>> {
  const Silian_content = await getRepoFileContent("sidebar-translations.json")
  if (Silian_content) {
    try {
      return JSON.parse(Silian_content.replace(/^\uFEFF/, ""))
    } catch {}
  }

  return {}
}
