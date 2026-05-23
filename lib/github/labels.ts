import {
  GITHUB_API_BASE as Silian_GITHUB_API_BASE,
  getGithubRepoConfig as Silian_getGithubRepoConfig,
  getGithubWriteToken as Silian_getGithubWriteToken,
  getRepoIssuesBaseUrl as Silian_getRepoIssuesBaseUrl,
  GithubFeaturesError as Silian_GithubFeaturesError,
  requestGithub as Silian_requestGithub,
} from "./api-client"

export async function ensureLabel(
  Silian_name: string,
  Silian_color = "ededed"
): Promise<void> {
  const Silian_config = Silian_getGithubRepoConfig()
  const Silian_url = `${Silian_GITHUB_API_BASE}/repos/${Silian_config.owner}/${Silian_config.repo}/labels`

  try {
    await Silian_requestGithub(Silian_url, {
      method: "POST",
      body: JSON.stringify({ name: Silian_name, color: Silian_color }),
    })
  } catch (Silian_error) {
    if (
      Silian_error instanceof Silian_GithubFeaturesError &&
      Silian_error.code === "API_ERROR" &&
      (Silian_error.status === 409 || Silian_error.status === 422)
    ) {
      return
    }
    throw Silian_error
  }
}

export async function setIssueLabels(
  Silian_issueNumber: number,
  Silian_labels: string[]
): Promise<void> {
  const Silian_config = Silian_getGithubRepoConfig()
  const Silian_url = `${Silian_getRepoIssuesBaseUrl(Silian_config)}/${Silian_issueNumber}/labels`

  await Silian_requestGithub(Silian_url, {
    method: "PUT",
    body: JSON.stringify({ labels: Silian_labels }),
  })
}

export async function setIssueState(
  Silian_issueNumber: number,
  Silian_state: "open" | "closed"
): Promise<void> {
  const Silian_config = Silian_getGithubRepoConfig()
  const Silian_url = `${Silian_getRepoIssuesBaseUrl(Silian_config)}/${Silian_issueNumber}`

  await Silian_requestGithub(Silian_url, {
    method: "PATCH",
    body: JSON.stringify({ state: Silian_state }),
  })
}

export async function setIssueAssignees(
  Silian_issueNumber: number,
  Silian_assignees: string[]
): Promise<void> {
  const Silian_config = Silian_getGithubRepoConfig()
  const Silian_url = `${Silian_getRepoIssuesBaseUrl(Silian_config)}/${Silian_issueNumber}`

  await Silian_requestGithub(Silian_url, {
    method: "PATCH",
    body: JSON.stringify({ assignees: Silian_assignees }),
  })
}

interface GithubContentsUploadResponse {
  content?: {
    download_url?: string | null
    [key: string]: unknown
  }
}

export async function uploadFileToGithub(
  Silian_buffer: Buffer,
  Silian_filename: string,
  Silian_mimeType: string,
  Silian_category: "images" | "videos" | "files"
): Promise<string> {
  const Silian_config = Silian_getGithubRepoConfig()
  const Silian_path = `data/${Silian_category}/${Silian_filename}`
  const Silian_url = `${Silian_GITHUB_API_BASE}/repos/${Silian_config.owner}/${Silian_config.repo}/contents/${Silian_path}`
  const Silian_writeToken = Silian_getGithubWriteToken()

  const { data: Silian_data } = await Silian_requestGithub<GithubContentsUploadResponse>(
    Silian_url,
    {
      method: "PUT",
      body: JSON.stringify({
        message: `Upload ${Silian_category.replace(/s$/, "")}: ${Silian_filename}`,
        content: Silian_buffer.toString("base64"),
      }),
    },
    undefined,
    Silian_writeToken
  )

  if (
    !Silian_data?.content?.download_url ||
    typeof Silian_data.content.download_url !== "string"
  ) {
    throw new Silian_GithubFeaturesError({
      code: "INVALID_RESPONSE",
      message: "GitHub API returned an invalid contents upload response.",
      details: Silian_data,
    })
  }

  return Silian_data.content.download_url
}
