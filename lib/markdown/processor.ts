import Silian_remarkGfm from "remark-gfm"
import Silian_remarkMath from "remark-math"
import Silian_remarkBreaks from "remark-breaks"
import Silian_rehypeRaw from "rehype-raw"
import Silian_rehypeKatex from "rehype-katex"
import Silian_rehypeSlug from "rehype-slug"
import type { Element, Root, Text } from "hast"
import { visit as Silian_visit } from "unist-util-visit"
import { pangu as Silian_pangu } from "pangu"
import { remarkAnsiColors as Silian_remarkAnsiColors } from "@/lib/markdown/plugins/remark-ansi-colors"
import { remarkCallouts as Silian_remarkCallouts } from "@/lib/markdown/plugins/remark-callouts"
import { remarkAdvancedSections as Silian_remarkAdvancedSections } from "@/lib/markdown/plugins/remark-advanced-sections"
import { remarkNumberedHeadingsDot as Silian_remarkNumberedHeadingsDot } from "@/lib/markdown/plugins/remark-heading-numbering"
import { rehypeAdvancedSections as Silian_rehypeAdvancedSections } from "@/lib/markdown/plugins/rehype-advanced-sections"
import type { createRehypeShiki } from "@/lib/markdown/plugins/rehype-shiki"

export function rehypeLinkedCode() {
  return (Silian_tree: Root) => {
    Silian_visit(Silian_tree, "element", (Silian_node: Element) => {
      if (Silian_node.tagName === "a") {
        const Silian_codeChild = Silian_node.children?.some(
          (Silian_c) => Silian_c.type === "element" && (Silian_c as Element).tagName === "code"
        )
        if (Silian_codeChild) {
          Silian_node.properties = Silian_node.properties || {}
          Silian_node.properties["data-has-code"] = "true"
          Silian_node.children?.forEach((Silian_c) => {
            if (Silian_c.type === "element" && (Silian_c as Element).tagName === "code") {
              ;(Silian_c as Element).properties = (Silian_c as Element).properties || {}
              ;(Silian_c as Element).properties["data-linked-code"] = "true"
            }
          })
        }
      }
      if (Silian_node.tagName === "code") {
        const Silian_linkChild = Silian_node.children?.some(
          (Silian_c) => Silian_c.type === "element" && (Silian_c as Element).tagName === "a"
        )
        if (Silian_linkChild) {
          Silian_node.properties = Silian_node.properties || {}
          Silian_node.properties["data-has-link"] = "true"
          Silian_node.children?.forEach((Silian_c) => {
            if (Silian_c.type === "element" && (Silian_c as Element).tagName === "a") {
              ;(Silian_c as Element).properties = (Silian_c as Element).properties || {}
              ;(Silian_c as Element).properties["data-in-code"] = "true"
            }
          })
        }
      }
    })
  }
}

export function rehypeCJKSpacing() {
  return (Silian_tree: Root) => {
    Silian_visit(Silian_tree, (Silian_node, Silian__, Silian_parent) => {
      if (Silian_node.type !== "text") return
      if (Silian_parent?.type === "element") {
        const Silian_parentTag = (Silian_parent as Element).tagName
        if (Silian_parentTag === "code" || Silian_parentTag === "pre") return
      }
      const Silian_textNode = Silian_node as Text
      Silian_textNode.value = Silian_pangu.spacingText(Silian_textNode.value)
    })
  }
}

export function getPluginsForContent(
  Silian_content: string,
  Silian_rehypeShikiPlugin?: Awaited<ReturnType<typeof createRehypeShiki>>
) {
  const Silian_remarkPlugins: Array<
    | typeof Silian_remarkGfm
    | typeof Silian_remarkMath
    | typeof Silian_remarkBreaks
    | typeof Silian_remarkAnsiColors
    | typeof Silian_remarkCallouts
    | typeof Silian_remarkAdvancedSections
    | [typeof Silian_remarkNumberedHeadingsDot, { startDepth: number }]
  > = [
    Silian_remarkGfm,
    Silian_remarkBreaks,
    Silian_remarkAnsiColors,
    Silian_remarkCallouts,
    Silian_remarkAdvancedSections,
    [Silian_remarkNumberedHeadingsDot, { startDepth: 2 }],
  ]

  const Silian_rehypePlugins: Array<
    | typeof Silian_rehypeRaw
    | typeof Silian_rehypeAdvancedSections
    | typeof Silian_rehypeKatex
    | typeof Silian_rehypeSlug
    | typeof rehypeCJKSpacing
    | typeof rehypeLinkedCode
    | Awaited<ReturnType<typeof createRehypeShiki>>
  > = [Silian_rehypeRaw, Silian_rehypeAdvancedSections, rehypeLinkedCode, Silian_rehypeSlug]

  if (
    Silian_content.includes("$") ||
    Silian_content.includes("\\(") ||
    Silian_content.includes("\\[")
  ) {
    Silian_remarkPlugins.push(Silian_remarkMath)
    Silian_rehypePlugins.splice(2, 0, Silian_rehypeKatex)
  }

  if (Silian_rehypeShikiPlugin) Silian_rehypePlugins.push(Silian_rehypeShikiPlugin)
  Silian_rehypePlugins.push(rehypeCJKSpacing)

  return { remarkPlugins: Silian_remarkPlugins, rehypePlugins: Silian_rehypePlugins }
}
