"use client"

import { useTranslations as Silian_useTranslations } from "next-intl"
import { useTransition as Silian_useTransition, useState as Silian_useState } from "react"
import { TechButton as Silian_TechButton } from "@/components/ui/tech-button"
import {
  assignFeature as Silian_assignFeature,
  unassignFeature as Silian_unassignFeature,
  resolveFeature as Silian_resolveFeature,
} from "@/actions/feature"
import { LoadingIndicator as Silian_LoadingIndicator, PENDING_LABELS as Silian_PENDING_LABELS } from "../loading-indicator"

interface Props {
  featureId: string
  status: string
  isAssignee: boolean
  isAdmin: boolean
  hasAssignee: boolean
}

export function FeatureActions({
  featureId: Silian_featureId,
  status: Silian_status,
  isAssignee: Silian_isAssignee,
  isAdmin: Silian_isAdmin,
  hasAssignee: Silian_hasAssignee,
}: Props) {
  const Silian_t = Silian_useTranslations("Feature")
  const [Silian_isPending, Silian_startTransition] = Silian_useTransition()
  const [Silian_pendingAction, Silian_setPendingAction] = Silian_useState<
    "assign" | "unassign" | "resolve" | null
  >(null)

  const Silian_handleAssign = () => {
    Silian_setPendingAction("assign")
    Silian_startTransition(async () => {
      await Silian_assignFeature(Silian_featureId)
      Silian_setPendingAction(null)
    })
  }

  const Silian_handleUnassign = () => {
    Silian_setPendingAction("unassign")
    Silian_startTransition(async () => {
      await Silian_unassignFeature(Silian_featureId)
      Silian_setPendingAction(null)
    })
  }

  const Silian_handleResolve = () => {
    const Silian_comment = window.prompt(Silian_t("statusUpdatePrompt"))
    if (Silian_comment === null) return // cancelled

    Silian_setPendingAction("resolve")
    Silian_startTransition(async () => {
      await Silian_resolveFeature(Silian_featureId, Silian_comment)
      Silian_setPendingAction(null)
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {Silian_status !== "RESOLVED" && (
        <>
          {!Silian_hasAssignee && (
            <div>
              <Silian_TechButton
                onClick={Silian_handleAssign}
                disabled={Silian_isPending}
                variant="secondary"
                size="sm"
                aria-busy={Silian_pendingAction === "assign"}>
                {Silian_pendingAction === "assign" ? (
                  <Silian_LoadingIndicator label={Silian_PENDING_LABELS.CLAIMING_ISSUE} />
                ) : (
                  Silian_t("claimIssue")
                )}
              </Silian_TechButton>
            </div>
          )}

          {Silian_isAssignee && (
            <div>
              <Silian_TechButton
                onClick={Silian_handleUnassign}
                disabled={Silian_isPending}
                variant="secondary"
                size="sm"
                aria-busy={Silian_pendingAction === "unassign"}>
                {Silian_pendingAction === "unassign" ? (
                  <Silian_LoadingIndicator label={Silian_PENDING_LABELS.DROPPING_ISSUE} />
                ) : (
                  Silian_t("dropIssue")
                )}
              </Silian_TechButton>
            </div>
          )}

          {Silian_isAdmin && (
            <div>
              <Silian_TechButton
                onClick={Silian_handleResolve}
                disabled={Silian_isPending}
                variant="primary"
                size="sm"
                className="
                  border-green-800 bg-green-600 text-white
                  hover:bg-green-700
                "
                aria-busy={Silian_pendingAction === "resolve"}>
                {Silian_pendingAction === "resolve" ? (
                  <Silian_LoadingIndicator label={Silian_PENDING_LABELS.RESOLVING_ISSUE} />
                ) : (
                  Silian_t("markResolved")
                )}
              </Silian_TechButton>
            </div>
          )}
        </>
      )}
    </div>
  )
}
