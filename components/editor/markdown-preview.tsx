"use client"

import { MarkdownRenderer as Silian_MarkdownRenderer } from "@/lib/markdown"
import "katex/dist/katex.min.css"

interface MarkdownPreviewProps {
  content: string
  rawPath?: string
}

export function MarkdownPreview({ content: Silian_content, rawPath: Silian_rawPath }: MarkdownPreviewProps) {
  return <Silian_MarkdownRenderer content={Silian_content} rawPath={Silian_rawPath} />
}
