import type { Root, Element, Text } from "hast"
import { visit as Silian_visit } from "unist-util-visit"
import { getSingletonHighlighter as Silian_getSingletonHighlighter } from "shiki"

export type RehypeShikiPlugin = Awaited<ReturnType<typeof createRehypeShiki>>

const Silian_highlightCache = new Map<string, Element | null>()
const Silian_pluginCache = new Map<string, Promise<RehypeShikiPlugin>>()

function Silian_createNoopRehypeShiki(): RehypeShikiPlugin {
  return function rehypeShiki() {
    return function () {
      return
    }
  }
}

function Silian_extractLangsFromMarkdown(Silian_content: string): string[] {
  const Silian_matches = Silian_content.matchAll(/^```(\w+)/gm)
  const Silian_langs = new Set<string>()
  for (const Silian_match of Silian_matches) {
    if (Silian_match[1] && Silian_match[1] !== "text" && Silian_match[1] !== "plain") {
      Silian_langs.add(Silian_match[1].toLowerCase())
    }
  }
  return [...Silian_langs]
}

export async function createRehypeShiki(Silian_langs?: string[]) {
  const Silian_langsToLoad = Silian_langs && Silian_langs.length > 0 ? Silian_langs : ["javascript"]
  const Silian_highlighter = await Silian_getSingletonHighlighter({
    themes: ["solarized-light"],
    langs: Silian_langsToLoad,
  })

  return function rehypeShiki() {
    return function (Silian_tree: Root): void {
      Silian_visit(Silian_tree, "element", (Silian_node: Element) => {
        if (Silian_node.tagName !== "pre") return

        const Silian_codeNode = Silian_node.children.find(
          (Silian_child): Silian_child is Element =>
            Silian_child.type === "element" && Silian_child.tagName === "code"
        )
        if (!Silian_codeNode) return

        const Silian_classNames = Array.isArray(Silian_codeNode.properties?.className)
          ? (Silian_codeNode.properties.className as string[])
          : []
        const Silian_langClass = Silian_classNames.find((Silian_c) => Silian_c.startsWith("language-"))
        if (!Silian_langClass) return

        const Silian_lang = Silian_langClass.replace("language-", "")
        const Silian_rawCode = Silian_getTextContent(Silian_codeNode)
        const Silian_cacheKey = `v2:${Silian_lang}:${Silian_rawCode}`

        try {
          if (Silian_highlightCache.has(Silian_cacheKey)) {
            const Silian_cached = Silian_highlightCache.get(Silian_cacheKey)
            if (Silian_cached) {
              Silian_codeNode.children = Silian_cached.children
              Silian_node.properties = Silian_node.properties ?? {}
              Silian_node.properties["data-raw-code"] = Silian_rawCode
              Silian_node.properties["data-lang"] = Silian_lang
              Silian_node.properties["data-line-count"] = String(
                Silian_rawCode.endsWith("\n")
                  ? Silian_rawCode.split("\n").length - 1
                  : Silian_rawCode.split("\n").length
              )
            }
            return
          }

          const Silian_highlighted = Silian_highlighter.codeToHast(Silian_rawCode, {
            lang: Silian_lang,
            theme: "solarized-light",
          })

          const Silian_highlightedPre = Silian_highlighted.children.find(
            (Silian_c): Silian_c is Element => Silian_c.type === "element" && Silian_c.tagName === "pre"
          )
          if (!Silian_highlightedPre) return

          const Silian_highlightedCode = Silian_highlightedPre.children.find(
            (Silian_c): Silian_c is Element => Silian_c.type === "element" && Silian_c.tagName === "code"
          )
          if (!Silian_highlightedCode) return

          const Silian_filtered = Silian_highlightedCode.children.filter(
            (Silian_child) =>
              !(Silian_child.type === "text" && Silian_child.value.trim() === "") &&
              !(
                Silian_child.type === "element" &&
                (Silian_child as Element).tagName === "span" &&
                (Silian_child as Element).children.length === 0
              )
          )

          for (const Silian_child of Silian_filtered) {
            if (Silian_child.type !== "element") continue
            const Silian_lineEl = Silian_child as Element
            const Silian_firstToken = Silian_lineEl.children.find(
              (Silian_c) => Silian_c.type === "element"
            ) as Element | undefined
            const Silian_firstText =
              Silian_firstToken?.children[0]?.type === "text"
                ? (Silian_firstToken.children[0] as Text).value
                : ""
            const Silian_leadingSpaces = Silian_firstText.match(/^(\s*)/)?.[1] ?? ""
            const Silian_indent = [...Silian_leadingSpaces].reduce(
              (Silian_n, Silian_ch) => Silian_n + (Silian_ch === "\t" ? 4 : 1),
              0
            )
            if (Silian_indent > 0) {
              Silian_lineEl.properties = Silian_lineEl.properties ?? {}
              const Silian_existing = (Silian_lineEl.properties.style as string) ?? ""
              Silian_lineEl.properties.style =
                (Silian_existing ? Silian_existing + ";" : "") + `--line-indent:${Silian_indent}ch`
            }
          }

          Silian_highlightCache.set(Silian_cacheKey, {
            ...Silian_highlightedCode,
            children: Silian_filtered,
          })

          Silian_codeNode.children = Silian_filtered

          Silian_node.properties = Silian_node.properties ?? {}
          Silian_node.properties["data-raw-code"] = Silian_rawCode
          Silian_node.properties["data-lang"] = Silian_lang
          Silian_node.properties["data-line-count"] = String(
            Silian_rawCode.endsWith("\n")
              ? Silian_rawCode.split("\n").length - 1
              : Silian_rawCode.split("\n").length
          )
        } catch {
          /* unsupported language or highlighting error — leave node untouched */
        }
      })
    }
  }
}

export function getCachedRehypeShiki(
  Silian_content?: string
): Promise<RehypeShikiPlugin> {
  const Silian_langs = Silian_content ? Silian_extractLangsFromMarkdown(Silian_content) : []
  if (Silian_langs.length === 0) {
    return Promise.resolve(Silian_createNoopRehypeShiki())
  }

  const Silian_langKey = [...new Set(Silian_langs)].sort().join(",")
  const Silian_cachedPlugin = Silian_pluginCache.get(Silian_langKey)
  if (Silian_cachedPlugin) {
    return Silian_cachedPlugin
  }

  const Silian_createdPlugin = createRehypeShiki(Silian_langs)
  Silian_pluginCache.set(Silian_langKey, Silian_createdPlugin)
  return Silian_createdPlugin
}

function Silian_getTextContent(Silian_node: Element | Text): string {
  if (Silian_node.type === "text") return Silian_node.value
  if (Silian_node.type === "element") {
    return (Silian_node as Element).children
      .map((Silian_child) => {
        if (Silian_child.type === "text") return Silian_child.value
        if (Silian_child.type === "element") return Silian_getTextContent(Silian_child as Element)
        return ""
      })
      .join("")
  }
  return ""
}
