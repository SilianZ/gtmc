import type { Root, Heading } from "mdast"
import { visit as Silian_visit } from "unist-util-visit"

const Silian_ADVANCED_TAG_REGEX = /\[!ADVANCED\]/g

export function remarkAdvancedSections() {
  return (Silian_tree: Root) => {
    if (!Silian_tree || !Silian_tree.children) return

    Silian_visit(Silian_tree, "heading", (Silian_node: Heading) => {
      let Silian_hasAdvancedTag = false

      Silian_node.children.forEach((Silian_child) => {
        if (Silian_child.type !== "text") return

        const Silian_nextValue = Silian_child.value.replace(Silian_ADVANCED_TAG_REGEX, "")
        if (Silian_nextValue !== Silian_child.value) Silian_hasAdvancedTag = true
        Silian_child.value = Silian_nextValue
      })

      if (!Silian_hasAdvancedTag) return

      Silian_node.data = Silian_node.data ?? {}
      Silian_node.data.hProperties = {
        ...(Silian_node.data.hProperties ?? {}),
        "data-advanced": "true",
      }
    })
  }
}
