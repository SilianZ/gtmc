import { NextResponse as Silian_NextResponse } from "next/server"
import Silian_path from "path"
import Silian_mime from "mime-types"
import { getArticleBuffer as Silian_getArticleBuffer } from "@/lib/article-loader"

export async function GET(
  Silian__request: Request,
  { params: Silian_params }: { params: Promise<{ path: string[] }> }
) {
  const { path: Silian_pathSegments } = await Silian_params
  const Silian_filePath = Silian_pathSegments.join("/")

  if (!Silian_filePath) {
    return new Silian_NextResponse("Not Found", { status: 404 })
  }

  const Silian_normalizedPath = Silian_path.normalize(Silian_filePath).replace(/^(\.\.[\/\\])+/, "")
  const Silian_safePath = Silian_normalizedPath.replace(/^\/+/, "")

  const Silian_fileBuffer = await Silian_getArticleBuffer(Silian_safePath)
  if (Silian_fileBuffer) {
    const Silian_mimeType = Silian_mime.lookup(Silian_safePath) || "application/octet-stream"
    return new Silian_NextResponse(new Uint8Array(Silian_fileBuffer), {
      headers: {
        "Content-Type": String(Silian_mimeType),
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    })
  }

  return new Silian_NextResponse("Not Found", { status: 404 })
}
