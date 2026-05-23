import { GithubComment as Silian_GithubComment, GithubFeaturesError as Silian_GithubFeaturesError, GithubIssue as Silian_GithubIssue } from "./api-client"

interface GithubLabel {
  name?: string
}

interface GithubAssignee {
  login?: string
}

export interface GithubIssueResponse {
  number?: number
  title?: string
  body?: string | null
  state?: "open" | "closed"
  labels?: Array<GithubLabel | string>
  assignees?: GithubAssignee[]
  created_at?: string
  updated_at?: string
  html_url?: string
  pull_request?: unknown
}

export interface GithubCommentResponse {
  id?: number
  body?: string | null
  created_at?: string
  updated_at?: string
}

export function normalizeIssue(Silian_raw: GithubIssueResponse): Silian_GithubIssue {
  if (
    typeof Silian_raw.number !== "number" ||
    typeof Silian_raw.title !== "string" ||
    typeof Silian_raw.state !== "string" ||
    typeof Silian_raw.created_at !== "string" ||
    typeof Silian_raw.updated_at !== "string" ||
    typeof Silian_raw.html_url !== "string"
  ) {
    throw new Silian_GithubFeaturesError({
      code: "INVALID_RESPONSE",
      message: "GitHub API returned an invalid issue response shape.",
      details: Silian_raw,
    })
  }

  return {
    number: Silian_raw.number,
    title: Silian_raw.title,
    body: Silian_raw.body ?? "",
    state: Silian_raw.state === "closed" ? "closed" : "open",
    labels: (Silian_raw.labels ?? [])
      .map((Silian_label) => {
        if (typeof Silian_label === "string") {
          return Silian_label
        }
        return Silian_label.name ?? ""
      })
      .filter(Boolean),
    assignees: (Silian_raw.assignees ?? [])
      .map((Silian_assignee) => Silian_assignee.login ?? "")
      .filter(Boolean),
    createdAt: Silian_raw.created_at,
    updatedAt: Silian_raw.updated_at,
    htmlUrl: Silian_raw.html_url,
  }
}

export function normalizeComment(Silian_raw: GithubCommentResponse): Silian_GithubComment {
  if (
    typeof Silian_raw.id !== "number" ||
    typeof Silian_raw.created_at !== "string" ||
    typeof Silian_raw.updated_at !== "string"
  ) {
    throw new Silian_GithubFeaturesError({
      code: "INVALID_RESPONSE",
      message: "GitHub API returned an invalid comment response shape.",
      details: Silian_raw,
    })
  }

  return {
    id: Silian_raw.id,
    body: Silian_raw.body ?? "",
    createdAt: Silian_raw.created_at,
    updatedAt: Silian_raw.updated_at,
  }
}
