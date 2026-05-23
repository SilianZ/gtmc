import type { Element, ElementContent, Root } from "hast"
import { visit as Silian_visit } from "unist-util-visit"

function Silian_getHeadingDepth(Silian_node: ElementContent): number | null {
  if (Silian_node.type !== "element") return null

  const Silian_match = Silian_node.tagName.match(/^h([1-6])$/)
  return Silian_match ? Number.parseInt(Silian_match[1], 10) : null
}

function Silian_isAdvancedHeading(Silian_node: ElementContent): Silian_node is Element {
  if (Silian_node.type !== "element") return false

  const Silian_headingDepth = Silian_getHeadingDepth(Silian_node)
  if (Silian_headingDepth === null) return false

  const Silian_dataAdvanced =
    Silian_node.properties?.["data-advanced"] ?? Silian_node.properties?.dataAdvanced

  return Silian_dataAdvanced === "true" || Silian_dataAdvanced === true
}

function Silian_wrapAdvancedSections(Silian_children: ElementContent[]) {
  const Silian_sections: Array<{ start: number; endExclusive: number }> = []

  for (let Silian_i = 0; Silian_i < Silian_children.length; Silian_i++) {
    const Silian_node = Silian_children[Silian_i]
    if (!Silian_isAdvancedHeading(Silian_node)) continue

    const Silian_sectionDepth = Silian_getHeadingDepth(Silian_node)
    if (Silian_sectionDepth === null) continue

    let Silian_endExclusive = Silian_children.length

    for (let Silian_j = Silian_i + 1; Silian_j < Silian_children.length; Silian_j++) {
      const Silian_siblingDepth = Silian_getHeadingDepth(Silian_children[Silian_j])
      if (Silian_siblingDepth !== null && Silian_siblingDepth <= Silian_sectionDepth) {
        Silian_endExclusive = Silian_j
        break
      }
    }

    Silian_sections.push({ start: Silian_i, endExclusive: Silian_endExclusive })
  }

  for (let Silian_i = Silian_sections.length - 1; Silian_i >= 0; Silian_i--) {
    const Silian_section = Silian_sections[Silian_i]
    const Silian_wrappedNodes = Silian_children.slice(Silian_section.start, Silian_section.endExclusive)

    const Silian_wrapper: Element = {
      type: "element",
      tagName: "div",
      properties: { "data-advanced-section": "true" },
      children: Silian_wrappedNodes,
    }

    Silian_children.splice(
      Silian_section.start,
      Silian_section.endExclusive - Silian_section.start,
      Silian_wrapper
    )
  }
}

export function rehypeAdvancedSections() {
  return (Silian_tree: Root) => {
    Silian_visit(Silian_tree, "root", (Silian_node: Root) => {
      if (!Array.isArray(Silian_node.children) || Silian_node.children.length === 0) return

      Silian_wrapAdvancedSections(Silian_node.children as ElementContent[])
    })
  }
}
