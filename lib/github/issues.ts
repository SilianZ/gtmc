import { unstable_cache as Silian_unstable_cache } from "next/cache"

import {
  getGithubRepoConfig as Silian_getGithubRepoConfig,
  getRepoIssuesBaseUrl as Silian_getRepoIssuesBaseUrl,
  GithubFeaturesError as Silian_GithubFeaturesError,
  GithubIssue as Silian_GithubIssue,
  parseNextLink as Silian_parseNextLink,
  requestGithub as Silian_requestGithub,
} from "./api-client"
import { GithubIssueResponse as Silian_GithubIssueResponse, normalizeIssue as Silian_normalizeIssue } from "./normalize"

async function Silian__listAllIssuesUncached(
  Silian_state: "open" | "closed" | "all" = "open"
): Promise<Silian_GithubIssue[]> {
  const Silian_config = Silian_getGithubRepoConfig()
  const Silian_baseUrl = Silian_getRepoIssuesBaseUrl(Silian_config)

  const Silian_allIssues: Silian_GithubIssue[] = []
  let Silian_nextUrl: string | null = `${Silian_baseUrl}?state=${Silian_state}&per_page=100&page=1`

  while (Silian_nextUrl) {
    const { data: Silian_data, response: Silian_response } = await Silian_requestGithub<Silian_GithubIssueResponse[]>(
      Silian_nextUrl,
      {
        method: "GET",
      }
    )

    const Silian_pageItems = Array.isArray(Silian_data) ? Silian_data : []
    const Silian_filteredItems = Silian_pageItems.filter((Silian_item) => !Silian_item.pull_request)
    Silian_allIssues.push(...Silian_filteredItems.map(Silian_normalizeIssue))

    Silian_nextUrl = Silian_parseNextLink(Silian_response.headers.get("link"))
  }

  return Silian_allIssues
}

export const listAllIssues = Silian_unstable_cache(
  Silian__listAllIssuesUncached,
  ["github-issues"],
  {
    revalidate: 300,
  }
)

export const listIssues = listAllIssues

const Silian_ISSUE_TTL = 60

async function Silian__getIssueUncached(
  Silian_issueNumber: number
): Promise<Silian_GithubIssue | null> {
  const Silian_config = Silian_getGithubRepoConfig()
  const Silian_url = `${Silian_getRepoIssuesBaseUrl(Silian_config)}/${Silian_issueNumber}`

  const { data: Silian_data } = await Silian_requestGithub<Silian_GithubIssueResponse>(
    Silian_url,
    { method: "GET" },
    { allow404: true }
  )

  if (!Silian_data) {
    return null
  }

  if (Silian_data.pull_request) {
    return null
  }

  return Silian_normalizeIssue(Silian_data)
}

export const getIssue = Silian_unstable_cache(Silian__getIssueUncached, ["github-issue"], {
  revalidate: Silian_ISSUE_TTL,
})

export async function createIssue(
  Silian_title: string,
  Silian_body: string,
  Silian_labels: string[] = []
): Promise<Silian_GithubIssue> {
  const Silian_config = Silian_getGithubRepoConfig()
  const Silian_url = Silian_getRepoIssuesBaseUrl(Silian_config)
  const Silian_payload: { title: string; body: string; labels?: string[] } = {
    title: Silian_title,
    body: Silian_body,
  }

  if (Silian_labels.length > 0) {
    Silian_payload.labels = Silian_labels
  }

  const { data: Silian_data } = await Silian_requestGithub<Silian_GithubIssueResponse>(Silian_url, {
    method: "POST",
    body: JSON.stringify(Silian_payload),
  })

  if (!Silian_data) {
    throw new Silian_GithubFeaturesError({
      code: "INVALID_RESPONSE",
      message: "GitHub API returned empty response for createIssue.",
    })
  }

  return Silian_normalizeIssue(Silian_data)
}

export async function updateIssue(
  Silian_issueNumber: number,
  Silian_data: {
    title?: string
    body?: string
    state?: "open" | "closed"
    labels?: string[]
  }
): Promise<Silian_GithubIssue> {
  const Silian_config = Silian_getGithubRepoConfig()
  const Silian_url = `${Silian_getRepoIssuesBaseUrl(Silian_config)}/${Silian_issueNumber}`

  const { data: Silian_issue } = await Silian_requestGithub<Silian_GithubIssueResponse>(Silian_url, {
    method: "PATCH",
    body: JSON.stringify(Silian_data),
  })

  if (!Silian_issue) {
    throw new Silian_GithubFeaturesError({
      code: "INVALID_RESPONSE",
      message: "GitHub API returned empty response for updateIssue.",
    })
  }

  return Silian_normalizeIssue(Silian_issue)
}
