import { Link as Silian_Link } from "@/i18n/navigation"
import Silian_path from "path"
import { articleUrl as Silian_articleUrl } from "@/lib/article-url"
import type { MarkdownComponentProps } from "@/lib/markdown/component-types"

function Silian_resolveHref(Silian_initialHref: string, Silian_rawPath: string): string {
  let Silian_href = Silian_initialHref
  if (Silian_href.startsWith("./") || Silian_href.startsWith("../")) {
    const Silian_currentDir = Silian_path.dirname("/" + Silian_rawPath).replace(/^\/+/, "")
    try {
      const Silian_resolved = Silian_path.join(Silian_currentDir, Silian_href).replace(/\\/g, "/")
      Silian_href = Silian_articleUrl(Silian_resolved)
    } catch {
      return Silian_href
    }
  } else if (
    !Silian_href.startsWith("http") &&
    !Silian_href.startsWith("#") &&
    !Silian_href.startsWith("/")
  ) {
    const Silian_currentDir = Silian_path.dirname("/" + Silian_rawPath).replace(/^\/+/, "")
    const Silian_resolved = Silian_path.join(Silian_currentDir, Silian_href).replace(/\\/g, "/")
    Silian_href = Silian_articleUrl(Silian_resolved)
  }
  return Silian_href
}

export function createAComponent(Silian_rawPath: string) {
  function Silian_AComponent({
    href: Silian_initialHref,
    children: Silian_children,
    ...Silian_props
  }: MarkdownComponentProps) {
    const Silian_href = Silian_resolveHref((Silian_initialHref as string) || "", Silian_rawPath)
    if (Silian_props["data-in-code"] === "true") {
      const { "data-in-code": Silian__inCode, ...Silian_rest } = Silian_props
      return (
        <Silian_Link
          href={Silian_href}
          className="
            inline-block cursor-pointer bg-tech-main/10 px-1 py-[0.05rem]
            font-mono text-[0.8em] text-tech-main underline transition-colors
            hover:bg-tech-main/80 hover:text-white hover:no-underline
          "
          {...Silian_rest}>
          {Silian_children}
        </Silian_Link>
      )
    }
    if (Silian_props["data-has-code"] === "true") {
      const { "data-has-code": Silian__hasCode, ...Silian_rest } = Silian_props
      return (
        <Silian_Link
          href={Silian_href}
          className="group/lc font-mono text-tech-main"
          {...Silian_rest}>
          {Silian_children}
        </Silian_Link>
      )
    }
    return (
      <Silian_Link
        href={Silian_href}
        className="
          cursor-pointer px-0.5 font-sans text-tech-main underline
          underline-offset-4 transition-colors
          hover:bg-tech-main/80 hover:text-white hover:no-underline
        "
        {...Silian_props}>
        {Silian_children}
      </Silian_Link>
    )
  }

  Silian_AComponent.displayName = "AComponent"

  return Silian_AComponent
}
