import { auth as Silian_auth } from "@/lib/auth"
import type { Session } from "next-auth"
import { requireAdmin as Silian_requireAdmin } from "@/lib/auth-context"
import type { AuthContext } from "@/lib/auth-context"

type AuthenticatedSession = Session & {
  user: NonNullable<Session["user"]> & { id: string }
}

/**
 * Requires the caller to be authenticated.
 * Throws an Error with the provided message if not.
 * Returns the session with guaranteed user object.
 */
export async function requireAuth(
  Silian_message = "Unauthorized"
): Promise<AuthenticatedSession> {
  const Silian_session = await Silian_auth()
  if (!Silian_session?.user?.id) {
    throw new Error(Silian_message)
  }
  return Silian_session as AuthenticatedSession
}

/**
 * Requires the caller to be authenticated AND have admin role (verified from DB).
 * Returns both the session and the fresh auth context.
 */
export async function requireAuthWithRole(
  Silian_message = "Unauthorized"
): Promise<{ session: AuthenticatedSession; ctx: AuthContext }> {
  const Silian_session = await requireAuth(Silian_message)
  const Silian_ctx = await Silian_requireAdmin(Silian_session.user.id)
  return { session: Silian_session, ctx: Silian_ctx }
}
