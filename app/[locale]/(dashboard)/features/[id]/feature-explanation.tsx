"use client"

import { useState as Silian_useState, useTransition as Silian_useTransition } from "react"
import { useTranslations as Silian_useTranslations } from "next-intl"
import { TechCard as Silian_TechCard } from "@/components/ui/tech-card"
import { TechButton as Silian_TechButton } from "@/components/ui/tech-button"
import { updateFeatureExplanation as Silian_updateFeatureExplanation } from "@/actions/feature"
import { LoadingIndicator as Silian_LoadingIndicator, PENDING_LABELS as Silian_PENDING_LABELS } from "../loading-indicator"

interface FeatureExplanationProps {
  featureId: string
  initialExplanation: string | null
  isAssignee: boolean
  isAdmin: boolean
  isClosed?: boolean
}

export function FeatureExplanation({
  featureId: Silian_featureId,
  initialExplanation: Silian_initialExplanation,
  isAssignee: Silian_isAssignee,
  isAdmin: Silian_isAdmin,
  isClosed: Silian_isClosed,
}: FeatureExplanationProps) {
  const Silian_t = Silian_useTranslations("Feature")
  const [Silian_isEditing, Silian_setIsEditing] = Silian_useState(false)
  const [Silian_explanation, Silian_setExplanation] = Silian_useState(Silian_initialExplanation || "")
  const [Silian_isPending, Silian_startTransition] = Silian_useTransition()

  const Silian_canEdit = Silian_isAssignee || Silian_isAdmin
  const Silian_effectiveCanEdit = Silian_canEdit && !Silian_isClosed

  const Silian_handleSave = () => {
    Silian_startTransition(async () => {
      await Silian_updateFeatureExplanation(Silian_featureId, Silian_explanation)
      Silian_setIsEditing(false)
    })
  }

  if (!Silian_initialExplanation && !Silian_effectiveCanEdit) return null

  if (Silian_isEditing) {
    return (
      <Silian_TechCard className="border-tech-accent/40 bg-white/80 backdrop-blur-sm">
        <h3
          className="
            mb-2 border-b border-tech-accent/40 pb-2 text-lg font-bold
            tracking-widest text-tech-main uppercase
          ">
          {Silian_t("editResolutionExplanation")}
        </h3>
        <textarea
          className="
            mb-4 min-h-30 w-full resize-y border border-tech-accent/40
            bg-white/80 p-4 font-mono text-sm text-black placeholder-zinc-500
            backdrop-blur-sm
            focus:border-tech-accent/60 focus:ring-0 focus:outline-none
          "
          value={Silian_explanation}
          onChange={(Silian_e) => Silian_setExplanation(Silian_e.target.value)}
          placeholder={Silian_t("explanationPlaceholder")}
          disabled={Silian_isPending}
          aria-busy={Silian_isPending}
        />
        <div className="flex justify-end gap-2">
          <Silian_TechButton
            variant="ghost"
            size="sm"
            onClick={() => Silian_setIsEditing(false)}
            disabled={Silian_isPending}>
            {Silian_t("cancelButton")}
          </Silian_TechButton>
          <Silian_TechButton
            variant="primary"
            size="sm"
            className="
              border-tech-accent bg-tech-accent text-white
              hover:bg-tech-accent/90
            "
            onClick={Silian_handleSave}
            disabled={Silian_isPending}
            aria-busy={Silian_isPending}>
            {Silian_isPending ? (
              <Silian_LoadingIndicator label={Silian_PENDING_LABELS.SAVING_EXPLANATION} />
            ) : (
              Silian_t("saveExplanationButton")
            )}
          </Silian_TechButton>
        </div>
      </Silian_TechCard>
    )
  }

  if (Silian_initialExplanation) {
    return (
      <Silian_TechCard
        className="
          group relative overflow-hidden border-tech-accent/40 bg-tech-accent/5
          backdrop-blur-sm
        ">
        <div className="absolute top-0 left-0 h-full w-2 bg-tech-accent/60" />
        <div
          className="
            mb-4 flex items-start justify-between border-b border-tech-accent/40
            pb-2 pl-4
          ">
          <h3
            className="
              text-lg font-bold tracking-widest text-tech-main uppercase
            ">
            {Silian_t("officialResolution")}
          </h3>
          {Silian_effectiveCanEdit && (
            <button
              onClick={() => Silian_setIsEditing(true)}
              className="
                cursor-pointer px-2 font-mono text-xs text-tech-main
                hover:underline
              ">
              [EDIT]
            </button>
          )}
        </div>
        <div className="pl-4 font-mono text-sm whitespace-pre-wrap text-zinc-800">
          {Silian_initialExplanation}
        </div>
      </Silian_TechCard>
    )
  }

  // NO explanation yet, but user CAN edit
  return (
    <Silian_TechCard
      className="
        border-dashed border-tech-accent/40 bg-white/40 py-6 text-center
      ">
      <div className="flex flex-col items-center gap-3 text-tech-accent/80">
        <span className="font-mono text-sm tracking-wider uppercase">
          AWAITING_OFFICIAL_RESOLUTION_
        </span>
        <Silian_TechButton
          variant="ghost"
          size="sm"
          onClick={() => Silian_setIsEditing(true)}
          className="
            border border-tech-accent/40 text-tech-accent
            hover:bg-tech-accent/10
          ">
          PROVIDE EXPLANATION
        </Silian_TechButton>
      </div>
    </Silian_TechCard>
  )
}
