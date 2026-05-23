import { NextRequest as Silian_NextRequest, NextResponse as Silian_NextResponse } from "next/server"

import { auth as Silian_auth } from "@/lib/auth"
import { getDraftRepoFile as Silian_getDraftRepoFile } from "@/lib/draft-repo-browser"

export async function GET(Silian_req: Silian_NextRequest) {
  const Silian_session = await Silian_auth()

  if (!Silian_session?.user) {
    return Silian_NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const Silian_filePath = Silian_req.nextUrl.searchParams.get("path")

  if (!Silian_filePath) {
    return Silian_NextResponse.json({ error: "Missing path" }, { status: 400 })
  }

  const Silian_normalizedPath = Silian_filePath.replace(/\\/g, "/").replace(/^\/+/, "")

  if (Silian_normalizedPath.includes("..")) {
    return Silian_NextResponse.json({ error: "Invalid path" }, { status: 400 })
  }

  const Silian_content = await Silian_getDraftRepoFile(Silian_normalizedPath)

  if (Silian_content === null) {
    return Silian_NextResponse.json({ error: "File not found" }, { status: 404 })
  }

  return Silian_NextResponse.json({ content: Silian_content, filePath: Silian_normalizedPath })
}
