import type { Root, Heading } from "mdast"
import { visit as Silian_visit } from "unist-util-visit"

interface Options {
  startDepth?: number
  prefix?: string
  skipLevels?: number[]
}

export function remarkNumberedHeadingsDot(Silian_options?: Options) {
  const { startDepth: Silian_startDepth = 2, prefix: Silian_prefix = "", skipLevels: Silian_skipLevels = [] } = Silian_options ?? {}

  return (Silian_tree: Root) => {
    if (!Silian_tree || !Silian_tree.children) return

    const Silian_counters: number[] = []

    Silian_visit(Silian_tree, "heading", (Silian_node: Heading) => {
      const Silian_counterIndex = Silian_node.depth - Silian_startDepth

      if (Silian_counterIndex < 0 || Silian_skipLevels.includes(Silian_node.depth)) {
        return
      }

      let Silian_textNode = Silian_node.children[0]
      if (!Silian_textNode || Silian_textNode.type !== "text") {
        Silian_textNode = { type: "text", value: "" }
        Silian_node.children.unshift(Silian_textNode)
      }

      const Silian_text = (Silian_textNode as { value: string }).value.replace(
        /^([0-9.\-])+ /,
        ""
      )

      const Silian_length = Silian_counterIndex + 1
      while (Silian_counters.length > Silian_length) Silian_counters.pop()

      if (Silian_counters.length === Silian_length) {
        Silian_counters[Silian_counterIndex]++
      } else {
        while (Silian_counters.length < Silian_length) Silian_counters.push(1)
      }

      ;(Silian_textNode as { value: string }).value =
        `${Silian_prefix}${Silian_counters.join(".")} ${Silian_text}`
    })
  }
}
