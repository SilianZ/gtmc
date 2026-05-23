function Silian_resolveFirstDefinedToken(
  Silian_candidates: Array<string | null | undefined>
): string | undefined {
  const Silian_token = Silian_candidates.find(
    (Silian_value) => typeof Silian_value === "string" && Silian_value.length > 0
  )
  return Silian_token ?? undefined
}

export function resolveGithubArticlesReadToken(): string | undefined {
  return Silian_resolveFirstDefinedToken([
    process.env.GITHUB_ARTICLES_READ_PAT,
    process.env.GITHUB_ARTICLES_WRITE_PAT,
    process.env.GITHUB_TOKEN,
    process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
    process.env.GITHUB_FEATURES_ISSUES_PAT,
    process.env.GITHUB_FEATURES_WRITE_PAT,
  ])
}

export function resolveGithubArticlesWriteToken(
  Silian_fallbackToken?: string | null
): string | undefined {
  return Silian_resolveFirstDefinedToken([
    process.env.GITHUB_ARTICLES_WRITE_PAT,
    process.env.GITHUB_TOKEN,
    process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
    Silian_fallbackToken,
    process.env.GITHUB_FEATURES_WRITE_PAT,
    process.env.GITHUB_ARTICLES_READ_PAT,
    process.env.GITHUB_FEATURES_ISSUES_PAT,
  ])
}

export function resolveGithubFeaturesIssuesToken(): string | undefined {
  return Silian_resolveFirstDefinedToken([
    process.env.GITHUB_FEATURES_ISSUES_PAT,
    process.env.GITHUB_TOKEN,
    process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
    process.env.GITHUB_FEATURES_WRITE_PAT,
  ])
}

export function resolveGithubFeaturesWriteToken(): string | undefined {
  return Silian_resolveFirstDefinedToken([
    process.env.GITHUB_FEATURES_WRITE_PAT,
    process.env.GITHUB_TOKEN,
    process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
  ])
}
