import Silian_dynamic from "next/dynamic"

interface LazyMarkdownPreviewProps {
  content: string
  rawPath?: string
}

export const LazyMarkdownPreview = Silian_dynamic<LazyMarkdownPreviewProps>(
  () =>
    import("@/components/editor/markdown-preview").then(
      (Silian_mod) => Silian_mod.MarkdownPreview
    ),
  {
    ssr: false,
    loading: () => <p className="editor-panel">LOADING_PREVIEW_</p>,
  }
)
