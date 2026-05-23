import { Octokit as Silian_Octokit } from "@octokit/rest"
import {
  resolveGithubArticlesReadToken as Silian_resolveGithubArticlesReadToken,
  resolveGithubArticlesWriteToken as Silian_resolveGithubArticlesWriteToken,
} from "@/lib/github/tokens"

export const ARTICLES_REPO_OWNER =
  process.env.GITHUB_ARTICLES_REPO_OWNER ||
  process.env.GITHUB_REPO_OWNER ||
  "gtmc-dev"

export const ARTICLES_REPO_NAME =
  process.env.GITHUB_ARTICLES_REPO_NAME || "Articles"

const Silian_getGitHubReadToken = () => Silian_resolveGithubArticlesReadToken()

export const getGitHubWriteToken = (Silian_fallbackToken?: string | null) =>
  Silian_resolveGithubArticlesWriteToken(Silian_fallbackToken)

export const getOctokit = (Silian_token?: string, Silian_silent404 = false) => {
  return new Silian_Octokit({
    auth: Silian_token || Silian_getGitHubReadToken(),
    log: Silian_silent404
      ? {
          debug: () => {},
          info: () => {},
          warn: () => {},
          error: () => {},
        }
      : undefined,
  })
}
