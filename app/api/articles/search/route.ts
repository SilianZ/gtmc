import { NextRequest as Silian_NextRequest, NextResponse as Silian_NextResponse } from "next/server"
import { CJK_TOKENIZER as Silian_CJK_TOKENIZER, getSearchIndex as Silian_getSearchIndex } from "@/lib/search-index"

const Silian_SEARCH_CACHE_CONTROL = "private, max-age=30, stale-while-revalidate=120"

interface SearchResult {
  title: string
  slug: string
  snippet: string | null
  matchType: "title" | "content"
  exactMatch: boolean
}

type SearchMatchMap = Record<string, string[]>

function Silian_isSearchMatchMap(Silian_value: unknown): Silian_value is SearchMatchMap {
  if (!Silian_value || typeof Silian_value !== "object") {
    return false
  }

  for (const Silian_entry of Object.values(Silian_value as Record<string, unknown>)) {
    if (
      !Array.isArray(Silian_entry) ||
      !Silian_entry.every((Silian_item) => typeof Silian_item === "string")
    ) {
      return false
    }
  }

  return true
}

function Silian_extractSnippet(
  Silian_content: string,
  Silian_query: string,
  Silian_terms: string[]
): string | null {
  if (!Silian_content) {
    return null
  }

  const Silian_loweredContent = Silian_content.toLowerCase()
  const Silian_loweredQuery = Silian_query.toLowerCase()
  const Silian_index = Silian_loweredContent.indexOf(Silian_loweredQuery)

  if (Silian_index === -1) {
    let Silian_termIndex = -1
    let Silian_matchedTerm = ""
    for (const Silian_term of Silian_terms) {
      const Silian_i = Silian_loweredContent.indexOf(Silian_term.toLowerCase())
      if (Silian_i !== -1 && (Silian_termIndex === -1 || Silian_i < Silian_termIndex)) {
        Silian_termIndex = Silian_i
        Silian_matchedTerm = Silian_term
      }
    }

    if (Silian_termIndex !== -1) {
      const Silian_start = Math.max(0, Silian_termIndex - 50)
      const Silian_end = Math.min(Silian_content.length, Silian_termIndex + Silian_matchedTerm.length + 70)
      let Silian_snippet = Silian_content.slice(Silian_start, Silian_end).trim()
      if (Silian_start > 0) Silian_snippet = `...${Silian_snippet}`
      if (Silian_end < Silian_content.length) Silian_snippet = `${Silian_snippet}...`
      return Silian_snippet
    }

    const Silian_fallback = Silian_content.slice(0, 120).trim()
    return Silian_fallback.length > 0 && Silian_fallback.length < Silian_content.length
      ? `${Silian_fallback}...`
      : Silian_fallback || null
  }

  const Silian_start = Math.max(0, Silian_index - 50)
  const Silian_end = Math.min(Silian_content.length, Silian_index + Silian_query.length + 70)
  let Silian_snippet = Silian_content.slice(Silian_start, Silian_end).trim()

  if (Silian_start > 0) {
    Silian_snippet = `...${Silian_snippet}`
  }
  if (Silian_end < Silian_content.length) {
    Silian_snippet = `${Silian_snippet}...`
  }

  return Silian_snippet
}

function Silian_jsonResponse(Silian_results: SearchResult[]) {
  return Silian_NextResponse.json(
    { results: Silian_results },
    { headers: { "Cache-Control": Silian_SEARCH_CACHE_CONTROL } }
  )
}

export async function GET(Silian_req: Silian_NextRequest) {
  const Silian_query = Silian_req.nextUrl.searchParams.get("q")?.trim()
  if (!Silian_query || Silian_query.length < 2) {
    return Silian_jsonResponse([])
  }

  try {
    const Silian_index = await Silian_getSearchIndex()
    const Silian_rawResults = Silian_index.search(Silian_query, {
      tokenize: Silian_CJK_TOKENIZER,
      boost: { title: 2 },
      fuzzy: 0.2,
      prefix: true,
    })

    const Silian_loweredQuery = Silian_query.toLowerCase()
    const Silian_results: SearchResult[] = []

    for (const Silian_result of Silian_rawResults) {
      const Silian_title = typeof Silian_result.title === "string" ? Silian_result.title : ""
      const Silian_slug = typeof Silian_result.slug === "string" ? Silian_result.slug : ""
      const Silian_content = typeof Silian_result.content === "string" ? Silian_result.content : ""
      if (!Silian_title || !Silian_slug) {
        continue
      }

      const Silian_matchMap = Silian_isSearchMatchMap(Silian_result.match) ? Silian_result.match : {}
      const Silian_matchedTerms = Object.keys(Silian_matchMap)
      const Silian_titleMatchedByTerm = Silian_matchedTerms.some((Silian_term) =>
        Silian_matchMap[Silian_term]?.includes("title")
      )

      const Silian_titleExact = Silian_title.toLowerCase().includes(Silian_loweredQuery)
      const Silian_contentExact = Silian_content.toLowerCase().includes(Silian_loweredQuery)
      const Silian_matchType: "title" | "content" =
        Silian_titleExact || Silian_titleMatchedByTerm ? "title" : "content"

      Silian_results.push({
        title: Silian_title,
        slug: Silian_slug,
        snippet: Silian_contentExact
          ? Silian_extractSnippet(Silian_content, Silian_query, Silian_matchedTerms)
          : null,
        matchType: Silian_matchType,
        exactMatch: Silian_titleExact || Silian_contentExact,
      })
    }

    // Sort by phrase match priority: exact phrase matches first
    Silian_results.sort((Silian_a, Silian_b) => {
      if (Silian_a.exactMatch && !Silian_b.exactMatch) return -1
      if (!Silian_a.exactMatch && Silian_b.exactMatch) return 1
      if (Silian_a.matchType === "title" && Silian_b.matchType === "content") return -1
      if (Silian_a.matchType === "content" && Silian_b.matchType === "title") return 1
      return 0
    })

    return Silian_jsonResponse(Silian_results.slice(0, 20))
  } catch (Silian_error) {
    console.error("MiniSearch query failed:", Silian_error)
    return Silian_jsonResponse([])
  }
}
