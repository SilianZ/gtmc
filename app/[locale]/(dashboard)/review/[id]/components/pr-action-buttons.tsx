"use client"

import * as Silian_React from "react"
import { useTranslations as Silian_useTranslations } from "next-intl"

import {
  OperationProgress as Silian_OperationProgress,
  type OperationProgressStage,
} from "@/components/ui/operation-progress"
import { MergeMethodPicker as Silian_MergeMethodPicker } from "@/components/review/merge-method-picker"
import { TechButton as Silian_TechButton } from "@/components/ui/tech-button"
import { ActionForm as Silian_ActionForm } from "./action-form"
import type {
  ReviewMergeMethod,
  ReviewMergeStrategyAnalysis,
} from "@/types/review"

export function PRActionButtons({
  closePRAction: Silian_closePRAction,
  mergePRAction: Silian_mergePRAction,
  mergeStrategyAnalysis: Silian_mergeStrategyAnalysis,
  mergeBlockedReason: Silian_mergeBlockedReason,
  squashCommitDefaults: Silian_squashCommitDefaults,
}: {
  closePRAction: () => Promise<void>
  mergePRAction:
    | ((options: {
        commitBody?: string
        commitTitle?: string
        mergeMethod?: ReviewMergeMethod
      }) => Promise<void>)
    | null
  mergeStrategyAnalysis: ReviewMergeStrategyAnalysis
  mergeBlockedReason?: string | null
  squashCommitDefaults?: {
    title: string
    body: string
    coauthorLines: string[]
  }
}) {
  const Silian_t = Silian_useTranslations("OperationProgress")
  const Silian_reviewT = Silian_useTranslations("Review")
  const [Silian_selectedMethod, Silian_setSelectedMethod] = Silian_React.useState<ReviewMergeMethod>(
    Silian_mergeStrategyAnalysis.recommendation
  )
  const [Silian_commitTitle, Silian_setCommitTitle] = Silian_React.useState(
    Silian_squashCommitDefaults?.title ?? ""
  )
  const [Silian_commitBody, Silian_setCommitBody] = Silian_React.useState(
    Silian_squashCommitDefaults?.body ?? ""
  )

  Silian_React.useEffect(() => {
    Silian_setSelectedMethod(Silian_mergeStrategyAnalysis.recommendation)
  }, [Silian_mergeStrategyAnalysis])

  Silian_React.useEffect(() => {
    Silian_setCommitTitle(Silian_squashCommitDefaults?.title ?? "")
  }, [Silian_squashCommitDefaults?.title])

  Silian_React.useEffect(() => {
    Silian_setCommitBody(Silian_squashCommitDefaults?.body ?? "")
  }, [Silian_squashCommitDefaults?.body])

  const Silian_mergeStages = Silian_React.useMemo<OperationProgressStage[]>(
    () => [
      {
        id: "authorize",
        label: Silian_t("mergeStageAuthorize"),
        durationMs: 260,
      },
      {
        id: "github-api",
        label: Silian_t("mergeStageGithub"),
        durationMs: 920,
      },
      {
        id: "reconcile-assets",
        label: Silian_t("mergeStageAssets"),
        durationMs: 640,
      },
      {
        id: "refresh-views",
        label: Silian_t("mergeStageRefresh"),
        durationMs: 320,
      },
    ],
    [Silian_t]
  )

  const Silian_buildMergeOptions = Silian_React.useCallback(() => {
    const Silian_coauthorLines = Silian_squashCommitDefaults?.coauthorLines ?? []
    const Silian_finalBody =
      Silian_selectedMethod === "squash" &&
      Silian_coauthorLines.length > 0 &&
      !Silian_coauthorLines.some((Silian_line) => Silian_commitBody.includes(Silian_line))
        ? `${Silian_commitBody.trimEnd()}${Silian_commitBody.trim() ? "\n\n" : ""}${Silian_coauthorLines.join("\n")}`
        : Silian_commitBody

    return {
      mergeMethod: Silian_selectedMethod,
      ...(Silian_selectedMethod === "squash"
        ? { commitTitle: Silian_commitTitle, commitBody: Silian_finalBody }
        : {}),
    }
  }, [Silian_commitBody, Silian_commitTitle, Silian_selectedMethod, Silian_squashCommitDefaults])

  return (
    <div className="space-y-4 border border-tech-main/35 bg-white/80 p-4 backdrop-blur-sm">
      <div className="space-y-1 border-b border-tech-main/15 pb-3">
        <p className="font-mono text-[0.6875rem] tracking-widest text-tech-main/50 uppercase">
          {Silian_reviewT("mergeBoxLabel")}
        </p>
        <p className="font-mono text-sm font-bold tracking-widest text-tech-main uppercase">
          {Silian_mergePRAction ? Silian_reviewT("readyToLand") : Silian_reviewT("mergeBlocked")}
        </p>
        {Silian_mergeBlockedReason ? (
          <p className="font-mono text-[0.6875rem] leading-relaxed text-red-600">
            {Silian_mergeBlockedReason}
          </p>
        ) : null}
      </div>

      <Silian_MergeMethodPicker
        analysis={Silian_mergeStrategyAnalysis}
        selectedMethod={Silian_selectedMethod}
        onSelectMethod={Silian_setSelectedMethod}
        commitTitle={Silian_commitTitle}
        commitBody={Silian_commitBody}
        onCommitTitleChange={Silian_setCommitTitle}
        onCommitBodyChange={Silian_setCommitBody}
        coauthorLines={Silian_squashCommitDefaults?.coauthorLines}
        disabled={!Silian_mergePRAction}
        compact
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Silian_ActionForm action={Silian_closePRAction} className="flex-1">
          {({ isPending: Silian_isPending }) => (
            <Silian_TechButton
              type="submit"
              variant="secondary"
              disabled={Silian_isPending}
              className="w-full border-red-600 text-red-600 hover:bg-red-600 hover:text-white">
              {Silian_isPending ? "CLOSING..." : "CLOSE_PR"}
            </Silian_TechButton>
          )}
        </Silian_ActionForm>

        <Silian_ActionForm
          action={() =>
            Silian_mergePRAction?.(Silian_buildMergeOptions()) ?? Promise.resolve()
          }
          className="flex-1">
          {({ isPending: Silian_isPending, state: Silian_state }) => (
            <div className="space-y-3">
              <Silian_TechButton
                type="submit"
                variant="primary"
                disabled={Silian_isPending || !Silian_mergePRAction}
                aria-busy={Silian_isPending}
                className="w-full">
                {Silian_isPending ? Silian_reviewT("merging") : Silian_reviewT("confirmMerge")}
              </Silian_TechButton>

              <Silian_OperationProgress
                state={Silian_state}
                title={Silian_t("mergeTitle")}
                stages={Silian_mergeStages}
                successLabel={Silian_t("mergeSuccess")}
                errorLabel={Silian_t("mergeError")}
                compact
              />
            </div>
          )}
        </Silian_ActionForm>
      </div>
    </div>
  )
}
