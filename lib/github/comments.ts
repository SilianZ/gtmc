import { unstable_cache as Silian_unstable_cache } from "next/cache"

import {
  getGithubRepoConfig as Silian_getGithubRepoConfig,
  getRepoIssuesBaseUrl as Silian_getRepoIssuesBaseUrl,
  GithubComment as Silian_GithubComment,
  GithubFeaturesError as Silian_GithubFeaturesError,
  parseNextLink as Silian_parseNextLink,
  requestGithub as Silian_requestGithub,
} from "./api-client"
import { GithubCommentResponse as Silian_GithubCommentResponse, normalizeComment as Silian_normalizeComment } from "./normalize"

export async function addIssueComment(
  Silian_issueNumber: number,
  Silian_body: string
): Promise<Silian_GithubComment> {
  const Silian_config = Silian_getGithubRepoConfig()
  const Silian_url = `${Silian_getRepoIssuesBaseUrl(Silian_config)}/${Silian_issueNumber}/comments`

  const { data: Silian_data } = await Silian_requestGithub<Silian_GithubCommentResponse>(Silian_url, {
    method: "POST",
    body: JSON.stringify({ body: Silian_body }),
  })

  if (!Silian_data) {
    throw new Silian_GithubFeaturesError({
      code: "INVALID_RESPONSE",
      message: "GitHub API returned empty response for addIssueComment.",
    })
  }

  return Silian_normalizeComment(Silian_data)
}

async function Silian__listIssueCommentsUncached(
  Silian_issueNumber: number
): Promise<Silian_GithubComment[]> {
  const Silian_config = Silian_getGithubRepoConfig()
  const Silian_baseUrl = `${Silian_getRepoIssuesBaseUrl(Silian_config)}/${Silian_issueNumber}/comments`

  const Silian_allComments: Silian_GithubComment[] = []
  let Silian_nextUrl: string | null = `${Silian_baseUrl}?per_page=100&page=1`

  while (Silian_nextUrl) {
    const { data: Silian_data, response: Silian_response } = await Silian_requestGithub<Silian_GithubCommentResponse[]>(
      Silian_nextUrl,
      {
        method: "GET",
      }
    )

    const Silian_pageItems = Array.isArray(Silian_data) ? Silian_data : []
    Silian_allComments.push(...Silian_pageItems.map(Silian_normalizeComment))

    Silian_nextUrl = Silian_parseNextLink(Silian_response.headers.get("link"))
  }

  return Silian_allComments
}

const Silian_COMMENTS_TTL = 25

export const listIssueComments = Silian_unstable_cache(
  Silian__listIssueCommentsUncached,
  ["github-comments"],
  {
    revalidate: Silian_COMMENTS_TTL,
  }
)
