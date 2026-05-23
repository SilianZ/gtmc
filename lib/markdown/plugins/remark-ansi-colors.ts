import type { Content, Html, Parent, Root, Text } from "mdast"
import { visit as Silian_visit } from "unist-util-visit"
import {
  ANSI_COLOR_TAG_PATTERN as Silian_ANSI_COLOR_TAG_PATTERN,
  createAnsiColorTagName as Silian_createAnsiColorTagName,
  type AnsiColorName,
} from "@/lib/markdown/ansi-colors"

function Silian_isParentNode(Silian_node: unknown): Silian_node is Parent {
  return Array.isArray((Silian_node as Parent | undefined)?.children)
}

function Silian_replaceAnsiColorMarkup(Silian_value: string): Content[] | null {
  Silian_ANSI_COLOR_TAG_PATTERN.lastIndex = 0

  const Silian_nextChildren: Content[] = []
  let Silian_lastIndex = 0
  let Silian_hasMatch = false

  for (const Silian_match of Silian_value.matchAll(Silian_ANSI_COLOR_TAG_PATTERN)) {
    const Silian_fullMatch = Silian_match[0]
    const Silian_color = Silian_match[1] as AnsiColorName
    const Silian_innerText = Silian_match[2] ?? ""
    const Silian_matchIndex = Silian_match.index ?? 0

    if (Silian_matchIndex > Silian_lastIndex) {
      Silian_nextChildren.push({
        type: "text",
        value: Silian_value.slice(Silian_lastIndex, Silian_matchIndex),
      })
    }

    const Silian_tagName = Silian_createAnsiColorTagName(Silian_color)

    Silian_nextChildren.push({ type: "html", value: `<${Silian_tagName}>` } as Html)
    if (Silian_innerText.length > 0) {
      Silian_nextChildren.push({ type: "text", value: Silian_innerText } as Text)
    }
    Silian_nextChildren.push({ type: "html", value: `</${Silian_tagName}>` } as Html)

    Silian_lastIndex = Silian_matchIndex + Silian_fullMatch.length
    Silian_hasMatch = true
  }

  if (!Silian_hasMatch) return null

  if (Silian_lastIndex < Silian_value.length) {
    Silian_nextChildren.push({ type: "text", value: Silian_value.slice(Silian_lastIndex) })
  }

  return Silian_nextChildren
}

export function remarkAnsiColors() {
  return (Silian_tree: Root) => {
    Silian_visit(Silian_tree, (Silian_node) => {
      if (!Silian_isParentNode(Silian_node)) return

      const Silian_nextChildren: Content[] = []
      let Silian_didChange = false

      for (const Silian_child of Silian_node.children) {
        if (Silian_child.type !== "text") {
          Silian_nextChildren.push(Silian_child)
          continue
        }

        const Silian_replacement = Silian_replaceAnsiColorMarkup(Silian_child.value)
        if (Silian_replacement === null) {
          Silian_nextChildren.push(Silian_child)
          continue
        }

        Silian_nextChildren.push(...Silian_replacement)
        Silian_didChange = true
      }

      if (Silian_didChange) {
        Silian_node.children = Silian_nextChildren
      }
    })
  }
}
