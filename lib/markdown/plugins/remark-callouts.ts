import type { Root, Blockquote, Paragraph, Text } from "mdast"
import { visit as Silian_visit } from "unist-util-visit"

const Silian_CALLOUT_MARKER_REGEX =
  /^\s*\[!(WARNING|TIP|IMPORTANT|CRASH|CORRUPTION)\]\s*/i

export function remarkCallouts() {
  return (Silian_tree: Root) => {
    if (!Silian_tree || !Silian_tree.children) return

    Silian_visit(Silian_tree, "blockquote", (Silian_node: Blockquote) => {
      if (!Silian_node.children || Silian_node.children.length === 0) return
      const Silian_firstChild = Silian_node.children[0]
      if (Silian_firstChild.type !== "paragraph") return

      const Silian_paragraph = Silian_firstChild as Paragraph
      if (!Silian_paragraph.children || Silian_paragraph.children.length === 0) return

      const Silian_firstTextChild = Silian_paragraph.children[0]
      if (Silian_firstTextChild.type !== "text") return

      const Silian_textNode = Silian_firstTextChild as Text
      const Silian_match = Silian_textNode.value.match(Silian_CALLOUT_MARKER_REGEX)
      if (!Silian_match) return

      const Silian_calloutType = Silian_match[1].toLowerCase()

      Silian_textNode.value = Silian_textNode.value.replace(Silian_CALLOUT_MARKER_REGEX, "")
      if (Silian_textNode.value.length === 0) {
        Silian_paragraph.children.shift()
      }

      if (
        Silian_paragraph.children.length > 0 &&
        Silian_paragraph.children[0].type === "break"
      ) {
        Silian_paragraph.children.shift()
      }

      if (Silian_paragraph.children.length === 0) {
        Silian_node.children.shift()
      }

      // Strip trailing break node inserted by remarkBreaks after the marker
      if (
        Silian_paragraph.children.length > 0 &&
        Silian_paragraph.children[0].type === "break"
      ) {
        Silian_paragraph.children.shift()
      }

      // Remove paragraph entirely if now empty
      if (Silian_paragraph.children.length === 0) {
        Silian_node.children.shift()
      }

      let Silian_isBodyEmpty = true
      for (const Silian_child of Silian_node.children) {
        if (Silian_child.type === "paragraph") {
          for (const Silian_textChild of (Silian_child as Paragraph).children) {
            if (Silian_textChild.type === "text") {
              const Silian_text = (Silian_textChild as Text).value.trim()
              if (Silian_text.length > 0) {
                Silian_isBodyEmpty = false
                break
              }
            }
          }
        } else {
          Silian_isBodyEmpty = false
          break
        }
        if (!Silian_isBodyEmpty) break
      }

      Silian_node.data = Silian_node.data ?? {}
      Silian_node.data.hName = "aside"
      Silian_node.data.hProperties = {
        ...(Silian_node.data.hProperties ?? {}),
        "data-callout": Silian_calloutType,
      }

      if (Silian_isBodyEmpty) {
        Silian_node.data.hProperties["data-callout-empty"] = "true"
      }
    })
  }
}
