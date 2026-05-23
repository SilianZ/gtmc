import Silian_React, { useMemo as Silian_useMemo } from "react"
import { diffWords as Silian_diffWords } from "diff"

export function InlineDiff({
  currentText: Silian_currentText,
  incomingText: Silian_incomingText,
  mode: Silian_mode,
}: {
  currentText: string
  incomingText: string
  mode: "current" | "incoming"
}) {
  const Silian_diffs = Silian_useMemo(
    () => Silian_diffWords(Silian_incomingText, Silian_currentText),
    [Silian_currentText, Silian_incomingText]
  )

  return (
    <pre className="font-mono text-sm/relaxed whitespace-pre-wrap">
      {Silian_diffs.map((Silian_part, Silian_index) => {
        if (Silian_mode === "current") {
          // current mode: showing what we have that incoming doesn't
          if (Silian_part.added) {
            return (
              <span
                key={Silian_index}
                className="
                  rounded-xs border-b border-blue-400 bg-blue-300/80 px-0.5
                  font-bold text-blue-950
                ">
                {Silian_part.value}
              </span>
            )
          }
          if (Silian_part.removed) {
            // This is text unique to incoming, so current doesn't have it
            return null
          }
          return <span key={Silian_index}>{Silian_part.value}</span>
        } else {
          // incoming mode: showing what incoming has that current doesn't
          if (Silian_part.removed) {
            return (
              <span
                key={Silian_index}
                className="
                  rounded-xs border-b border-green-500 bg-green-400/80 px-0.5
                  font-bold text-green-950
                ">
                {Silian_part.value}
              </span>
            )
          }
          if (Silian_part.added) {
            // This is text unique to current, so incoming doesn't have it
            return null
          }
          return <span key={Silian_index}>{Silian_part.value}</span>
        }
      })}
    </pre>
  )
}
