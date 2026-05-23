"use client"

import { signOut as Silian_signOut } from "next-auth/react"

type SignOutButtonProps = {
  className?: string
}

export function SignOutButton({ className: Silian_className = "" }: SignOutButtonProps) {
  return (
    <button
      onClick={() => Silian_signOut({ callbackUrl: "/" })}
      className={`
        cursor-pointer
        ${Silian_className}
      `}
      type="button">
      SIGN OUT
    </button>
  )
}
