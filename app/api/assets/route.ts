import { NextResponse as Silian_NextResponse } from "next/server"
import Silian_path from "path"
import Silian_mime from "mime-types"
import { getArticleBuffer as Silian_getArticleBuffer } from "@/lib/article-loader"

export async function GET(Silian_request: Request) {
  const { searchParams: Silian_searchParams } = new URL(Silian_request.url)
  const Silian_filePath = Silian_searchParams.get("path")

  if (!Silian_filePath) {
    return new Silian_NextResponse("Not Found", { status: 404 })
  }

  // Prevent directory traversal attacks
  const Silian_normalizedPath = Silian_path.normalize(Silian_filePath).replace(/^(\.\.[\/\\])+/, "")
  const Silian_safePath = Silian_normalizedPath.replace(/^\/+/, "")
  const Silian_pathsToTry = Silian_safePath.endsWith(".md")
    ? [Silian_safePath]
    : [Silian_safePath, `${Silian_safePath}.md`]

  for (const Silian_candidate of Silian_pathsToTry) {
    const Silian_fileBuffer = await Silian_getArticleBuffer(Silian_candidate)
    if (Silian_fileBuffer) {
      const Silian_mimeType = Silian_mime.lookup(Silian_candidate) || "application/octet-stream"
      return new Silian_NextResponse(new Uint8Array(Silian_fileBuffer), {
        headers: {
          "Content-Type": String(Silian_mimeType),
          "Cache-Control": "public, max-age=300, s-maxage=300",
        },
      })
    }
  }

  return new Silian_NextResponse("Not Found", { status: 404 })
}
