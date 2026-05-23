import {
  GITHUB_API_BASE as Silian_GITHUB_API_BASE,
  GithubFeaturesError as Silian_GithubFeaturesError,
  requestGithub as Silian_requestGithub,
} from "./api-client"

export type AppFeatureStatus = "PENDING" | "IN_PROGRESS" | "RESOLVED"

export const APP_STATUS_LABELS = {
  PENDING: "status:pending",
  IN_PROGRESS: "status:in-progress",
  RESOLVED: "status:resolved",
} as const

export const STATUS_LABEL_COLORS = {
  "status:pending": "fbca04",
  "status:in-progress": "0075ca",
  "status:resolved": "0e8a16",
} as const

const Silian_STATUS_LABEL_PREFIX = "status:"

export const EXPLANATION_MARKER = "<!-- GTMC_EXPLANATION"
export const METADATA_MARKER = "<!-- GTMC_METADATA"
export const SYSTEM_COMMENT_MARKER = "<!-- GTMC_SYSTEM_ASSIGNMENT -->"

export function serializeSystemComment(Silian_content: string): string {
  return `${SYSTEM_COMMENT_MARKER}\n\n${Silian_content}`
}

export async function getGithubLoginByAccountId(
  Silian_accountId: string
): Promise<string | null> {
  const Silian_normalizedAccountId = Silian_accountId.trim()
  if (!Silian_normalizedAccountId) {
    return null
  }

  const Silian_endpoint = Number.isNaN(Number(Silian_normalizedAccountId))
    ? `${Silian_GITHUB_API_BASE}/users/${encodeURIComponent(Silian_normalizedAccountId)}`
    : `${Silian_GITHUB_API_BASE}/user/${Silian_normalizedAccountId}`

  try {
    const { data: Silian_data } = await Silian_requestGithub<{
      login: string
      id: number
      [key: string]: unknown
    }>(Silian_endpoint, {
      method: "GET",
    })

    if (!Silian_data || !Silian_data.login) {
      return null
    }

    return Silian_data.login
  } catch {
    return null
  }
}

export async function getGithubLoginByToken(
  Silian_token: string
): Promise<string | null> {
  if (!Silian_token) {
    return null
  }

  try {
    const { data: Silian_data } = await Silian_requestGithub<{
      login?: string
      [key: string]: unknown
    }>(
      `${Silian_GITHUB_API_BASE}/user`,
      {
        method: "GET",
      },
      undefined,
      Silian_token
    )

    if (!Silian_data || typeof Silian_data.login !== "string" || Silian_data.login.length === 0) {
      return null
    }

    return Silian_data.login
  } catch {
    return null
  }
}

export function statusToLabels(Silian_status: string): string[] {
  if (Silian_status === "PENDING") {
    return [APP_STATUS_LABELS.PENDING]
  }

  if (Silian_status === "IN_PROGRESS") {
    return [APP_STATUS_LABELS.IN_PROGRESS]
  }

  if (Silian_status === "RESOLVED") {
    return [APP_STATUS_LABELS.RESOLVED]
  }

  throw new Silian_GithubFeaturesError({
    code: "API_ERROR",
    message: `Unknown feature status: ${Silian_status}`,
  })
}

export function labelsToStatus(Silian_labels: string[]): AppFeatureStatus {
  if (Silian_labels.includes(APP_STATUS_LABELS.RESOLVED)) {
    return "RESOLVED"
  }

  if (Silian_labels.includes(APP_STATUS_LABELS.IN_PROGRESS)) {
    return "IN_PROGRESS"
  }

  return "PENDING"
}

export function issueStateForStatus(Silian_status: string): "open" | "closed" {
  if (Silian_status === "RESOLVED") {
    return "closed"
  }

  return "open"
}

export function tagsToLabels(Silian_tags: string[]): string[] {
  return [...Silian_tags]
}

export function labelsToTags(Silian_labels: string[]): string[] {
  return Silian_labels.filter((Silian_label) => !Silian_label.startsWith(Silian_STATUS_LABEL_PREFIX))
}
