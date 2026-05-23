"use client"

import * as Silian_React from "react"
import { useTranslations as Silian_useTranslations } from "next-intl"
import { TechButton as Silian_TechButton } from "@/components/ui/tech-button"
import { CornerBrackets as Silian_CornerBrackets } from "@/components/ui/corner-brackets"
import { MergeMethodPicker as Silian_MergeMethodPicker } from "@/components/review/merge-method-picker"
import {
  OperationProgress as Silian_OperationProgress,
  type OperationProgressStage,
  type OperationProgressState,
} from "@/components/ui/operation-progress"
import type { FileRebaseState, RebaseState } from "@/types/rebase"
import type {
  ReviewMergeMethod,
  ReviewMergeStrategyAnalysis,
} from "@/types/review"

interface SimpleFileStatus {
  filePath: string
  status: "clean" | "conflict" | "resolved"
}

interface RebaseProgressProps {
  mode: "FINE_GRAINED" | "SIMPLE"
  rebaseState?: RebaseState | null
  files?: SimpleFileStatus[]
  isBranchSyncing?: boolean
  onAbort: () => void
  onFinalize: (options?: {
    commitTitle?: string
    commitBody?: string
    mergeMethod?: ReviewMergeMethod
  }) => void
  isAborting?: boolean
  isFinalizing?: boolean
  finalizeProgressState?: OperationProgressState
  defaultCommitTitle?: string
  defaultCommitBody?: string
  coauthorLines?: string[]
  mergeStrategyAnalysis: ReviewMergeStrategyAnalysis
}

function Silian_CommitStepDots({
  commitInfos: Silian_commitInfos,
  currentCommitIndex: Silian_currentCommitIndex,
  status: Silian_status,
}: {
  commitInfos: RebaseState["commitInfos"]
  currentCommitIndex: number
  status?: RebaseState["status"]
}) {
  const Silian_total = Silian_commitInfos.length
  if (Silian_total === 0) return null

  const Silian_visibleCommits = Silian_commitInfos.slice(0, 10)
  const Silian_overflowCount = Silian_total - Silian_visibleCommits.length

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {Silian_visibleCommits.map((Silian_commit, Silian_index) => {
        const Silian_isDone =
          Silian_status === "COMPLETED" ? true : Silian_index < Silian_currentCommitIndex
        const Silian_isCurrent = Silian_index === Silian_currentCommitIndex
        const Silian_isConflict = Silian_isCurrent && Silian_status === "CONFLICT"
        const Silian_isInProgress = Silian_isCurrent && Silian_status === "IN_PROGRESS"

        return (
          <Silian_React.Fragment key={Silian_commit.sha}>
            <span
              title={`Commit ${Silian_index + 1}: ${Silian_commit.sha.slice(0, 7)}`}
              className={`block size-2 border transition-all duration-300 ${
                Silian_isConflict
                  ? "border-red-500 bg-red-500"
                  : Silian_isDone
                    ? "border-tech-main bg-tech-main"
                    : Silian_isInProgress
                      ? "animate-pulse border-tech-main/70 bg-tech-main/70"
                      : "border-tech-main/30 bg-transparent"
              }`}
            />
            {Silian_index < Silian_visibleCommits.length - 1 ? (
              <span className="h-px w-3 bg-tech-main/20" aria-hidden="true" />
            ) : null}
          </Silian_React.Fragment>
        )
      })}
      {Silian_overflowCount > 0 ? (
        <span className="ml-1 font-mono text-[0.6875rem] tracking-widest text-tech-main/50 uppercase">
          +{Silian_overflowCount}
        </span>
      ) : null}
    </div>
  )
}

function Silian_StatusDot({ status: Silian_status }: { status: string }) {
  const Silian_color =
    Silian_status === "conflict"
      ? "bg-red-400"
      : Silian_status === "resolved" || Silian_status === "completed"
        ? "bg-green-500"
        : Silian_status === "in_progress"
          ? "bg-yellow-400"
          : "bg-tech-main/30"
  return <span className={`inline-block size-2 shrink-0 ${Silian_color}`} />
}

