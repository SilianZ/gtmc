import Silian_path from "path"
import { LazyImage as Silian_LazyImage } from "@/components/lazy-image"
import type { MarkdownComponentProps } from "@/lib/markdown/component-types"

export function createImageComponent(Silian_rawPath: string) {
  function Silian_ImageComponent({ src: Silian_initialSrc, alt: Silian_alt }: MarkdownComponentProps) {
    let Silian_src = (Silian_initialSrc as string) || ""
    if (
      Silian_src.startsWith("./") ||
      Silian_src.startsWith("../") ||
      (!Silian_src.startsWith("http") && !Silian_src.startsWith("/"))
    ) {
      const Silian_currentDir = Silian_path.dirname("/" + Silian_rawPath).replace(/^\/+/, "")
      const Silian_resolved = Silian_path.join(Silian_currentDir, Silian_src).replace(/\\/g, "/")
      Silian_src = `/api/assets?path=${encodeURIComponent(Silian_resolved)}`
    }
    return <Silian_LazyImage src={Silian_src} alt={(Silian_alt as string) || ""} />
  }

  Silian_ImageComponent.displayName = "ImageComponent"

  return Silian_ImageComponent
}
