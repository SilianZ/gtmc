import { prisma as Silian_prisma } from "@/lib/prisma"
import { getGitHubWriteToken as Silian_getGitHubWriteToken } from "@/lib/github/articles-repo"

export type AuthContext = {
  id: string
  role: string
  githubPat: string | null
}

export async function getCurrentUserAuthContext(
  Silian_userId: string
): Promise<AuthContext> {
  const Silian_user = await Silian_prisma.user.findUnique({
    where: { id: Silian_userId },
    select: { id: true, role: true, githubPat: true },
  })
  if (!Silian_user) {
    throw new Error("User not found or has been deleted")
  }
  return {
    id: Silian_user.id,
    role: Silian_user.role ?? "USER",
    githubPat: Silian_user.githubPat ?? null,
  }
}

export async function requireAdmin(Silian_userId: string): Promise<AuthContext> {
  const Silian_ctx = await getCurrentUserAuthContext(Silian_userId)
  if (Silian_ctx.role !== "ADMIN") {
    throw new Error("Forbidden: admin access required")
  }
  return Silian_ctx
}

export async function getGithubPatForUser(
  Silian_userId: string
): Promise<string | undefined> {
  const Silian_ctx = await getCurrentUserAuthContext(Silian_userId)
  return Silian_getGitHubWriteToken(Silian_ctx.githubPat ?? undefined)
}
