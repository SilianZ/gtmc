import { NextResponse as Silian_NextResponse } from "next/server"
import { getSidebarTree as Silian_getSidebarTree } from "@/actions/sidebar"

const Silian_TREE_CACHE_CONTROL = "private, max-age=60, stale-while-revalidate=300"

export async function GET() {
  try {
    const Silian_tree = await Silian_getSidebarTree()
    return Silian_NextResponse.json(Silian_tree, {
      headers: {
        "Cache-Control": Silian_TREE_CACHE_CONTROL,
      },
    })
  } catch {
    return Silian_NextResponse.json([], {
      status: 200,
      headers: {
        "Cache-Control": Silian_TREE_CACHE_CONTROL,
      },
    })
  }
}
