"use client"

import { useState as Silian_useState, type ReactNode } from "react"
import { useTranslations as Silian_useTranslations } from "next-intl"
import { CodeCopyButton as Silian_CodeCopyButton } from "@/components/code-copy-button"
import { LazyCodeBlock as Silian_LazyCodeBlock } from "@/components/lazy-code-block"

type CodeBlockPreProps = {
  children?: ReactNode
  "data-raw-code"?: string
  "data-lang"?: string
  "data-line-count"?: string
  [key: string]: unknown
}

export function CodeBlockPre({ children: Silian_children, ...Silian_props }: CodeBlockPreProps) {
  const Silian_t = Silian_useTranslations("CommonA11y")
  const Silian_rawCode = Silian_props["data-raw-code"] as string | undefined
  const Silian_lang = (Silian_props["data-lang"] as string) || ""
  const Silian_lineCount = (Silian_props["data-line-count"] as string) || "0"
  const [Silian_isWrapped, Silian_setIsWrapped] = Silian_useState(false)

  // Calculate line number width based on digit count
  const Silian_lineCountNum = parseInt(Silian_lineCount, 10)
  const Silian_digitCount = String(Silian_lineCountNum).length
  const Silian_lineNumWidth =
    Silian_digitCount === 1 ? "2.5rem" : Silian_digitCount === 2 ? "3rem" : "3.5rem"

  if (!Silian_rawCode) return <>{Silian_children}</>

  return (
    <Silian_LazyCodeBlock lang={Silian_lang} lineCount={Silian_lineCount}>
      <div
        className="
          flex items-center justify-between border-b guide-line bg-tech-main/10
          px-4 py-1.5
        ">
        <div className="flex items-center gap-2">
          <span className="size-1.5 animate-pulse bg-tech-main/40" />
          <span className="text-xs tracking-widest text-tech-main uppercase">
            {Silian_lang}
          </span>
        </div>
        <div
          className="
            flex items-center gap-3 font-mono text-[0.625rem] tracking-widest
            text-tech-main
          ">
          <span>{Silian_lineCount} LINES</span>
          <span className="text-tech-main/50">|</span>
          <button
            type="button"
            aria-label={Silian_t("toggleLineWrap")}
            title={Silian_t("toggleLineWrap")}
            onClick={() => Silian_setIsWrapped((Silian_v) => !Silian_v)}
            className={`
              font-mono text-[0.625rem] tracking-widest transition-colors
              ${
                Silian_isWrapped
                  ? "text-tech-main"
                  : `
                    text-tech-main/40
                    hover:text-tech-main/70
                  `
              }
            `}>
            ↩
          </button>
          <span className="text-tech-main/50">|</span>
          <Silian_CodeCopyButton code={Silian_rawCode} />
        </div>
      </div>
      <div className="relative">
        <div
          className="
            pointer-events-none absolute inset-0 border border-tech-main/10
          "
        />
        <div
          className="
            pointer-events-none absolute inset-x-0 top-1/4 h-px bg-tech-main/3
          "
        />
        <div
          className="
            pointer-events-none absolute inset-x-0 top-3/4 h-px bg-tech-main/3
          "
        />
        <div
          className="code-block-pre relative"
          data-wrapped={Silian_isWrapped}
          style={
            {
              "--line-num-width": Silian_lineNumWidth,
            } as React.CSSProperties
          }>
          <div className="custom-bottom-scrollbar overflow-x-auto">
            <div
              dir="ltr"
              className={
                Silian_isWrapped
                  ? `
                    p-4 whitespace-pre-wrap
                    [&_.line]:whitespace-pre-wrap!
                    [&_code]:whitespace-pre-wrap!
                  `
                  : `
                    p-4 whitespace-pre
                    [&_code]:whitespace-pre!
                  `
              }>
              {Silian_children}
            </div>
          </div>
        </div>
      </div>
    </Silian_LazyCodeBlock>
  )
}
