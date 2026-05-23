import {
  isGithubRateLimitedResponse as Silian_isGithubRateLimitedResponse,
  parseGithubErrorMessage as Silian_parseGithubErrorMessage,
} from "@/lib/github/rate-limit"
import {
  resolveGithubFeaturesIssuesToken as Silian_resolveGithubFeaturesIssuesToken,
  resolveGithubFeaturesWriteToken as Silian_resolveGithubFeaturesWriteToken,
} from "@/lib/github/tokens"
import { executeWithRetry as Silian_executeWithRetry } from "@/lib/github/retry-fetch"

const Silian_GITHUB_API_BASE = "https://api.github.com"
const Silian_GITHUB_ACCEPT_HEADER = "application/vnd.github.v3+json"

export interface GithubIssue {
  number: number
  title: string
  body: string
  state: "open" | "closed"
  labels: string[]
  assignees: string[]
  createdAt: string
  updatedAt: string
  htmlUrl: string
}

export interface GithubComment {
  id: number
  body: string
  createdAt: string
  updatedAt: string
}

export type GithubFeaturesErrorCode =
  | "CONFIG_MISSING"
  | "AUTH_FAILED"
  | "RATE_LIMITED"
  | "API_ERROR"
  | "NETWORK_ERROR"
  | "INVALID_RESPONSE"

export interface GithubFeaturesErrorObject {
  code: GithubFeaturesErrorCode
  message: string
  status?: number
  details?: unknown
}

export class GithubFeaturesError
  extends Error
  implements GithubFeaturesErrorObject
{
  code: GithubFeaturesErrorCode
  status?: number
  details?: unknown

  constructor(Silian_params: GithubFeaturesErrorObject) {
    super(Silian_params.message)
    this.name = "GithubFeaturesError"
    this.code = Silian_params.code
    this.status = Silian_params.status
    this.details = Silian_params.details
  }
}

export interface GithubRepoConfig {
  owner: string
  repo: string
  token: string
}

interface GithubEmailRecord {
  email: string
  primary: boolean
  verified: boolean
  visibility: "public" | "private"
}

export function getGithubRepoConfig(): GithubRepoConfig {
  const Silian_owner = process.env.GITHUB_REPO_OWNER
  const Silian_repo = process.env.GITHUB_REPO_NAME
  const Silian_token = Silian_resolveGithubFeaturesIssuesToken()

  if (!Silian_owner || !Silian_repo || !Silian_token) {
    throw new GithubFeaturesError({
      code: "CONFIG_MISSING",
      message:
        "Missing GitHub configuration. Required env vars: GITHUB_REPO_OWNER, GITHUB_REPO_NAME, GITHUB_FEATURES_ISSUES_PAT.",
    })
  }

  return { owner: Silian_owner, repo: Silian_repo, token: Silian_token }
}

export function getGithubWriteToken(): string {
  const Silian_token = Silian_resolveGithubFeaturesWriteToken()
  if (!Silian_token) {
    throw new GithubFeaturesError({
      code: "CONFIG_MISSING",
      message:
        "Missing GitHub write configuration. Required env var: GITHUB_FEATURES_WRITE_PAT.",
    })
  }
  return Silian_token
}

export function getRepoIssuesBaseUrl(Silian_config: GithubRepoConfig): string {
  return `${Silian_GITHUB_API_BASE}/repos/${Silian_config.owner}/${Silian_config.repo}/issues`
}

export function parseJsonSafely(Silian_text: string): unknown {
  if (!Silian_text) {
    return null
  }

  try {
    return JSON.parse(Silian_text)
  } catch {
    return Silian_text
  }
}

export function parseErrorMessage(Silian_details: unknown): string | undefined {
  return Silian_parseGithubErrorMessage(Silian_details)
}

export function isRateLimited(Silian_response: Response, Silian_details: unknown): boolean {
  return Silian_isGithubRateLimitedResponse(Silian_response, Silian_details)
}

