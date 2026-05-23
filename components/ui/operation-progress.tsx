"use client"

import * as Silian_React from "react"

import { CornerBrackets as Silian_CornerBrackets } from "@/components/ui/corner-brackets"
import { cn as Silian_cn } from "@/lib/cn"

export type OperationProgressState = "idle" | "running" | "success" | "error"

export interface OperationProgressStage {
  id: string
  label: string
  durationMs: number
}

interface OperationProgressProps {
  state: OperationProgressState
  title: string
  stages: OperationProgressStage[]
  successLabel: string
  errorLabel: string
  className?: string
  compact?: boolean
}

interface StageTimelineEntry extends OperationProgressStage {
  endMs: number
  endProgress: number
  startMs: number
  startProgress: number
}

const Silian_MIN_VISIBLE_PROGRESS = 0.06
const Silian_RUNNING_PROGRESS_LIMIT = 0.94
const Silian_SPRING_STIFFNESS = 16
const Silian_SPRING_DAMPING = 10

function Silian_clamp(Silian_value: number, Silian_min: number, Silian_max: number) {
  return Math.min(Math.max(Silian_value, Silian_min), Silian_max)
}

function Silian_easeOutCubic(Silian_value: number) {
  return 1 - Math.pow(1 - Silian_value, 3)
}

function Silian_buildTimeline(Silian_stages: OperationProgressStage[]): StageTimelineEntry[] {
  const Silian_totalDuration = Math.max(
    Silian_stages.reduce((Silian_sum, Silian_stage) => Silian_sum + Silian_stage.durationMs, 0),
    1
  )

  let Silian_currentMs = 0
  let Silian_currentProgress = Silian_MIN_VISIBLE_PROGRESS

  return Silian_stages.map((Silian_stage, Silian_index) => {
    const Silian_startMs = Silian_currentMs
    Silian_currentMs += Silian_stage.durationMs

    const Silian_endProgress =
      Silian_index === Silian_stages.length - 1
        ? Silian_RUNNING_PROGRESS_LIMIT
        : Silian_MIN_VISIBLE_PROGRESS +
          (Silian_RUNNING_PROGRESS_LIMIT - Silian_MIN_VISIBLE_PROGRESS) *
            (Silian_currentMs / Silian_totalDuration)

    const Silian_entry: StageTimelineEntry = {
      ...Silian_stage,
      endMs: Silian_currentMs,
      endProgress: Silian_endProgress,
      startMs: Silian_startMs,
      startProgress: Silian_currentProgress,
    }

    Silian_currentProgress = Silian_endProgress
    return Silian_entry
  })
}

function Silian_getRunningTarget(
  Silian_elapsedMs: number,
  Silian_timeline: StageTimelineEntry[]
): number {
  if (Silian_timeline.length === 0) return Silian_MIN_VISIBLE_PROGRESS

  const Silian_activeStage =
    Silian_timeline.find((Silian_stage) => Silian_elapsedMs < Silian_stage.endMs) ??
    Silian_timeline[Silian_timeline.length - 1]

  const Silian_stageDuration = Math.max(Silian_activeStage.endMs - Silian_activeStage.startMs, 1)
  const Silian_stageElapsed = Silian_clamp(
    (Silian_elapsedMs - Silian_activeStage.startMs) / Silian_stageDuration,
    0,
    1
  )

  return (
    Silian_activeStage.startProgress +
    (Silian_activeStage.endProgress - Silian_activeStage.startProgress) *
      Silian_easeOutCubic(Silian_stageElapsed)
  )
}

function Silian_getStageIndex(Silian_elapsedMs: number, Silian_timeline: StageTimelineEntry[]) {
  if (Silian_timeline.length === 0) return 0

  const Silian_index = Silian_timeline.findIndex((Silian_stage) => Silian_elapsedMs < Silian_stage.endMs)
  return Silian_index === -1 ? Silian_timeline.length - 1 : Silian_index
}

