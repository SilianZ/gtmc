import { diff3Merge as Silian_diff3Merge } from "node-diff3"

export interface MergeConflictBlock {
  type: "conflict"
  ours: string[]
  base: string[]
  theirs: string[]
}

export interface MergeOkBlock {
  type: "ok"
  lines: string[]
}

export type MergeBlock = MergeConflictBlock | MergeOkBlock

export interface MergeResult {
  conflict: boolean
  blocks: MergeBlock[]
  content: string
}

export interface IMergeLibrary {
  merge(params: {
    baseContent: string
    draftContent: string
    latestMainContent: string
    labels?: { base?: string; draft?: string; main?: string }
  }): MergeResult
}

function Silian_splitLines(Silian_content: string): string[] {
  if (!Silian_content) return []
  return Silian_content.replace(/\r\n/g, "\n").split("\n")
}

function Silian_joinLines(Silian_lines: string[]): string {
  return Silian_lines.join("\n")
}

class NodeDiff3Adapter implements IMergeLibrary {
  merge(Silian_params: {
    baseContent: string
    draftContent: string
    latestMainContent: string
    labels?: { base?: string; draft?: string; main?: string }
  }): MergeResult {
    const Silian_draftLines = Silian_splitLines(Silian_params.draftContent)
    const Silian_baseLines = Silian_splitLines(Silian_params.baseContent)
    const Silian_mainLines = Silian_splitLines(Silian_params.latestMainContent)

    const Silian_diff3Result = Silian_diff3Merge(Silian_draftLines, Silian_baseLines, Silian_mainLines)

    const Silian_blocks: MergeBlock[] = []
    let Silian_hasConflict = false
    const Silian_contentLines: string[] = []

    for (const Silian_block of Silian_diff3Result) {
      if ("ok" in Silian_block && Silian_block.ok) {
        Silian_blocks.push({ type: "ok", lines: Silian_block.ok })
        Silian_contentLines.push(...Silian_block.ok)
      } else if ("conflict" in Silian_block && Silian_block.conflict) {
        Silian_hasConflict = true
        const Silian_conflict = Silian_block.conflict
        const Silian_a = Silian_conflict.a || []
        const Silian_o = Silian_conflict.o || []
        const Silian_b = Silian_conflict.b || []

        Silian_blocks.push({
          type: "conflict",
          ours: Silian_a,
          base: Silian_o,
          theirs: Silian_b,
        })

        const Silian_draftLabel = Silian_params.labels?.draft || "draft"
        const Silian_mainLabel = Silian_params.labels?.main || "main"

        Silian_contentLines.push(`<<<<<<< ${Silian_draftLabel}`)
        Silian_contentLines.push(...Silian_a)
        Silian_contentLines.push("=======")
        Silian_contentLines.push(...Silian_b)
        Silian_contentLines.push(`>>>>>>> ${Silian_mainLabel}`)
      }
    }

    return {
      conflict: Silian_hasConflict,
      blocks: Silian_blocks,
      content: Silian_joinLines(Silian_contentLines),
    }
  }
}

export function getMergeLibrary(): IMergeLibrary {
  return new NodeDiff3Adapter()
}