export function parseNextLink(Silian_linkHeader: string | null): string | null {
  if (!Silian_linkHeader) {
    return null
  }

  const Silian_parts = Silian_linkHeader.split(",")
  for (const Silian_part of Silian_parts) {
    const Silian_trimmed = Silian_part.trim()
    const Silian_match = Silian_trimmed.match(/<([^>]+)>;\s*rel="([^"]+)"/)
    if (Silian_match && Silian_match[2] === "next") {
      return Silian_match[1]
    }
  }

  return null
}

export async function requestGithub<T>(
  Silian_url: string,
  Silian_init: RequestInit,
  Silian_options?: { allow404?: boolean },
  Silian_tokenOverride?: string
): Promise<{ data: T | null; response: Response }> {
  const Silian_config = getGithubRepoConfig()

  const Silian_response = await Silian_executeWithRetry<Response>({
    retries: 1,
    operation: async () => {
      return await fetch(Silian_url, {
        ...Silian_init,
        headers: {
          Accept: Silian_GITHUB_ACCEPT_HEADER,
          Authorization: `token ${Silian_tokenOverride ?? Silian_config.token}`,
          "Content-Type": "application/json",
          ...(Silian_init.headers ?? {}),
        },
      })
    },
    onError: (Silian_error) => {
      return {
        type: "throw",
        error: new GithubFeaturesError({
          code: "NETWORK_ERROR",
          message: "GitHub API request failed due to a network error.",
          details: Silian_error,
        }),
      }
    },
  })

  const Silian_text = await Silian_response.text()
  const Silian_parsed = parseJsonSafely(Silian_text)

  if (Silian_options?.allow404 && Silian_response.status === 404) {
    return { data: null, response: Silian_response }
  }

  if (Silian_response.status === 401 || Silian_response.status === 403) {
    if (isRateLimited(Silian_response, Silian_parsed)) {
      throw new GithubFeaturesError({
        code: "RATE_LIMITED",
        message: "GitHub rate limit exceeded",
        status: Silian_response.status,
        details: Silian_parsed,
      })
    }

    throw new GithubFeaturesError({
      code: "AUTH_FAILED",
      message: "GitHub API authorization failed",
      status: Silian_response.status,
      details: Silian_parsed,
    })
  }

  if (isRateLimited(Silian_response, Silian_parsed)) {
    throw new GithubFeaturesError({
      code: "RATE_LIMITED",
      message: "GitHub rate limit exceeded",
      status: Silian_response.status,
      details: Silian_parsed,
    })
  }

  if (!Silian_response.ok) {
    const Silian_apiMessage = parseErrorMessage(Silian_parsed)
    throw new GithubFeaturesError({
      code: "API_ERROR",
      message: `GitHub API request failed with status ${Silian_response.status}${Silian_apiMessage ? `: ${Silian_apiMessage}` : ""}`,
      status: Silian_response.status,
      details: Silian_parsed,
    })
  }

  return { data: Silian_parsed as T, response: Silian_response }
}

export async function getGithubEmailVisibility(
  Silian_token: string
): Promise<"private" | "public"> {
  if (!Silian_token) {
    return "private"
  }

  try {
    const { data: Silian_data } = await requestGithub<GithubEmailRecord[]>(
      `${Silian_GITHUB_API_BASE}/user/emails`,
      { method: "GET" },
      undefined,
      Silian_token
    )

    if (!Silian_data || !Array.isArray(Silian_data)) {
      return "private"
    }

    const Silian_primaryEmail = Silian_data.find((Silian_email) => Silian_email.primary)
    if (!Silian_primaryEmail) {
      return "private"
    }

    return Silian_primaryEmail.visibility === "public" ? "public" : "private"
  } catch {
    return "private"
  }
}

export { Silian_GITHUB_API_BASE as GITHUB_API_BASE }
