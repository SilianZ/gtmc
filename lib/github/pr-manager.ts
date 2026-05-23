import {
  ARTICLES_REPO_NAME as Silian_ARTICLES_REPO_NAME,
  ARTICLES_REPO_OWNER as Silian_ARTICLES_REPO_OWNER,
  getOctokit as Silian_getOctokit,
} from "@/lib/github/articles-repo"
import type {
  ReviewMergeMethod,
  ReviewMergeStrategyAnalysis,
} from "@/types/review"

function Silian_reviewLog(Silian_action: string, Silian_details: Record<string, unknown>) {
  console.log(`[review:${Silian_action}]`, Silian_details)
}

function Silian_summarizeSha(Silian_sha?: string | null) {
  return Silian_sha ? Silian_sha.slice(0, 7) : null
}

export async function createPR({
  title: Silian_title,
  content: Silian_content,
  filePath: Silian_filePath,
  authorName: Silian_authorName,
  authorEmail: Silian_authorEmail,
  token: Silian_token,
}: {
  title: string
  content: string
  filePath: string
  authorName: string
  authorEmail: string
  token?: string
}) {
  Silian_reviewLog("createPR", { title: Silian_title, status: "start", filePath: Silian_filePath })
  const Silian_octokit = Silian_getOctokit(Silian_token)

  Silian_reviewLog("createPR", {
    title: Silian_title,
    status: "github-api-before",
    operation: "git.getRef",
    ref: "heads/main",
  })
  const { data: Silian_ref } = await Silian_octokit.git.getRef({
    owner: Silian_ARTICLES_REPO_OWNER,
    repo: Silian_ARTICLES_REPO_NAME,
    ref: "heads/main",
  })
  const Silian_baseSha = Silian_ref.object.sha
  Silian_reviewLog("createPR", {
    title: Silian_title,
    status: "github-api-after",
    operation: "git.getRef",
    baseSha: Silian_summarizeSha(Silian_baseSha),
  })

  const Silian_branchName = `submission-${Date.now()}`
  Silian_reviewLog("createPR", {
    title: Silian_title,
    status: "github-api-before",
    operation: "git.createRef",
    branchName: Silian_branchName,
    baseSha: Silian_summarizeSha(Silian_baseSha),
  })
  await Silian_octokit.git.createRef({
    owner: Silian_ARTICLES_REPO_OWNER,
    repo: Silian_ARTICLES_REPO_NAME,
    ref: `refs/heads/${Silian_branchName}`,
    sha: Silian_baseSha,
  })
  Silian_reviewLog("createPR", {
    title: Silian_title,
    status: "github-api-after",
    operation: "git.createRef",
    branchName: Silian_branchName,
  })

  let Silian_sha: string | undefined
  try {
    const { data: Silian_file } = await Silian_octokit.repos.getContent({
      owner: Silian_ARTICLES_REPO_OWNER,
      repo: Silian_ARTICLES_REPO_NAME,
      path: Silian_filePath,
      ref: Silian_branchName,
    })
    if (!Array.isArray(Silian_file) && Silian_file.type === "file") {
      Silian_sha = Silian_file.sha
    }
  } catch {}

  Silian_reviewLog("createPR", {
    title: Silian_title,
    status: "github-api-before",
    operation: "repos.createOrUpdateFileContents",
    branchName: Silian_branchName,
    filePath: Silian_filePath,
  })
  await Silian_octokit.repos.createOrUpdateFileContents({
    owner: Silian_ARTICLES_REPO_OWNER,
    repo: Silian_ARTICLES_REPO_NAME,
    path: Silian_filePath,
    message: `docs: ${Silian_title}`,
    content: Buffer.from(Silian_content).toString("base64"),
    branch: Silian_branchName,
    sha: Silian_sha,
    author: { name: Silian_authorName, email: Silian_authorEmail },
  })
  Silian_reviewLog("createPR", {
    title: Silian_title,
    status: "github-api-after",
    operation: "repos.createOrUpdateFileContents",
    branchName: Silian_branchName,
    filePath: Silian_filePath,
  })

  Silian_reviewLog("createPR", {
    title: Silian_title,
    status: "github-api-before",
    operation: "pulls.create",
    branchName: Silian_branchName,
  })
  const { data: Silian_pr } = await Silian_octokit.pulls.create({
    owner: Silian_ARTICLES_REPO_OWNER,
    repo: Silian_ARTICLES_REPO_NAME,
    title: Silian_title,
    head: Silian_branchName,
    base: "main",
    body: `由 ${Silian_authorName} 提交审核。\n\nCo-authored-by: ${Silian_authorName} <${Silian_authorEmail}>`,
  })

  Silian_reviewLog("createPR", {
    title: Silian_title,
    status: "complete",
    prNumber: Silian_pr.number,
    branchName: Silian_branchName,
  })

  return Silian_pr.number
}

