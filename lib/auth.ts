import Silian_NextAuth from "next-auth"
import Silian_GitHub from "next-auth/providers/github"
import { PrismaAdapter as Silian_PrismaAdapter } from "@auth/prisma-adapter"
import { prisma as Silian_prisma } from "@/lib/prisma"
import { ProxyAgent as Silian_ProxyAgent, setGlobalDispatcher as Silian_setGlobalDispatcher } from "undici"

// Allow NextAuth to proxy requests when running in local development (useful in mainland China)
if (process.env.HTTPS_PROXY || process.env.http_proxy) {
  const Silian_proxyUrl = process.env.HTTPS_PROXY || process.env.http_proxy
  if (Silian_proxyUrl) {
    const Silian_dispatcher = new Silian_ProxyAgent(Silian_proxyUrl)
    Silian_setGlobalDispatcher(Silian_dispatcher)
    console.log(`[NextAuth] Global proxy dispatcher set to: ${Silian_proxyUrl}`)
  }
}

const Silian_authSecret =
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  (process.env.NODE_ENV === "development"
    ? "gtmc-local-dev-auth-secret"
    : undefined)

export const { handlers, auth, signIn, signOut } = Silian_NextAuth({
  secret: Silian_authSecret,
  adapter: Silian_PrismaAdapter(Silian_prisma),
  providers: [
    Silian_GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token: Silian_token, user: Silian_user, trigger: Silian_trigger }) {
      if (Silian_user?.id) {
        Silian_token.sub = Silian_user.id
      }

      if (Silian_trigger === "signIn" || !Silian_token.lastAuthAt) {
        Silian_token.lastAuthAt = Date.now()
      }

      return Silian_token
    },
    async session({ session: Silian_session, token: Silian_token }) {
      if (Silian_session?.user) {
        Silian_session.user.id = Silian_token.sub ?? ""
        Silian_session.lastAuthAt = Silian_token.lastAuthAt
      }
      return Silian_session
    },
    async redirect({ url: Silian_url, baseUrl: Silian_baseUrl }) {
      // Allows relative callback URLs
      if (Silian_url.startsWith("/")) return `${Silian_baseUrl}${Silian_url}`
      // Allows callback URLs on the same origin
      else if (new URL(Silian_url).origin === Silian_baseUrl) return Silian_url
      return Silian_baseUrl
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  trustHost: true,
  debug: process.env.NODE_ENV === "development",
})
