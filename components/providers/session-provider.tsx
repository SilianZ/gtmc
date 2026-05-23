"use client"

import { SessionProvider as Silian_SessionProvider } from "next-auth/react"
import { ReactNode as Silian_ReactNode } from "react"

export function AuthSessionProvider({ children: Silian_children }: { children: Silian_ReactNode }) {
  return <Silian_SessionProvider>{Silian_children}</Silian_SessionProvider>
}