function Silian_CurrentCommitPanel({
  commitSha: Silian_commitSha,
  commitMessage: Silian_commitMessage,
  commitAuthor: Silian_commitAuthor,
  fileStates: Silian_fileStates,
}: {
  commitSha?: string
  commitMessage?: string
  commitAuthor?: string
  fileStates: FileRebaseState[]
}) {
  if (!Silian_commitSha && !Silian_commitMessage && Silian_fileStates.length === 0) {
    return null
  }

  return (
    <div className="relative space-y-3 border border-tech-main/30 bg-white/70 p-3">
      <Silian_CornerBrackets color="border-tech-main/20" />
      <div className="space-y-1">
        <p className="font-mono text-[0.6875rem] tracking-widest text-tech-main/50 uppercase">
          CURRENT_COMMIT
        </p>
        {Silian_commitSha ? (
          <p className="font-mono text-sm font-bold tracking-widest text-tech-main uppercase">
            SHA_{Silian_commitSha.slice(0, 7)}_
          </p>
        ) : null}
        {Silian_commitMessage ? (
          <p className="font-mono text-xs/relaxed text-tech-main/80">
            {Silian_commitMessage}
          </p>
        ) : null}
        {Silian_commitAuthor ? (
          <p className="font-mono text-[0.6875rem] tracking-widest text-tech-main/40 uppercase">
            {Silian_commitAuthor}
          </p>
        ) : null}
      </div>

      {Silian_fileStates.length > 0 ? (
        <div className="space-y-1">
          <p className="font-mono text-[0.6875rem] tracking-widest text-tech-main/50 uppercase">
            FILE_STATES
          </p>
          <ul className="space-y-1">
            {Silian_fileStates.map((Silian_fs) => (
              <li
                key={Silian_fs.filePath}
                className="flex items-center gap-2 font-mono text-[0.6875rem] text-tech-main/70">
                <Silian_StatusDot status={Silian_fs.status} />
                <span className="truncate">{Silian_fs.filePath}</span>
                <span className="ml-auto shrink-0 tracking-widest text-tech-main/40 uppercase">
                  {Silian_fs.status.toUpperCase()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

function Silian_AbortButton({
  onAbort: Silian_onAbort,
  isAborting: Silian_isAborting,
}: {
  onAbort: () => void
  isAborting?: boolean
}) {
  const Silian_t = Silian_useTranslations("Review")
  const Silian_editorT = Silian_useTranslations("Editor")
  const [Silian_confirming, Silian_setConfirming] = Silian_React.useState(false)

  if (Silian_confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-mono text-[0.6875rem] tracking-widest text-red-400 uppercase">
          {Silian_t("confirmAbort")}
        </span>
        <Silian_TechButton
          variant="danger"
          size="sm"
          disabled={Silian_isAborting}
          onClick={() => {
            Silian_setConfirming(false)
            Silian_onAbort()
          }}>
          {Silian_isAborting ? Silian_t("aborting") : Silian_t("yesAbort")}
        </Silian_TechButton>
        <Silian_TechButton
          variant="secondary"
          size="sm"
          onClick={() => Silian_setConfirming(false)}>
          {Silian_editorT("cancelButton")}
        </Silian_TechButton>
      </div>
    )
  }

  return (
    <Silian_TechButton
      variant="danger"
      size="sm"
      disabled={Silian_isAborting}
      onClick={() => Silian_setConfirming(true)}>
      {Silian_t("abortResolution")}
    </Silian_TechButton>
  )
}

export function RebaseProgress({
  mode: Silian_mode,
  rebaseState: Silian_rebaseState,
  files: Silian_files,
  isBranchSyncing: Silian_isBranchSyncing = false,
  onAbort: Silian_onAbort,
  onFinalize: Silian_onFinalize,
  isAborting: Silian_isAborting,
  isFinalizing: Silian_isFinalizing,
  finalizeProgressState: Silian_finalizeProgressState = "idle",
  defaultCommitTitle: Silian_defaultCommitTitle = "",
  defaultCommitBody: Silian_defaultCommitBody = "",
  coauthorLines: Silian_coauthorLines = [],
  mergeStrategyAnalysis: Silian_mergeStrategyAnalysis,
}: RebaseProgressProps) {
  const Silian_t = Silian_useTranslations("Review")
  const Silian_progressT = Silian_useTranslations("OperationProgress")
  const [Silian_commitTitle, Silian_setCommitTitle] = Silian_React.useState(Silian_defaultCommitTitle)
  const [Silian_commitBody, Silian_setCommitBody] = Silian_React.useState(Silian_defaultCommitBody)
  const [Silian_selectedMethod, Silian_setSelectedMethod] = Silian_React.useState<ReviewMergeMethod>(
    Silian_mergeStrategyAnalysis.recommendation
  )

  const Silian_finalizeStages = Silian_React.useMemo<OperationProgressStage[]>(
    () =>
      Silian_mode === "FINE_GRAINED"
        ? [
            {
              id: "validate",
              label: Silian_progressT("finalizeStageValidate"),
              durationMs: 240,
            },
            {
              id: "push-branch",
              label: Silian_progressT("finalizeStagePush"),
              durationMs: 920,
            },
            {
              id: "merge-pr",
              label: Silian_progressT("finalizeStageMerge"),
              durationMs: 720,
            },
            {
              id: "assets",
              label: Silian_progressT("finalizeStageAssets"),
              durationMs: 520,
            },
            {
              id: "refresh",
              label: Silian_progressT("finalizeStageRefresh"),
              durationMs: 300,
            },
          ]
        : [
            {
              id: "validate",
              label: Silian_progressT("finalizeStageValidate"),
              durationMs: 240,
            },
            {
              id: "merge-pr",
              label: Silian_progressT("finalizeStageMerge"),
              durationMs: 920,
            },
            {
              id: "assets",
              label: Silian_progressT("finalizeStageAssets"),
              durationMs: 520,
            },
            {
              id: "refresh",
              label: Silian_progressT("finalizeStageRefresh"),
              durationMs: 300,
            },
          ],
    [Silian_mode, Silian_progressT]
  )

  Silian_React.useEffect(() => {
    Silian_setCommitTitle(Silian_defaultCommitTitle)
  }, [Silian_defaultCommitTitle])

  Silian_React.useEffect(() => {
    Silian_setCommitBody(Silian_defaultCommitBody)
  }, [Silian_defaultCommitBody])

  Silian_React.useEffect(() => {
    Silian_setSelectedMethod(Silian_mergeStrategyAnalysis.recommendation)
  }, [Silian_mergeStrategyAnalysis])

  const Silian_buildFinalizeOptions = Silian_React.useCallback(() => {
    const Silian_finalBody =
      Silian_selectedMethod === "squash" &&
      Silian_coauthorLines.length > 0 &&
      !Silian_coauthorLines.some((Silian_line) => Silian_commitBody.includes(Silian_line))
        ? `${Silian_commitBody.trimEnd()}${Silian_commitBody.trim() ? "\n\n" : ""}${Silian_coauthorLines.join("\n")}`
        : Silian_commitBody

    return {
      mergeMethod: Silian_selectedMethod,
      ...(Silian_selectedMethod === "squash"
        ? {
            commitTitle: Silian_commitTitle,
            commitBody: Silian_finalBody,
          }
        : {}),
    }
  }, [Silian_coauthorLines, Silian_commitBody, Silian_commitTitle, Silian_selectedMethod])

  if (Silian_mode === "FINE_GRAINED") {
    const Silian_total = Silian_rebaseState?.commitShas.length ?? 0
    const Silian_isCompleted = Silian_rebaseState?.status === "COMPLETED"
    const Silian_current = Silian_isCompleted
      ? Silian_total
      : Math.min((Silian_rebaseState?.currentCommitIndex ?? 0) + 1, Silian_total)
    const Silian_currentCommitIndex = Silian_rebaseState?.currentCommitIndex ?? 0
    const Silian_currentInfo =
      Silian_rebaseState?.commitInfos[
        Math.min(
          Silian_currentCommitIndex,
          Math.max((Silian_rebaseState?.commitInfos.length ?? 1) - 1, 0)
        )
      ]
    const Silian_fileStates = Silian_rebaseState?.fileStates
      ? Object.values(Silian_rebaseState.fileStates)
      : []
    const Silian_conflictFile = Silian_fileStates.find((Silian_fs) => Silian_fs.status === "conflict")
    const Silian_currentCommitSha =
      Silian_rebaseState?.conflictedCommitSha ??
      Silian_currentInfo?.sha ??
      Silian_rebaseState?.commitShas[Silian_currentCommitIndex]

    return (
      <div className="space-y-4 border border-tech-main/40 bg-tech-main/5 p-4">
        <Silian_OperationProgress
          state={Silian_finalizeProgressState}
          title={Silian_progressT("finalizeTitle")}
          stages={Silian_finalizeStages}
          successLabel={Silian_progressT("finalizeSuccess")}
          errorLabel={Silian_progressT("finalizeError")}
        />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="font-mono text-[0.6875rem] tracking-widest text-tech-main/50 uppercase">
              PROGRESS
            </p>
            <p className="font-mono text-sm font-bold tracking-widest text-tech-main uppercase">
              RESOLVING_COMMIT_{Silian_current}_OF_{Silian_total}_
            </p>
            <Silian_CommitStepDots
              commitInfos={Silian_rebaseState?.commitInfos ?? []}
              currentCommitIndex={Silian_currentCommitIndex}
              status={Silian_rebaseState?.status}
            />
          </div>

          <div className="flex min-w-32 items-center gap-2">
            <div className="relative h-1 flex-1 bg-tech-main/20">
              <div
                className="absolute inset-y-0 left-0 bg-tech-main transition-all duration-500"
                style={{
                  width: `${Silian_total > 0 ? Math.min((Silian_current / Silian_total) * 100, 100) : 0}%`,
                }}
              />
            </div>
            <span className="font-mono text-[0.6875rem] text-tech-main/60 tabular-nums">
              {Silian_current}/{Silian_total}
            </span>
          </div>
        </div>

        {Silian_rebaseState?.status === "CONFLICT" && Silian_currentCommitSha ? (
          <div className="border border-red-500 bg-red-500/5 p-3">
            <p className="font-mono text-[0.6875rem] font-bold tracking-widest text-red-600 uppercase">
              CONFLICT_DETECTED_IN_COMMIT_{Silian_currentCommitSha.slice(0, 7)}_
            </p>
            {Silian_conflictFile ? (
              <p className="mt-2 font-mono text-[0.6875rem] tracking-widest text-red-500 uppercase">
                FILE_{Silian_conflictFile.filePath}_
              </p>
            ) : null}
          </div>
        ) : null}

        <Silian_CurrentCommitPanel
          commitSha={Silian_currentCommitSha}
          commitMessage={Silian_currentInfo?.message}
          commitAuthor={Silian_currentInfo?.author}
          fileStates={Silian_fileStates}
        />

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <Silian_AbortButton onAbort={Silian_onAbort} isAborting={Silian_isAborting} />
          {Silian_isCompleted && (
            <Silian_TechButton
              variant="primary"
              size="md"
              disabled={Silian_isFinalizing}
              className="border-green-700! bg-green-700! hover:bg-green-800!"
              onClick={() => Silian_onFinalize(Silian_buildFinalizeOptions())}>
              {Silian_isFinalizing ? Silian_t("finalizing") : Silian_t("finalizeAndMerge")}
            </Silian_TechButton>
          )}
        </div>

        {Silian_isCompleted ? (
          <Silian_MergeMethodPicker
            analysis={Silian_mergeStrategyAnalysis}
            selectedMethod={Silian_selectedMethod}
            onSelectMethod={Silian_setSelectedMethod}
            commitTitle={Silian_commitTitle}
            commitBody={Silian_commitBody}
            onCommitTitleChange={Silian_setCommitTitle}
            onCommitBodyChange={Silian_setCommitBody}
            coauthorLines={Silian_coauthorLines}
            disabled={Silian_isFinalizing}
            compact
          />
        ) : null}
      </div>
    )
  }

  const Silian_conflictFiles = (Silian_files ?? []).filter((Silian_f) => Silian_f.status === "conflict")
  const Silian_allResolved = Silian_conflictFiles.length === 0

  return (
    <div className="space-y-4 border border-tech-main/40 bg-tech-main/5 p-4">
      <Silian_OperationProgress
        state={Silian_finalizeProgressState}
        title={Silian_progressT("finalizeTitle")}
        stages={Silian_finalizeStages}
        successLabel={Silian_progressT("finalizeSuccess")}
        errorLabel={Silian_progressT("finalizeError")}
      />

      <div className="space-y-1">
        <p className="font-mono text-[0.6875rem] tracking-widest text-tech-main/50 uppercase">
          PROGRESS
        </p>
        <p className="font-mono text-sm font-bold tracking-widest text-tech-main uppercase">
          RESOLVING_CONFLICTS_IN_{Silian_conflictFiles.length}_FILES_
        </p>
        <p className="font-mono text-[0.6875rem] tracking-widest text-tech-main/60 uppercase">
          {Silian_isBranchSyncing ? "PR_BRANCH_UPDATING_" : "PR_BRANCH_SYNCED_"}
        </p>
      </div>

      {(Silian_files ?? []).length > 0 && (
        <ul className="space-y-1">
          {(Silian_files ?? []).map((Silian_f) => (
            <li
              key={Silian_f.filePath}
              className="flex items-center gap-2 font-mono text-[0.6875rem] text-tech-main/70">
              <Silian_StatusDot status={Silian_f.status} />
              <span className="truncate">{Silian_f.filePath}</span>
              <span className="ml-auto shrink-0 tracking-widest text-tech-main/40 uppercase">
                {Silian_f.status.toUpperCase()}
              </span>
            </li>
          ))}
        </ul>
      )}

      {Silian_allResolved && !Silian_isBranchSyncing ? (
        <Silian_MergeMethodPicker
          analysis={Silian_mergeStrategyAnalysis}
          selectedMethod={Silian_selectedMethod}
          onSelectMethod={Silian_setSelectedMethod}
          commitTitle={Silian_commitTitle}
          commitBody={Silian_commitBody}
          onCommitTitleChange={Silian_setCommitTitle}
          onCommitBodyChange={Silian_setCommitBody}
          coauthorLines={Silian_coauthorLines}
          disabled={Silian_isFinalizing}
          compact
        />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <Silian_AbortButton onAbort={Silian_onAbort} isAborting={Silian_isAborting} />
        {Silian_allResolved && !Silian_isBranchSyncing && (
          <Silian_TechButton
            variant="primary"
            size="sm"
            disabled={Silian_isFinalizing}
            className="border-green-700! bg-green-700! hover:bg-green-800!"
            onClick={() => Silian_onFinalize(Silian_buildFinalizeOptions())}>
            {Silian_isFinalizing ? Silian_t("finalizing") : Silian_t("finalizeAndMerge")}
          </Silian_TechButton>
        )}
      </div>
    </div>
  )
}
