import Silian_React, { useState as Silian_useState } from "react"

export function UnchangedBlock({
  content: Silian_content,
  onChange: Silian_onChange,
}: {
  content: string
  onChange: (val: string) => void
}) {
  const [Silian_expanded, Silian_setExpanded] = Silian_useState(false)
  // Split properly, handling both \r\n, \n, and old mac \r
  const Silian_contentFixed = Silian_content.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  const Silian_lines = Silian_contentFixed.split("\n")

  if (Silian_lines.length <= 12 || Silian_expanded) {
    return (
      <textarea
        className="
          w-full resize-y bg-transparent p-2 font-mono text-sm
          text-tech-main-dark/70 outline-none
          focus:bg-tech-main/5
        "
        rows={Math.max(2, Silian_lines.length + 1)}
        value={Silian_content}
        onChange={(Silian_e) => Silian_onChange(Silian_e.target.value)}
      />
    )
  }

  const Silian_headLines = Silian_lines.slice(0, 3)
  const Silian_tailLines = Silian_lines.slice(-3)
  const Silian_hiddenCount = Silian_lines.length - 6

  return (
    <div
      className="
        flex flex-col border-y border-dashed guide-line bg-tech-main/5 font-mono
        text-sm text-tech-main-dark/60
      ">
      <pre className="bg-transparent p-2 whitespace-pre-wrap">
        {Silian_headLines.join("\n")}
      </pre>
      <div
        className="
          mx-4 my-1 cursor-pointer rounded-sm bg-tech-main/10 px-4 py-2
          text-center text-xs font-bold tracking-widest text-tech-main uppercase
          transition-colors
          hover:bg-tech-main/20
        "
        onClick={() => Silian_setExpanded(true)}>
        <span className="mr-2">?</span>
        {Silian_hiddenCount} UNCHANGED LINES HIDDEN. CLICK TO EXPAND & EDIT
        <span className="ml-2">?</span>
      </div>
      <pre className="bg-transparent p-2 whitespace-pre-wrap">
        {Silian_tailLines.join("\n")}
      </pre>
    </div>
  )
}