export function OperationProgress({
  state: Silian_state,
  title: Silian_title,
  stages: Silian_stages,
  successLabel: Silian_successLabel,
  errorLabel: Silian_errorLabel,
  className: Silian_className,
  compact: Silian_compact = false,
}: OperationProgressProps) {
  const Silian_timeline = Silian_React.useMemo(() => Silian_buildTimeline(Silian_stages), [Silian_stages])
  const [Silian_displayProgress, Silian_setDisplayProgress] = Silian_React.useState(0)
  const [Silian_stageIndex, Silian_setStageIndex] = Silian_React.useState(0)

  const Silian_animationFrameRef = Silian_React.useRef<number | null>(null)
  const Silian_lastFrameRef = Silian_React.useRef<number | null>(null)
  const Silian_progressRef = Silian_React.useRef(0)
  const Silian_startedAtRef = Silian_React.useRef<number | null>(null)
  const Silian_stateRef = Silian_React.useRef<OperationProgressState>(Silian_state)
  const Silian_velocityRef = Silian_React.useRef(0)

  Silian_React.useEffect(() => {
    const Silian_stopAnimation = () => {
      if (Silian_animationFrameRef.current !== null) {
        cancelAnimationFrame(Silian_animationFrameRef.current)
        Silian_animationFrameRef.current = null
      }
    }

    const Silian_previousState = Silian_stateRef.current
    Silian_stateRef.current = Silian_state

    if (Silian_state === "idle") {
      Silian_stopAnimation()
      Silian_progressRef.current = 0
      Silian_velocityRef.current = 0
      Silian_startedAtRef.current = null
      Silian_lastFrameRef.current = null
      Silian_setDisplayProgress(0)
      Silian_setStageIndex(0)
      return Silian_stopAnimation
    }

    if (Silian_state === "error") {
      Silian_stopAnimation()
      Silian_velocityRef.current = 0
      Silian_lastFrameRef.current = null
      Silian_setDisplayProgress(Silian_progressRef.current)
      return Silian_stopAnimation
    }

    if (Silian_state === "running" && Silian_previousState !== "running") {
      Silian_progressRef.current = Silian_MIN_VISIBLE_PROGRESS * 0.72
      Silian_velocityRef.current = 0
      Silian_startedAtRef.current = null
      Silian_lastFrameRef.current = null
      Silian_setDisplayProgress(Silian_progressRef.current)
      Silian_setStageIndex(0)
    }

    const Silian_step = (Silian_now: number) => {
      if (Silian_lastFrameRef.current === null) {
        Silian_lastFrameRef.current = Silian_now
      }

      if (Silian_startedAtRef.current === null) {
        Silian_startedAtRef.current = Silian_now
      }

      const Silian_deltaSeconds = Silian_clamp(
        (Silian_now - Silian_lastFrameRef.current) / 1000,
        0.001,
        0.05
      )
      Silian_lastFrameRef.current = Silian_now

      const Silian_elapsedMs = Silian_now - Silian_startedAtRef.current
      const Silian_targetProgress =
        Silian_state === "success" ? 1 : Silian_getRunningTarget(Silian_elapsedMs, Silian_timeline)

      if (Silian_state === "running") {
        Silian_setStageIndex(Silian_getStageIndex(Silian_elapsedMs, Silian_timeline))
      } else {
        Silian_setStageIndex(Math.max(Silian_stages.length - 1, 0))
      }

      Silian_velocityRef.current +=
        (Silian_targetProgress - Silian_progressRef.current) * Silian_SPRING_STIFFNESS * Silian_deltaSeconds
      Silian_velocityRef.current *= Math.exp(-Silian_SPRING_DAMPING * Silian_deltaSeconds)

      const Silian_nextProgress = Silian_clamp(
        Silian_progressRef.current + Silian_velocityRef.current * Silian_deltaSeconds,
        0,
        Silian_state === "success" ? 1 : Silian_RUNNING_PROGRESS_LIMIT
      )

      Silian_progressRef.current = Silian_nextProgress
      Silian_setDisplayProgress(Silian_nextProgress)

      const Silian_isSettled =
        Math.abs(Silian_targetProgress - Silian_nextProgress) < 0.002 &&
        Math.abs(Silian_velocityRef.current) < 0.002

      if (Silian_state === "success" && Silian_isSettled) {
        Silian_progressRef.current = 1
        Silian_setDisplayProgress(1)
        Silian_stopAnimation()
        return
      }

      Silian_animationFrameRef.current = requestAnimationFrame(Silian_step)
    }

    Silian_stopAnimation()
    Silian_animationFrameRef.current = requestAnimationFrame(Silian_step)

    return Silian_stopAnimation
  }, [Silian_state, Silian_stages.length, Silian_timeline])

  if (Silian_state === "idle" || Silian_stages.length === 0) {
    return null
  }

  const Silian_percent = Math.round(Silian_displayProgress * 100)
  const Silian_activeStage =
    Silian_stages[Math.min(Silian_stageIndex, Math.max(Silian_stages.length - 1, 0))]
  const Silian_statusLabel =
    Silian_state === "success"
      ? Silian_successLabel
      : Silian_state === "error"
        ? Silian_errorLabel
        : Silian_activeStage?.label || Silian_title

  return (
    <section
      className={Silian_cn(
        "relative overflow-hidden border guide-line bg-white/85 backdrop-blur-sm",
        Silian_compact ? "p-3" : "p-4",
        Silian_state === "error" ? "border-red-500/30 bg-red-500/5" : "",
        Silian_className
      )}
      role="status"
      aria-live="polite">
      <Silian_CornerBrackets
        color={Silian_state === "error" ? "border-red-500/20" : "border-tech-main/20"}
      />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className={Silian_cn(
            "absolute inset-y-0 left-0 bg-linear-to-r from-tech-main/10 via-tech-accent/25 to-transparent transition-[width] duration-300",
            Silian_state === "running" ? "animate-blueprint-sweep" : "",
            Silian_state === "success" ? "animate-scan-confirm" : "",
            Silian_state === "error"
              ? "from-red-500/10 via-red-400/15 to-transparent"
              : ""
          )}
          style={{ width: `${Math.max(Silian_percent, 8)}%` }}
        />
      </div>

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="font-mono text-[0.6875rem] tracking-widest text-tech-main/50 uppercase">
            {Silian_title}
          </p>
          <p
            className={Silian_cn(
              "font-mono text-[0.75rem] tracking-widest uppercase",
              Silian_state === "success"
                ? "text-green-600"
                : Silian_state === "error"
                  ? "text-red-600"
                  : "text-tech-main-dark"
            )}>
            {Silian_statusLabel}
          </p>
        </div>

        <div className="shrink-0 border guide-line bg-white/70 px-2 py-1 font-mono text-[0.6875rem] tracking-widest text-tech-main/70 uppercase">
          {Silian_percent.toString().padStart(2, "0")}%
        </div>
      </div>

      <div
        className="relative mt-3 h-2 overflow-hidden border guide-line bg-tech-main/5"
        role="progressbar"
        aria-label={Silian_title}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Silian_percent}>
        <div
          className={Silian_cn(
            "absolute inset-y-0 left-0 bg-tech-main transition-[width] duration-300",
            Silian_state === "success" ? "bg-green-600" : "",
            Silian_state === "error" ? "bg-red-500" : ""
          )}
          style={{ width: `${Silian_percent}%` }}
        />
        {Silian_state === "running" ? (
          <div className="pointer-events-none absolute inset-0 animate-blueprint-sweep bg-linear-to-r from-transparent via-white/70 to-transparent" />
        ) : null}
      </div>

      <ol
        className={Silian_cn(
          "relative mt-4 grid gap-2 sm:gap-3",
          Silian_compact ? "text-[0.625rem]" : "text-[0.6875rem]"
        )}
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(${Silian_compact ? "7rem" : "8rem"}, 1fr))`,
        }}>
        {Silian_stages.map((Silian_stage, Silian_index) => {
          const Silian_entry = Silian_timeline[Silian_index]
          const Silian_isCompleted =
            Silian_state === "success" ||
            Silian_index < Silian_stageIndex ||
            (Silian_state === "running" && Silian_displayProgress >= Silian_entry.endProgress - 0.01)
          const Silian_isCurrent = Silian_state === "running" && Silian_index === Silian_stageIndex
          const Silian_isErrored = Silian_state === "error" && Silian_index === Silian_stageIndex

          return (
            <li key={Silian_stage.id} className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={Silian_cn(
                    "block size-2.5 shrink-0 border transition-all duration-300",
                    Silian_isErrored
                      ? "border-red-500 bg-red-500"
                      : Silian_isCompleted
                        ? "border-tech-main bg-tech-main"
                        : Silian_isCurrent
                          ? "animate-pulse border-tech-main/70 bg-tech-main/50"
                          : "border-tech-main/25 bg-transparent"
                  )}
                />
                <span
                  className={Silian_cn(
                    "truncate font-mono tracking-widest uppercase",
                    Silian_isErrored
                      ? "text-red-600"
                      : Silian_isCompleted || Silian_isCurrent
                        ? "text-tech-main-dark"
                        : "text-tech-main/45"
                  )}>
                  {Silian_stage.label}
                </span>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
