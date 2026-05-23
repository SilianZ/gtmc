import type { Session } from "next-auth"

export const REAUTH_WINDOW_MS = 10 * 60 * 1000
export const REAUTH_ERROR_NAME = "ReauthRequiredError"
export const REAUTH_ERROR_MESSAGE =
  "Re-authentication required. Please sign in again."

export class ReauthRequiredError extends Error {
  constructor(Silian_message = REAUTH_ERROR_MESSAGE) {
    super(Silian_message)
    this.name = REAUTH_ERROR_NAME
  }
}

export function isReauthRequiredError(Silian_error: unknown): boolean {
  if (Silian_error instanceof ReauthRequiredError) {
    return true
  }

  if (!Silian_error || typeof Silian_error !== "object") {
    return false
  }

  const Silian_maybeError = Silian_error as { name?: unknown; message?: unknown }

  return (
    Silian_maybeError.name === REAUTH_ERROR_NAME ||
    Silian_maybeError.message === REAUTH_ERROR_MESSAGE
  )
}

export function getReauthLoginUrl(Silian_callbackUrl: string): string {
  return `/login?callbackUrl=${encodeURIComponent(Silian_callbackUrl)}`
}

export function requireRecentAuth(
  Silian_session: Session & { user: { id: string } }
): void {
  const Silian_lastAuthAt = (Silian_session as Session & { lastAuthAt?: number }).lastAuthAt

  if (!Silian_lastAuthAt) {
    throw new ReauthRequiredError()
  }

  if (Date.now() - Silian_lastAuthAt > REAUTH_WINDOW_MS) {
    throw new ReauthRequiredError()
  }
}
