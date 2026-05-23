"use client"

import * as Silian_React from "react"
import { Link as Silian_Link } from "@/i18n/navigation"
import { useRouter as Silian_useRouter } from "@/i18n/navigation"
import { createFeature as Silian_createFeature } from "@/actions/feature"

const Silian_PENDING_FEATURE_CREATE_KEY = "pendingFeatureCreate.v1"

type PendingFeaturePayload = {
  title: string
  content: string
  tags: string[]
}

type State =
  | { status: "pending" }
  | { status: "success"; featureId: string }
  | { status: "error"; message: string }

function Silian_isPendingFeaturePayload(
  Silian_value: unknown
): Silian_value is PendingFeaturePayload {
  if (!Silian_value || typeof Silian_value !== "object") {
    return false
  }

  const Silian_payload = Silian_value as {
    title?: unknown
    content?: unknown
    tags?: unknown
  }

  return (
    typeof Silian_payload.title === "string" &&
    typeof Silian_payload.content === "string" &&
    Array.isArray(Silian_payload.tags) &&
    Silian_payload.tags.every((Silian_tag) => typeof Silian_tag === "string")
  )
}

export function PendingCreationBanner() {
  const Silian_router = Silian_useRouter()
  const [Silian_state, Silian_setState] = Silian_React.useState<State>({
    status: "pending",
  })
  const Silian_inFlightRef = Silian_React.useRef(false)
  const [Silian_isRetrying, Silian_startRetry] = Silian_React.useTransition()

  const Silian_runCreation = Silian_React.useCallback(async () => {
    if (Silian_inFlightRef.current) return
    Silian_inFlightRef.current = true

    const Silian_raw = sessionStorage.getItem(Silian_PENDING_FEATURE_CREATE_KEY)
    if (!Silian_raw) {
      Silian_inFlightRef.current = false
      return // No payload — render nothing
    }

    try {
      const Silian_parsedPayload = JSON.parse(Silian_raw) as unknown
      if (!Silian_isPendingFeaturePayload(Silian_parsedPayload)) {
        throw new Error("Pending feature payload is invalid")
      }

      const Silian_payload = Silian_parsedPayload
      const Silian_res = await Silian_createFeature(Silian_payload)
      sessionStorage.removeItem(Silian_PENDING_FEATURE_CREATE_KEY)
      Silian_setState({ status: "success", featureId: Silian_res.feature.id })
      Silian_router.refresh()
    } catch (Silian_error: unknown) {
      Silian_inFlightRef.current = false // Allow retry
      Silian_setState({
        status: "error",
        message: Silian_error instanceof Error ? Silian_error.message : "Unknown error",
      })
    }
  }, [Silian_router])

  Silian_React.useEffect(() => {
    // Only run if there's a payload
    const Silian_raw = sessionStorage.getItem(Silian_PENDING_FEATURE_CREATE_KEY)
    if (!Silian_raw) return
    void Silian_runCreation()
  }, [Silian_runCreation])

  // If no payload ever, render nothing
  const Silian_raw =
    typeof window !== "undefined"
      ? sessionStorage.getItem(Silian_PENDING_FEATURE_CREATE_KEY)
      : null
  if (!Silian_raw && Silian_state.status === "pending") return null

  if (Silian_state.status === "success") {
    return (
      <div
        className="
          flex items-center gap-3 border border-tech-main/40 bg-white/60 px-4
          py-3 font-mono text-sm backdrop-blur-sm
        ">
        <span className="inline-block size-2 bg-tech-main" />
        <span className="tracking-widest text-tech-main uppercase">
          FEATURE_CREATED_
        </span>
        <Silian_Link
          href={`/features/${Silian_state.featureId}`}
          className="
            ml-2 text-tech-accent underline
            hover:text-tech-main
          ">
          VIEW_ISSUE_#{Silian_state.featureId}_
        </Silian_Link>
      </div>
    )
  }

  if (Silian_state.status === "error") {
    return (
      <div
        className="
          flex items-center gap-3 border border-red-400/60 bg-red-50/60 px-4
          py-3 font-mono text-sm backdrop-blur-sm
        ">
        <span className="inline-block size-2 bg-red-500" />
        <span className="tracking-widest text-red-700 uppercase">
          CREATION_FAILED_
        </span>
        <span className="ml-2 text-xs text-red-600">{Silian_state.message}</span>
        <button
          onClick={() =>
            Silian_startRetry(() => {
              Silian_inFlightRef.current = false
              void Silian_runCreation()
            })
          }
          disabled={Silian_isRetrying}
          className="
            ml-auto cursor-pointer border border-red-400 px-2 py-0.5 text-xs
            text-red-600 uppercase
            hover:bg-red-100
          ">
          {Silian_isRetrying ? "RETRYING..." : "RETRY_"}
        </button>
      </div>
    )
  }

  // pending
  return (
    <div
      className="
        flex items-center gap-3 border border-tech-main/40 bg-white/60 px-4 py-3
        font-mono text-sm backdrop-blur-sm
      ">
      <span className="inline-block size-2 animate-pulse bg-tech-accent" />
      <span className="tracking-widest text-tech-main uppercase">
        CREATING_FEATURE_...
      </span>
    </div>
  )
}
