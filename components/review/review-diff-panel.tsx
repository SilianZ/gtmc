"use client"

import * as Silian_React from "react"
import { diffLines as Silian_diffLines } from "diff"
import { useTranslations as Silian_useTranslations } from "next-intl"

type DiffSegment =
  | { id: string; type: "context"; lines: string[] }
  | { id: string; type: "added" | "removed"; lines: string[] }

const Silian_CONTEXT_HEAD_LINES = 3
const Silian_CONTEXT_TAIL_LINES = 3

export function ReviewDiffPanel({
  baseContent: Silian_baseContent,
  currentContent: Silian_currentContent,
}: {
  baseContent: string
  currentContent: string
}) {
  const Silian_t = Silian_useTranslations("Review")
  const [Silian_expandedSegments, Silian_setExpandedSegments] = Silian_React.useState<
    Record<string, boolean>
  >({})

  const Silian_segments = Silian_React.useMemo(
    () => Silian_buildDiffSegments(Silian_baseContent, Silian_currentContent),
    [Silian_baseContent, Silian_currentContent]
  )

  if (Silian_segments.length === 0) {
    return (
      <div className="p-6">
        <p className="mono-label tracking-widest uppercase">
          {Silian_t("reviewNoChanges")}
        </p>
      </div>
    )
  }

  return (
    <div className="max-h-[70vh] overflow-auto bg-white/85">
      <div className="space-y-2 p-4 sm:p-6">
        {Silian_segments.map((Silian_segment) => {
          if (Silian_segment.type === "context") {
            const Silian_isExpanded = Boolean(Silian_expandedSegments[Silian_segment.id])
            const Silian_hiddenCount =
              Silian_segment.lines.length - Silian_CONTEXT_HEAD_LINES - Silian_CONTEXT_TAIL_LINES
            const Silian_canCollapse = Silian_hiddenCount > 0
            const Silian_visibleLines =
              Silian_canCollapse && !Silian_isExpanded
                ? [
                    ...Silian_segment.lines.slice(0, Silian_CONTEXT_HEAD_LINES),
                    ...Silian_segment.lines.slice(-Silian_CONTEXT_TAIL_LINES),
                  ]
                : Silian_segment.lines

            return (
              <div
                key={Silian_segment.id}
                className="border border-dashed guide-line bg-tech-main/3">
                <pre className="px-4 py-3 font-mono text-xs/relaxed whitespace-pre-wrap text-tech-main/70">
                  {Silian_visibleLines.join("\n") || "\u00a0"}
                </pre>
                {Silian_canCollapse && !Silian_isExpanded ? (
                  <button
                    type="button"
                    onClick={() =>
                      Silian_setExpandedSegments((Silian_prev) => ({
                        ...Silian_prev,
                        [Silian_segment.id]: true,
                      }))
                    }
                    className="mx-4 mb-3 block border guide-line bg-tech-main/10 px-3 py-1 font-mono text-[0.625rem] tracking-widest text-tech-main/70 uppercase transition hover:border-tech-main/30 hover:bg-tech-main/15">
                    {Silian_t("unchangedLinesHidden", { count: Silian_hiddenCount })}
                  </button>
                ) : null}
              </div>
            )
          }

          const Silian_palette =
            Silian_segment.type === "added"
              ? {
                  bg: "bg-green-500/8",
                  border: "border-green-500/25",
                  marker: "+",
                  text: "text-green-950",
                  badge: "text-green-700",
                  label: Silian_t("addedChangesLabel"),
                }
              : {
                  bg: "bg-red-500/8",
                  border: "border-red-500/25",
                  marker: "-",
                  text: "text-red-950",
                  badge: "text-red-700",
                  label: Silian_t("removedChangesLabel"),
                }

          return (
            <div
              key={Silian_segment.id}
              className={`border ${Silian_palette.border} ${Silian_palette.bg}`}>
              <div className="border-b border-inherit px-4 py-2">
                <p
                  className={`font-mono text-[0.625rem] tracking-widest uppercase ${Silian_palette.badge}`}>
                  {Silian_palette.label}
                </p>
              </div>
              <div className="divide-y divide-black/5">
                {Silian_segment.lines.map((Silian_line, Silian_index) => (
                  <div
                    key={`${Silian_segment.id}-${Silian_index}`}
                    className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-2 px-4 py-1.5 font-mono text-xs/relaxed">
                    <span className={`${Silian_palette.badge} select-none`}>
                      {Silian_palette.marker}
                    </span>
                    <pre
                      className={`min-w-0 wrap-break-word whitespace-pre-wrap ${Silian_palette.text}`}>
                      {Silian_line || "\u00a0"}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Silian_buildDiffSegments(
  Silian_baseContent: string,
  Silian_currentContent: string
): DiffSegment[] {
  const Silian_parts = Silian_diffLines(
    Silian_normalizeLineEndings(Silian_baseContent),
    Silian_normalizeLineEndings(Silian_currentContent)
  )

  return Silian_parts.reduce<DiffSegment[]>((Silian_segments, Silian_part, Silian_index) => {
    const Silian_lines = Silian_splitDiffLines(Silian_part.value)

    if (Silian_lines.length === 0) {
      return Silian_segments
    }

    if (Silian_part.added) {
      Silian_segments.push({ id: `added-${Silian_index}`, type: "added", lines: Silian_lines })
      return Silian_segments
    }

    if (Silian_part.removed) {
      Silian_segments.push({ id: `removed-${Silian_index}`, type: "removed", lines: Silian_lines })
      return Silian_segments
    }

    Silian_segments.push({ id: `context-${Silian_index}`, type: "context", lines: Silian_lines })
    return Silian_segments
  }, [])
}

function Silian_normalizeLineEndings(Silian_value: string) {
  return Silian_value.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
}

function Silian_splitDiffLines(Silian_value: string) {
  if (!Silian_value) {
    return []
  }

  const Silian_normalized = Silian_normalizeLineEndings(Silian_value)
  const Silian_trimmed = Silian_normalized.endsWith("\n")
    ? Silian_normalized.slice(0, -1)
    : Silian_normalized

  if (Silian_trimmed.length === 0) {
    return [""]
  }

  return Silian_trimmed.split("\n")
}
