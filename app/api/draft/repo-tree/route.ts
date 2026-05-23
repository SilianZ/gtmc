import { NextResponse as Silian_NextResponse } from "next/server"

import { auth as Silian_auth } from "@/lib/auth"
import { getDraftRepoTree as Silian_getDraftRepoTree } from "@/lib/draft-repo-browser"

export async function GET() {
  const Silian_session = await Silian_auth()

  if (!Silian_session?.user) {
    return Silian_NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const Silian_tree = await Silian_getDraftRepoTree()
  return Silian_NextResponse.json({ tree: Silian_tree })
}