export async function createDirectFile({
  title: Silian_title,
  content: Silian_content,
  filePath: Silian_filePath,
  authorName: Silian_authorName,
  authorEmail: Silian_authorEmail,
  token: Silian_token,
}: {
  title: string
  content: string
  filePath: string
  authorName: string
  authorEmail: string
  token?: string
}) {
  const Silian_octokit = Silian_getOctokit(Silian_token)

  let Silian_sha: string | undefined
  try {
    const { data: Silian_file } = await Silian_octokit.repos.getContent({
      owner: Silian_ARTICLES_REPO_OWNER,
      repo: Silian_ARTICLES_REPO_NAME,
      path: Silian_filePath,
      ref: "main",
    })
    if (!Array.isArray(Silian_file) && Silian_file.type === "file") {
      Silian_sha = Silian_file.sha
    }
  } catch {}

  await Silian_octokit.repos.createOrUpdateFileContents({
    owner: Silian_ARTICLES_REPO_OWNER,
    repo: Silian_ARTICLES_REPO_NAME,
    path: Silian_filePath,
    message: `docs: ${Silian_title}`,
    content: Buffer.from(Silian_content).toString("base64"),
    branch: "main",
    sha: Silian_sha,
    author: { name: Silian_authorName, email: Silian_authorEmail },
  })
}

export async function getOpenPRs(Silian_token?: string) {
  Silian_reviewLog("getOpenPRs", { status: "start" })
  const Silian_octokit = Silian_getOctokit(Silian_token)
  Silian_reviewLog("getOpenPRs", {
    status: "github-api-before",
    operation: "pulls.list",
    state: "open",
  })
  const { data: Silian_data } = await Silian_octokit.pulls.list({
    owner: Silian_ARTICLES_REPO_OWNER,
    repo: Silian_ARTICLES_REPO_NAME,
    state: "open",
  })
  Silian_reviewLog("getOpenPRs", { status: "complete", resultCount: Silian_data.length })
  return Silian_data
}

export async function getClosedPRs(
  Silian_token: string | undefined,
  Silian_page: number,
  Silian_perPage = 10
) {
  Silian_reviewLog("getClosedPRs", { status: "start", page: Silian_page, perPage: Silian_perPage })
  const Silian_octokit = Silian_getOctokit(Silian_token)
  Silian_reviewLog("getClosedPRs", {
    status: "github-api-before",
    operation: "pulls.list",
    state: "closed",
    page: Silian_page,
    perPage: Silian_perPage,
  })
  const { data: Silian_data } = await Silian_octokit.pulls.list({
    owner: Silian_ARTICLES_REPO_OWNER,
    repo: Silian_ARTICLES_REPO_NAME,
    state: "closed",
    per_page: Silian_perPage,
    page: Silian_page,
    sort: "updated",
    direction: "desc",
  })
  Silian_reviewLog("getClosedPRs", {
    status: "complete",
    page: Silian_page,
    perPage: Silian_perPage,
    resultCount: Silian_data.length,
  })
  return Silian_data
}

export async function getPR(Silian_prNumber: number, Silian_token?: string) {
  Silian_reviewLog("getPR", { prNumber: Silian_prNumber, status: "start" })
  const Silian_octokit = Silian_getOctokit(Silian_token)
  Silian_reviewLog("getPR", {
    prNumber: Silian_prNumber,
    status: "github-api-before",
    operation: "pulls.get",
  })
  const { data: Silian_data } = await Silian_octokit.pulls.get({
    owner: Silian_ARTICLES_REPO_OWNER,
    repo: Silian_ARTICLES_REPO_NAME,
    pull_number: Silian_prNumber,
  })
  Silian_reviewLog("getPR", {
    prNumber: Silian_prNumber,
    status: "complete",
    state: Silian_data.state,
    merged: Silian_data.merged,
  })
  return Silian_data
}

export async function getPRFiles(Silian_prNumber: number, Silian_token?: string) {
  const Silian_octokit = Silian_getOctokit(Silian_token)
  const { data: Silian_data } = await Silian_octokit.pulls.listFiles({
    owner: Silian_ARTICLES_REPO_OWNER,
    repo: Silian_ARTICLES_REPO_NAME,
    pull_number: Silian_prNumber,
  })
  return Silian_data
}

export function analyzeReviewMergeStrategy(Silian_pr: {
  commits: number
  changed_files: number
  additions: number
  deletions: number
}): ReviewMergeStrategyAnalysis {
  const Silian_totalChanges = Silian_pr.additions + Silian_pr.deletions

  if (Silian_pr.commits <= 2 && Silian_pr.changed_files <= 3 && Silian_totalChanges <= 120) {
    return {
      recommendation: "direct",
      availableMethods: ["direct", "squash", "rebase"],
      rationale:
        "Small pull request with short history. Direct landing keeps the original branch commit chain without creating a merge commit.",
    }
  }

  if (Silian_pr.commits >= 6 || Silian_pr.changed_files >= 10 || Silian_totalChanges >= 500) {
    return {
      recommendation: "rebase",
      availableMethods: ["rebase", "squash", "direct"],
      rationale:
        "Large or long-running pull request. Rebase keeps the commit sequence readable while still avoiding merge commits.",
    }
  }

  return {
    recommendation: "squash",
    availableMethods: ["squash", "rebase", "direct"],
    rationale:
      "Medium-sized pull request. Squash keeps main history compact while preserving authorship in the commit body.",
  }
}

