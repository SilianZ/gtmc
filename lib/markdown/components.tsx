import { useTranslations as Silian_useTranslations } from "next-intl"
import { CodeBlockPre as Silian_CodeBlockPre } from "@/components/code-block-pre"
import { createAComponent as Silian_createAComponent } from "@/lib/markdown/a-component"
import {
  ANSI_COLOR_NAMES as Silian_ANSI_COLOR_NAMES,
  createAnsiColorTagName as Silian_createAnsiColorTagName,
  type AnsiColorName,
} from "@/lib/markdown/ansi-colors"
import type {
  MarkdownAstNode,
  MarkdownComponent,
  MarkdownComponentProps,
} from "@/lib/markdown/component-types"
import { HeadingAnchor as Silian_HeadingAnchor } from "@/lib/markdown/heading-anchor"
import { createImageComponent as Silian_createImageComponent } from "@/lib/markdown/image-component"

/**
 * Filter children to exclude whitespace-only text nodes.
 */
function Silian_getMeaningfulChildren(
  Silian_children?: MarkdownAstNode[]
): MarkdownAstNode[] {
  if (!Silian_children) return []
  return Silian_children.filter(
    (Silian_child) => !(Silian_child.type === "text" && Silian_child.value?.trim() === "")
  )
}

/**
 * Check if a node is an image or iframe element.
 */
function Silian_isImageOrIframeElement(Silian_node: MarkdownAstNode): boolean {
  return (
    Silian_node.type === "element" &&
    (Silian_node.tagName === "img" ||
      Silian_node.tagName === "iframe" ||
      Silian_node.tagName === "litematicaviewer")
  )
}

function Silian_containsImageOrIframeDescendant(Silian_node: MarkdownAstNode): boolean {
  if (Silian_isImageOrIframeElement(Silian_node)) return true

  for (const Silian_child of Silian_getMeaningfulChildren(Silian_node.children ?? [])) {
    if (Silian_containsImageOrIframeDescendant(Silian_child)) return true
  }

  return false
}

/**
 * Check if a node is a single "image/iframe unit":
 * - Direct <img> or <iframe> element
 * - <a> containing exactly one image/iframe element
 * - Formatting wrapper (strong/em/del) containing exactly one image/iframe element
 */
function Silian_isImageOrIframeUnit(Silian_node: MarkdownAstNode): boolean {
  if (Silian_node.type !== "element") return false

  // Direct image or iframe
  if (Silian_node.tagName === "img" || Silian_node.tagName === "iframe") return true

  // Allowable wrapper tags that can contain media-only content
  const Silian_allowedWrappers = ["a", "strong", "em", "del"]
  if (Silian_allowedWrappers.includes(Silian_node.tagName ?? "")) {
    const Silian_meaningful = Silian_getMeaningfulChildren(Silian_node.children ?? [])
    return Silian_meaningful.length === 1 && Silian_isImageOrIframeElement(Silian_meaningful[0])
  }

  return false
}

/**
 * Check if a paragraph contains only image/iframe content.
 * This prevents invalid HTML nesting like <p><div>...</div></p>
 * when LazyImage or Iframe mapping (which returns a div) is used inside a paragraph.
 */
function Silian_isMediaOnlyParagraph(Silian_node: unknown) {
  const Silian_paragraphNode = Silian_node as MarkdownAstNode | undefined
  if (Silian_paragraphNode?.tagName !== "p" || !Silian_paragraphNode.children) return false

  const Silian_meaningfulChildren = Silian_getMeaningfulChildren(Silian_paragraphNode.children)

  return (
    Silian_meaningfulChildren.length === 1 &&
    Silian_meaningfulChildren[0]?.type === "element" &&
    Silian_isImageOrIframeUnit(Silian_meaningfulChildren[0])
  )
}

function Silian_paragraphContainsMedia(Silian_node: unknown): boolean {
  const Silian_paragraphNode = Silian_node as MarkdownAstNode | undefined
  if (Silian_paragraphNode?.tagName !== "p" || !Silian_paragraphNode.children) return false

  return Silian_getMeaningfulChildren(Silian_paragraphNode.children).some((Silian_child) =>
    Silian_containsImageOrIframeDescendant(Silian_child)
  )
}

