import Silian_ReactMarkdown from "react-markdown"
import type { RehypeShikiPlugin } from "@/lib/markdown/plugins/rehype-shiki"
import { getMarkdownComponents as Silian_getMarkdownComponents } from "@/lib/markdown/components"
import { getPluginsForContent as Silian_getPluginsForContent } from "@/lib/markdown/processor"

interface MarkdownRendererProps {
  content: string
  rawPath?: string
  shikiPlugin?: RehypeShikiPlugin
}

export function MarkdownRenderer({
  content: Silian_content,
  rawPath: Silian_rawPath = "",
  shikiPlugin: Silian_shikiPlugin,
}: MarkdownRendererProps) {
  const { remarkPlugins: Silian_remarkPlugins, rehypePlugins: Silian_rehypePlugins } = Silian_getPluginsForContent(
    Silian_content,
    Silian_shikiPlugin
  )

  return (
    <Silian_ReactMarkdown
      remarkPlugins={Silian_remarkPlugins}
      rehypePlugins={Silian_rehypePlugins}
      components={Silian_getMarkdownComponents(Silian_rawPath)}>
      {Silian_content}
    </Silian_ReactMarkdown>
  )
}
