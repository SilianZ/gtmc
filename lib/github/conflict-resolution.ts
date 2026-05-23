import {
  ARTICLES_REPO_NAME as Silian_ARTICLES_REPO_NAME,
  ARTICLES_REPO_OWNER as Silian_ARTICLES_REPO_OWNER,
  getOctokit as Silian_getOctokit,
} from "@/lib/github/articles-repo"
import { determineMergeMethod as Silian_determineMergeMethod, getPR as Silian_getPR } from "@/lib/github/pr-manager"

export async function resolveConflictAndMerge(
  Silian_prNumber: number,
  Silian_filePath: string,
  Silian_resolvedContent: string,
  Silian_token?: string,
  Silian_mergeMethod?: "squash" | "rebase"
) {
  const Silian_octokit = Silian_getOctokit(Silian_token)
  const Silian_pr = await Silian_getPR(Silian_prNumber, Silian_token)
  const Silian_actualMergeMethod =
    Silian_mergeMethod || (await Silian_determineMergeMethod(Silian_prNumber, Silian_token))
  const Silian_branchName = Silian_pr.head.ref
  const Silian_prHeadSha = Silian_pr.head.sha

  const { data: Silian_mainRef } = await Silian_octokit.git.getRef({
    owner: Silian_ARTICLES_REPO_OWNER,
    repo: Silian_ARTICLES_REPO_NAME,
    ref: "heads/main",
  })
  const Silian_mainSha = Silian_mainRef.object.sha

  const { data: Silian_commitInfo } = await Silian_octokit.repos.getCommit({
    owner: Silian_ARTICLES_REPO_OWNER,
    repo: Silian_ARTICLES_REPO_NAME,
    ref: Silian_prHeadSha,
  })
  const Silian_originalAuthor = Silian_commitInfo.commit.author
  const Silian_originalMessage = Silian_commitInfo.commit.message

  const { data: Silian_files } = await Silian_octokit.pulls.listFiles({
    owner: Silian_ARTICLES_REPO_OWNER,
    repo: Silian_ARTICLES_REPO_NAME,
    pull_number: Silian_prNumber,
  })

  type TreeEntry = {
    path?: string
    mode?: "100644" | "100755" | "040000" | "160000" | "120000"
    type?: "blob" | "tree" | "commit"
    sha?: string | null
    content?: string
  }

  const Silian_treeEntries: TreeEntry[] = []
  let Silian_resolvedFileAdded = false

  for (const Silian_f of Silian_files) {
    if (Silian_f.filename === Silian_filePath) {
      Silian_resolvedFileAdded = true
      Silian_treeEntries.push({
        path: Silian_f.filename,
        mode: "100644",
        type: "blob",
        content: Silian_resolvedContent,
      })
    } else if (Silian_f.status === "removed") {
      Silian_treeEntries.push({
        path: Silian_f.filename,
        mode: "100644",
        type: "blob",
        sha: null,
      })
    } else {
      Silian_treeEntries.push({
        path: Silian_f.filename,
        mode: "100644",
        type: "blob",
        sha: Silian_f.sha,
      })
    }
  }

  if (!Silian_resolvedFileAdded) {
    Silian_treeEntries.push({
      path: Silian_filePath,
      mode: "100644",
      type: "blob",
      content: Silian_resolvedContent,
    })
  }

  const { data: Silian_tree } = await Silian_octokit.git.createTree({
    owner: Silian_ARTICLES_REPO_OWNER,
    repo: Silian_ARTICLES_REPO_NAME,
    base_tree: Silian_mainSha,
    tree: Silian_treeEntries,
  })

  const { data: Silian_newCommit } = await Silian_octokit.git.createCommit({
    owner: Silian_ARTICLES_REPO_OWNER,
    repo: Silian_ARTICLES_REPO_NAME,
    message: `Resolve merge conflicts for ${Silian_filePath}\n\nOriginal message:\n${Silian_originalMessage}`,
    tree: Silian_tree.sha,
    parents: [Silian_mainSha],
    author: {
      name: Silian_originalAuthor?.name || "GTMC Bot",
      email: Silian_originalAuthor?.email || "bot@gtmc.dev",
      date: Silian_originalAuthor?.date,
    },
  })

  await Silian_octokit.git.updateRef({
    owner: Silian_ARTICLES_REPO_OWNER,
    repo: Silian_ARTICLES_REPO_NAME,
    ref: `heads/${Silian_branchName}`,
    sha: Silian_newCommit.sha,
    force: true,
  })

  const { data: Silian_data } = await Silian_octokit.pulls.merge({
    owner: Silian_ARTICLES_REPO_OWNER,
    repo: Silian_ARTICLES_REPO_NAME,
    pull_number: Silian_prNumber,
    merge_method: Silian_actualMergeMethod,
  })

  return Silian_data
}
