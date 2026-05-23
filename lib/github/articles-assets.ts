import {
  ARTICLES_REPO_NAME as Silian_ARTICLES_REPO_NAME,
  ARTICLES_REPO_OWNER as Silian_ARTICLES_REPO_OWNER,
  getGitHubWriteToken as Silian_getGitHubWriteToken,
  getOctokit as Silian_getOctokit,
} from "@/lib/github/articles-repo"
import type { FileCategory } from "@/lib/file-upload"

type ArticleAssetUploadErrorCode =
  | "CONFIG_MISSING"
  | "AUTH_FAILED"
  | "API_ERROR"

export class ArticleAssetUploadError extends Error {
  code: ArticleAssetUploadErrorCode
  status?: number

  constructor(
    Silian_code: ArticleAssetUploadErrorCode,
    Silian_message: string,
    Silian_status?: number
  ) {
    super(Silian_message)
    this.name = "ArticleAssetUploadError"
    this.code = Silian_code
    this.status = Silian_status
  }
}

export async function uploadArticleAssetToGithub({
  buffer: Silian_buffer,
  category: Silian_category,
  filename: Silian_filename,
  token: Silian_token,
}: {
  buffer: Buffer
  category: FileCategory
  filename: string
  token?: string | null
}) {
  const Silian_writeToken = Silian_getGitHubWriteToken(Silian_token)

  if (!Silian_writeToken) {
    throw new ArticleAssetUploadError(
      "CONFIG_MISSING",
      "Missing articles repo write token."
    )
  }

  const Silian_octokit = Silian_getOctokit(Silian_writeToken, true)
  const Silian_filePath = `data/${Silian_category}/${Silian_filename}`

  try {
    const { data: Silian_data } = await Silian_octokit.repos.createOrUpdateFileContents({
      owner: Silian_ARTICLES_REPO_OWNER,
      repo: Silian_ARTICLES_REPO_NAME,
      path: Silian_filePath,
      message: `docs(assets): upload ${Silian_category.replace(/s$/, "")} ${Silian_filename}`,
      content: Silian_buffer.toString("base64"),
    })

    if (!Array.isArray(Silian_data.content) && Silian_data.content?.download_url) {
      return Silian_data.content.download_url
    }

    return buildArticleAssetUrl(Silian_filePath)
  } catch (Silian_error) {
    const Silian_status =
      typeof Silian_error === "object" && Silian_error !== null && "status" in Silian_error
        ? Number((Silian_error as { status?: number }).status)
        : undefined

    if (Silian_status === 401 || Silian_status === 403) {
      throw new ArticleAssetUploadError(
        "AUTH_FAILED",
        "Failed to authorize asset upload.",
        Silian_status
      )
    }

    throw new ArticleAssetUploadError(
      "API_ERROR",
      "Failed to upload asset to the articles repository.",
      Silian_status
    )
  }
}

export function buildArticleAssetPath(
  Silian_category: FileCategory,
  Silian_filename: string
) {
  return `data/${Silian_category}/${Silian_filename}`
}

export function buildArticleAssetUrl(Silian_filePath: string) {
  return `https://raw.githubusercontent.com/${Silian_ARTICLES_REPO_OWNER}/${Silian_ARTICLES_REPO_NAME}/main/${Silian_filePath}`
}
