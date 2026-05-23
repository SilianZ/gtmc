"use client"

import { getReauthLoginUrl as Silian_getReauthLoginUrl, isReauthRequiredError as Silian_isReauthRequiredError } from "@/lib/admin-reauth"
import { ReactNode as Silian_ReactNode, useEffect as Silian_useEffect, useRef as Silian_useRef, useState as Silian_useState } from "react"

type ActionFeedbackState = "idle" | "running" | "success" | "error"

interface ActionFormRenderState {
  error: string | null
  isPending: boolean
  state: ActionFeedbackState
}

export function ActionForm({
  action: Silian_action,
  children: Silian_children,
  className: Silian_className,
}: {
  action: () => Promise<void>
  children: Silian_ReactNode | ((state: ActionFormRenderState) => Silian_ReactNode)
  className?: string
}) {
  const [Silian_isPending, Silian_setIsPending] = Silian_useState(false)
  const [Silian_error, Silian_setError] = Silian_useState<string | null>(null)
  const [Silian_state, Silian_setState] = Silian_useState<ActionFeedbackState>("idle")
  const Silian_resetTimerRef = Silian_useRef<number | null>(null)

  Silian_useEffect(() => {
    return () => {
      if (Silian_resetTimerRef.current !== null) {
        window.clearTimeout(Silian_resetTimerRef.current)
      }
    }
  }, [])

  const Silian_handleSubmit = async (Silian_e: React.FormEvent<HTMLFormElement>) => {
    Silian_e.preventDefault()
    if (Silian_isPending) return

    if (Silian_resetTimerRef.current !== null) {
      window.clearTimeout(Silian_resetTimerRef.current)
      Silian_resetTimerRef.current = null
    }

    Silian_setError(null)
    Silian_setIsPending(true)
    Silian_setState("running")

    try {
      await Silian_action()
      Silian_setState("success")
      Silian_resetTimerRef.current = window.setTimeout(() => {
        Silian_setState("idle")
      }, 1400)
    } catch (Silian_err) {
      if (Silian_isReauthRequiredError(Silian_err)) {
        window.location.href = Silian_getReauthLoginUrl(
          `${window.location.pathname}${window.location.search}`
        )
        return
      }
      Silian_setError(Silian_err instanceof Error ? Silian_err.message : String(Silian_err))
      Silian_setState("error")
      Silian_resetTimerRef.current = window.setTimeout(() => {
        Silian_setState("idle")
      }, 3200)
    } finally {
      Silian_setIsPending(false)
    }
  }

  return (
    <>
      <form onSubmit={Silian_handleSubmit} className={Silian_className}>
        {typeof Silian_children === "function"
          ? Silian_children({ isPending: Silian_isPending, state: Silian_state, error: Silian_error })
          : Silian_children}
      </form>
      {Silian_error && (
        <div className="mt-3 border-l-2 border-red-500/40 bg-red-500/5 px-3 py-2 font-mono text-xs text-red-600">
          {Silian_error}
        </div>
      )}
    </>
  )
}