import Silian_LitematicaViewer from "@/components/articles/litematica-viewer"

const Silian_CALLOUT_STYLES: Record<
  string,
  { border: string; bg: string; title: string; text: string }
> = {
  warning: {
    border: "border-amber-500",
    bg: "bg-amber-50",
    title: "text-amber-700",
    text: "text-amber-900",
  },
  tip: {
    border: "border-emerald-500",
    bg: "bg-emerald-50",
    title: "text-emerald-700",
    text: "text-emerald-900",
  },
  important: {
    border: "border-blue-500",
    bg: "bg-blue-50",
    title: "text-blue-700",
    text: "text-blue-900",
  },
  crash: {
    border: "border-red-500",
    bg: "bg-red-50",
    title: "text-red-700",
    text: "text-red-900",
  },
  corruption: {
    border: "border-orange-500",
    bg: "bg-orange-50",
    title: "text-orange-700",
    text: "text-orange-900",
  },
}

const Silian_CALLOUT_TYPES_WITH_DEFAULT = ["crash", "corruption"] as const

function Silian_CalloutAside({
  "data-callout": Silian_dataCallout,
  "data-callout-empty": Silian_dataCalloutEmpty,
  children: Silian_children,
  ...Silian_rest
}: MarkdownComponentProps) {
  const Silian_t = Silian_useTranslations("callouts")

  if (!Silian_dataCallout) {
    return <aside {...Silian_rest}>{Silian_children}</aside>
  }

  const Silian_type = String(Silian_dataCallout)
  const Silian_styles = Silian_CALLOUT_STYLES[Silian_type] ?? Silian_CALLOUT_STYLES.important
  const Silian_labelKey = `${Silian_type}_label` as Parameters<typeof Silian_t>[0]
  const Silian_isEmpty = Silian_dataCalloutEmpty === "true"
  const Silian_hasDefault = (Silian_CALLOUT_TYPES_WITH_DEFAULT as readonly string[]).includes(
    Silian_type
  )

  return (
    <aside
      className={`mb-4 border-l-2 px-6 py-4 ${Silian_styles.border} ${Silian_styles.bg}`}
      {...Silian_rest}>
      <div
        className={`mb-1.5 font-mono text-xs font-bold tracking-widest uppercase ${Silian_styles.title}`}>
        {Silian_t(Silian_labelKey)}
      </div>
      <div
        className={`font-sans text-sm [&_p]:mb-0 [&_p]:text-sm [&_p]:text-inherit ${Silian_styles.text}`}>
        {Silian_isEmpty && Silian_hasDefault
          ? Silian_t(`${Silian_type}_default` as Parameters<typeof Silian_t>[0])
          : Silian_children}
      </div>
    </aside>
  )
}

