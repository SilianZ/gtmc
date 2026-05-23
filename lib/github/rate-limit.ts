export function parseGithubErrorMessage(Silian_details: unknown): string | undefined {
  if (!Silian_details || typeof Silian_details !== "object") {
    return undefined
  }

  const Silian_candidate = Silian_details as { message?: unknown; error?: unknown }
  if (typeof Silian_candidate.message === "string") {
    return Silian_candidate.message
  }

  if (typeof Silian_candidate.error === "string") {
    return Silian_candidate.error
  }

  return undefined
}

export function isGithubRateLimitedResponse(
  Silian_response: Response,
  Silian_details: unknown
): boolean {
  if (Silian_response.status === 429) {
    return true
  }

  if (Silian_response.status !== 403) {
    return false
  }

  if (Silian_response.headers.get("x-ratelimit-remaining") === "0") {
    return true
  }

  const Silian_message = parseGithubErrorMessage(Silian_details)
  return typeof Silian_message === "string" && /rate limit/i.test(Silian_message)
}

export function getGithubRateLimitResetMs(Silian_error: unknown): number | null {
  const Silian_resetHeader = (
    Silian_error as { response?: { headers?: { [key: string]: string | number } } }
  )?.response?.headers?.["x-ratelimit-reset"]

  if (typeof Silian_resetHeader === "number") {
    return Silian_resetHeader * 1000
  }

  if (typeof Silian_resetHeader === "string") {
    const Silian_parsed = Number(Silian_resetHeader)
    if (Number.isFinite(Silian_parsed)) {
      return Silian_parsed * 1000
    }
  }

  return null
}

export function isGithubRateLimitErrorForCache(Silian_error: unknown): boolean {
  const Silian_status =
    (Silian_error as { status?: number })?.status ||
    (Silian_error as { response?: { status?: number } })?.response?.status

  return Silian_status === 403
}