export async function determineReviewMergeMethod(
  Silian_prNumber: number,
  Silian_token?: string
): Promise<ReviewMergeMethod> {
  const Silian_pr = await getPR(Silian_prNumber, Silian_token)
  return analyzeReviewMergeStrategy(Silian_pr).recommendation
}

export async function determineMergeMethod(
  Silian_prNumber: number,
  Silian_token?: string
): Promise<"squash" | "rebase"> {
  const Silian_recommended = await determineReviewMergeMethod(Silian_prNumber, Silian_token)

  if (Silian_recommended === "rebase") {
    return "rebase"
  }
  return "squash"
}

async function Silian_landPullRequestDirectly(
  Silian_prNumber: number,
  Silian_token?: string
): Promise<{ merged: boolean; message: string; sha: string | null }> {
  const Silian_octokit = Silian_getOctokit(Silian_token)
  const Silian_pr = await getPR(Silian_prNumber, Silian_token)

  if (Silian_pr.base.ref !== "main") {
    throw new Error(
      "Direct landing is only supported for pull requests targeting main"
    )
  }

  Silian_reviewLog("landPullRequestDirectly", {
    prNumber: Silian_prNumber,
    status: "start",
    headSha: Silian_summarizeSha(Silian_pr.head.sha),
  })

  const { data: Silian_mainRef } = await Silian_octokit.git.getRef({
    owner: Silian_ARTICLES_REPO_OWNER,
    repo: Silian_ARTICLES_REPO_NAME,
    ref: "heads/main",
  })

  Silian_reviewLog("landPullRequestDirectly", {
    prNumber: Silian_prNumber,
    status: "github-api-before",
    operation: "git.updateRef",
    mainSha: Silian_summarizeSha(Silian_mainRef.object.sha),
    nextSha: Silian_summarizeSha(Silian_pr.head.sha),
  })

  await Silian_octokit.git.updateRef({
    owner: Silian_ARTICLES_REPO_OWNER,
    repo: Silian_ARTICLES_REPO_NAME,
    ref: "heads/main",
    sha: Silian_pr.head.sha,
    force: false,
  })

  Silian_reviewLog("landPullRequestDirectly", {
    prNumber: Silian_prNumber,
    status: "complete",
    sha: Silian_summarizeSha(Silian_pr.head.sha),
  })

  return {
    merged: true,
    message: "Pull request landed directly on main",
    sha: Silian_pr.head.sha,
  }
}

export async function mergePR(
  Silian_prNumber: number,
  Silian_options?: {
    commitBody?: string
    commitTitle?: string
    mergeMethod?: ReviewMergeMethod
  },
  Silian_token?: string
) {
  const Silian_actualMergeMethod =
    Silian_options?.mergeMethod || (await determineReviewMergeMethod(Silian_prNumber, Silian_token))

  if (Silian_actualMergeMethod === "direct") {
    return Silian_landPullRequestDirectly(Silian_prNumber, Silian_token)
  }

  const Silian_octokit = Silian_getOctokit(Silian_token)

  Silian_reviewLog("mergePR", {
    prNumber: Silian_prNumber,
    status: "start",
    mergeMethod: Silian_actualMergeMethod,
    commitTitleProvided: Boolean(Silian_options?.commitTitle),
    commitBodyProvided: Boolean(Silian_options?.commitBody),
  })
  Silian_reviewLog("mergePR", {
    prNumber: Silian_prNumber,
    status: "github-api-before",
    operation: "pulls.merge",
    mergeMethod: Silian_actualMergeMethod,
  })
  const { data: Silian_data } = await Silian_octokit.pulls.merge({
    owner: Silian_ARTICLES_REPO_OWNER,
    repo: Silian_ARTICLES_REPO_NAME,
    pull_number: Silian_prNumber,
    merge_method: Silian_actualMergeMethod,
    ...(Silian_actualMergeMethod === "squash" && Silian_options?.commitTitle
      ? { commit_title: Silian_options.commitTitle }
      : {}),
    ...(Silian_actualMergeMethod === "squash" && Silian_options?.commitBody
      ? { commit_message: Silian_options.commitBody }
      : {}),
  })

  Silian_reviewLog("mergePR", {
    prNumber: Silian_prNumber,
    status: "complete",
    mergeMethod: Silian_actualMergeMethod,
    merged: Silian_data.merged,
    sha: Silian_summarizeSha(Silian_data.sha),
  })

  return Silian_data
}