export function getMarkdownComponents(Silian_rawPath: string) {
  const Silian_aComponent = Silian_createAComponent(Silian_rawPath)
  const Silian_imageComponent = Silian_createImageComponent(Silian_rawPath)
  const Silian_ansiColorStyles: Record<AnsiColorName, Record<string, string>> = {
    black: { color: "#334155" },
    red: { color: "#b91c1c" },
    green: { color: "#047857" },
    yellow: { color: "#a16207" },
    blue: { color: "#2563eb" },
    magenta: { color: "#a21caf" },
    cyan: { color: "#0f766e" },
    white: { color: "#64748b" },
    "bright-black": { color: "#0f172a" },
    "bright-red": { color: "#dc2626" },
    "bright-green": { color: "#059669" },
    "bright-yellow": { color: "#ca8a04" },
    "bright-blue": { color: "#1d4ed8" },
    "bright-magenta": { color: "#c026d3" },
    "bright-cyan": { color: "#0891b2" },
    "bright-white": { color: "#475569" },
  }

  const Silian_advancedBadge = (
    <span
      aria-hidden="true"
      className="
        mx-2 inline-block shrink-0 bg-[#4c5b96] px-1.5 py-0.5 align-middle
        font-mono text-[0.625rem] font-bold tracking-widest text-white select-none
      ">
      ADVANCED
    </span>
  )

  const Silian_makeSpan = (Silian_style: Record<string, string>) => {
    function Silian_SpanComponent({ node: Silian__node, ...Silian_props }: MarkdownComponentProps) {
      return <span style={Silian_style} {...Silian_props} />
    }
    Silian_SpanComponent.displayName = "makeSpan"
    return Silian_SpanComponent
  }

  function Silian_hiddenComponent({
    className: Silian_className,
    children: Silian_children,
    node: Silian__node,
    ...Silian_props
  }: MarkdownComponentProps) {
    return (
      <span
        className={[
          "inline-block rounded-xs border guide-line bg-tech-main/8 px-1.5 py-px text-tech-main/80 transition-[filter,text-shadow,color,background-color,border-color] duration-200 filter-[blur(0.18rem)] [text-shadow:0_0_0.35rem_rgba(96,112,143,0.45)] hover:border-tech-main/35 hover:bg-white/85 hover:text-slate-800 hover:filter-none hover:text-shadow-none",
          Silian_className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...Silian_props}>
        {Silian_children}
      </span>
    )
  }

  function Silian_codeComponent({
    className: Silian_className,
    children: Silian_children,
    node: Silian_node,
    ...Silian_props
  }: MarkdownComponentProps) {
    if (Silian_props["data-linked-code"] === "true") {
      const { "data-linked-code": Silian__linkedCode, ...Silian_rest } = Silian_props
      return (
        <code
          className="
            mx-1 border border-b-2 border-tech-main/30 bg-tech-main/10 px-1
            py-[0.05rem] font-mono text-[0.8em] text-tech-main not-italic
            transition-colors
            group-hover/lc:border-tech-main group-hover/lc:bg-tech-main/80
            group-hover/lc:text-white
          "
          {...Silian_rest}>
          {Silian_children}
        </code>
      )
    }
    if (Silian_props["data-has-link"] === "true") {
      const { "data-has-link": Silian__hasLink, ...Silian_rest } = Silian_props
      return (
        <code className="font-mono text-[0.8em] not-italic" {...Silian_rest}>
          {Silian_children}
        </code>
      )
    }
    if ((Silian_className as string)?.startsWith("language-"))
      return (
        <code className={Silian_className as string} {...Silian_props}>
          {Silian_children}
        </code>
      )
    return (
      <code
        className="
          mx-1 border border-tech-main/30 bg-tech-main/10 px-1 py-[0.05rem]
          font-mono text-[0.8em] text-tech-main not-italic
        "
        {...Silian_props}>
        {Silian_children}
      </code>
    )
  }

  function Silian_preComponent({ children: Silian_children, ...Silian_props }: MarkdownComponentProps) {
    return <Silian_CodeBlockPre {...Silian_props}>{Silian_children}</Silian_CodeBlockPre>
  }

  const Silian_ansiColorComponents = Object.fromEntries(
    Silian_ANSI_COLOR_NAMES.map((Silian_color) => [
      Silian_createAnsiColorTagName(Silian_color),
      Silian_makeSpan(Silian_ansiColorStyles[Silian_color]),
    ])
  ) as Record<string, MarkdownComponent>

  return {
    ...Silian_ansiColorComponents,
    wtucolor: Silian_makeSpan({ color: "red" }),
    ttcolor: Silian_makeSpan({ color: "#ff7300" }),
    ctcolor: Silian_makeSpan({ color: "#ffae00" }),
    becolor: Silian_makeSpan({ color: "green" }),
    eucolor: Silian_makeSpan({ color: "blue" }),
    tecolor: Silian_makeSpan({ color: "blueviolet" }),
    atcolor: Silian_makeSpan({ color: "purple" }),
    nc: ({ node: Silian__node, ...Silian_props }: MarkdownComponentProps) => (
      <span {...Silian_props} />
    ),
    pp: ({ node: Silian__node, ...Silian_props }: MarkdownComponentProps) => (
      <span {...Silian_props} />
    ),
    hidden: Silian_hiddenComponent,
    litematicaviewer: ({ url: Silian_url, ...Silian_rest }: MarkdownComponentProps) => (
      <Silian_LitematicaViewer url={Silian_url as string} {...Silian_rest} />
    ),
    table: ({ ...Silian_props }: MarkdownComponentProps) => (
      <div
        className="
          my-6 custom-bottom-scrollbar w-full overflow-x-auto border
          border-tech-main/30 bg-tech-bg/50 backdrop-blur-sm
        ">
        <table
          className="
            w-full min-w-150 border-collapse text-left font-mono text-sm
          "
          {...Silian_props}
        />
      </div>
    ),
    thead: ({ ...Silian_props }: MarkdownComponentProps) => (
      <thead
        className="border-b border-tech-main/30 bg-tech-main/10"
        {...Silian_props}
      />
    ),
    th: ({ ...Silian_props }: MarkdownComponentProps) => (
      <th
        className="
          border-r border-tech-main/10 p-3 font-semibold whitespace-nowrap
          text-tech-main
          last:border-r-0
        "
        {...Silian_props}
      />
    ),
    td: ({ ...Silian_props }: MarkdownComponentProps) => (
      <td
        className="
          border-t border-r border-tech-main/10 p-3 text-slate-700
          last:border-r-0
        "
        {...Silian_props}
      />
    ),
    h1: ({
      id: Silian_id,
      children: Silian_children,
      "data-advanced": Silian_dataAdvanced,
    }: MarkdownComponentProps) => (
      <h1
        id={Silian_id}
        className="
          group relative mt-8 mb-6 scroll-m-20 border-b border-tech-main/30 pb-4
          font-mono text-2xl tracking-widest text-slate-900 uppercase
          target:animate-target-blink target:border-tech-main
          sm:text-3xl
          lg:text-4xl
        ">
        {Silian_id && <Silian_HeadingAnchor id={Silian_id} level={1} />}
        {Silian_children}
        {Silian_dataAdvanced === "true" && Silian_advancedBadge}
      </h1>
    ),
    h2: ({
      id: Silian_id,
      children: Silian_children,
      "data-advanced": Silian_dataAdvanced,
    }: MarkdownComponentProps) => (
      <h2
        id={Silian_id}
        className="
          group relative mt-12 mb-6 inline-block scroll-m-20 border-b
          border-tech-main/30 pr-8 font-mono text-2xl tracking-widest
          text-slate-800 uppercase
          target:animate-target-blink target:border-tech-main
        ">
        {Silian_id && <Silian_HeadingAnchor id={Silian_id} level={2} />}
        {Silian_children}
        {Silian_dataAdvanced === "true" && Silian_advancedBadge}
      </h2>
    ),
    h3: ({
      id: Silian_id,
      children: Silian_children,
      "data-advanced": Silian_dataAdvanced,
    }: MarkdownComponentProps) => (
      <h3
        id={Silian_id}
        className="
          group relative mt-8 mb-4 scroll-m-20 font-mono text-xl tracking-widest
          text-slate-700 uppercase
          target:animate-target-blink
        ">
        {Silian_id && <Silian_HeadingAnchor id={Silian_id} level={3} />}
        {Silian_children}
        {Silian_dataAdvanced === "true" && Silian_advancedBadge}
      </h3>
    ),
    p: ({ node: Silian_node, children: Silian_children, ...Silian_props }: MarkdownComponentProps) => {
      if (Silian_isMediaOnlyParagraph(Silian_node)) return <>{Silian_children}</>

      if (Silian_paragraphContainsMedia(Silian_node)) {
        return (
          <div className="mb-4 font-sans text-base/relaxed text-slate-800">
            {Silian_children}
          </div>
        )
      }

      return (
        <p
          className="mb-4 font-sans text-base/relaxed text-slate-800"
          {...Silian_props}>
          {Silian_children}
        </p>
      )
    },
    a: Silian_aComponent,
    ul: ({ ...Silian_props }: MarkdownComponentProps) => (
      <ul
        className="
          mb-6 list-disc space-y-2 border-l border-tech-main/30 pl-8 font-sans text-slate-800
        "
        {...Silian_props}
      />
    ),
    ol: ({ ...Silian_props }: MarkdownComponentProps) => (
      <ol
        className="
          mb-6 list-decimal space-y-2 pl-8 font-sans text-slate-800
        "
        {...Silian_props}
      />
    ),
    li: ({ ...Silian_props }: MarkdownComponentProps) => (
      <li className="relative text-slate-800" {...Silian_props} />
    ),
    blockquote: ({ ...Silian_props }: MarkdownComponentProps) => (
      <blockquote
        className="
          mb-6 border-l-2 border-tech-main bg-tech-main/5 p-4 pb-[0.01]
          font-sans text-slate-700 italic
        "
        {...Silian_props}
      />
    ),
    aside: (Silian_props: MarkdownComponentProps) => <Silian_CalloutAside {...Silian_props} />,
    img: Silian_imageComponent,
    hr: ({ ...Silian_props }: MarkdownComponentProps) => (
      <hr
        className="mx-auto my-8 w-4/5 border-t border-tech-main/30"
        {...Silian_props}
      />
    ),
    sup: ({ ...Silian_props }: MarkdownComponentProps) => (
      <sup
        className="
          mx-0.5 cursor-pointer font-mono not-italic
          before:text-tech-main/60 before:content-['{']
          after:text-tech-main/60 after:content-['}']
        "
        {...Silian_props}
      />
    ),
    section: ({ id: Silian_id, children: Silian_children, ...Silian_props }: MarkdownComponentProps) => {
      // Wrap footnote sections in <aside> for semantic HTML
      if (Silian_id === "footnotes") {
        return (
          <aside
            className="
              mt-12 border-t border-tech-main/30 pt-6 font-sans text-sm
              text-slate-700
            "
            {...Silian_props}>
            <section id={Silian_id} {...Silian_props}>
              {Silian_children}
            </section>
          </aside>
        )
      }

      // Regular sections render normally
      return (
        <section id={Silian_id} {...Silian_props}>
          {Silian_children}
        </section>
      )
    },
    div: ({
      children: Silian_children,
      "data-advanced-section": Silian_dataAdvancedSection,
      ...Silian_rest
    }: MarkdownComponentProps) => {
      if (Silian_dataAdvancedSection === "true") {
        return (
          <div className="group relative my-8" {...Silian_rest}>
            <div
              className="
                absolute top-0 left-[calc(100%+1.5rem)] z-10 flex h-full
                w-3.5 -translate-x-1/2 items-start justify-center rounded-sm
                bg-[#8b9ac8] pt-6
                sm:left-[calc(100%+2rem)]
              ">
              <span
                className="
                  font-mono text-[0.625rem] leading-none font-bold tracking-[0.3em]
                  text-white select-none [writing-mode:vertical-rl]
                ">
                ADVANCED
              </span>
            </div>
            <div className="relative z-0 w-full">{Silian_children}</div>
          </div>
        )
      }
      return <div {...Silian_rest}>{Silian_children}</div>
    },
    pre: Silian_preComponent,
    code: Silian_codeComponent,
    iframe: ({
      src: Silian_src,
      className: Silian_className,
      title: Silian_title,
      allowFullScreen: Silian_allowFullScreen,
      ...Silian_props
    }: MarkdownComponentProps) => {
      // Remove deprecated or non-standard DOM attributes
      const {
        frameborder: Silian_frameborder,
        frameBorder: Silian_frameBorder,
        scrolling: Silian_scrolling,
        framespacing: Silian_framespacing,
        marginheight: Silian_marginheight,
        marginwidth: Silian_marginwidth,
        allowfullscreen: Silian_allowfullscreen,

        node: Silian_node,
        ...Silian_rest
      } = Silian_props as Record<string, unknown>

      return (
        <div
          className="
            my-6 aspect-video w-full overflow-hidden rounded-xs border
            guide-line bg-tech-main/5
          ">
          <iframe
            src={Silian_src as string}
            title={(Silian_title as string) || "Embedded Video"}
            className="size-full"
            loading="lazy"
            allowFullScreen={Silian_allowFullScreen !== false}
            {...Silian_rest}
          />
        </div>
      )
    },
  } as Record<string, MarkdownComponent>
}
