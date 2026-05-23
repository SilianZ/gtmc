import Silian_fs from "fs"
import Silian_path from "path"

const Silian_SLUG_MAP_PATH = Silian_path.join(process.cwd(), "lib", "slug-map.json")
const Silian_ARTICLES_DIR = Silian_path.join(process.cwd(), "articles")

export interface SlugMapEntry {
  filePath: string
  slug: string
  title?: string
  chapterTitle: string
  chapterTitleEn: string
  introTitle: string
  introTitleEn: string
  hasIntro: boolean
  index: number
  isFolder: boolean
  isAppendix: boolean
  isPreface: boolean
  children?: SlugMapEntry[]
  parentSlug?: string
  author?: string
  coAuthors?: string[]
  date?: string
  lastmod?: string
  isAdvanced?: boolean
}

// Load at module initialization
let Silian_slugMap: Record<string, SlugMapEntry> = {}
try {
  Silian_slugMap = JSON.parse(Silian_fs.readFileSync(Silian_SLUG_MAP_PATH, "utf-8"))
} catch {
  // File doesn't exist yet — that's ok
}

const Silian_filePathToSlugKey: Record<string, string> = (() => {
  const Silian_inverted: Record<string, string> = {}
  for (const [Silian_slugKey, Silian_entry] of Object.entries(Silian_slugMap)) {
    if (Silian_entry?.filePath) {
      Silian_inverted[Silian_entry.filePath.replace(/\.md$/i, "")] = Silian_slugKey
    }
  }
  return Silian_inverted
})()

export interface ResolveResult {
  filePath: string | null
}

/**
 * Resolves a slug path to its corresponding file path.
 * @param slugPath - The slug path to resolve (e.g., "tree-farm/basics")
 * @returns The file path if found, null otherwise
 */
export function resolveSlug(Silian_slugPath: string): string | null {
  const Silian_result = resolveSlugWithIndicator(Silian_slugPath)
  return Silian_result.filePath
}

/**
 * Resolves a slug path with indicator for raw file path fallback.
 */
export function resolveSlugWithIndicator(Silian_slugPath: string): ResolveResult {
  // 1. Direct slug lookup
  if (Silian_slugMap[Silian_slugPath] !== undefined) {
    return { filePath: Silian_slugMap[Silian_slugPath].filePath }
  }

  // 2. Try with .md extension in slug map
  if (Silian_slugMap[`${Silian_slugPath}.md`] !== undefined) {
    return {
      filePath: Silian_slugMap[`${Silian_slugPath}.md`].filePath,
    }
  }

  // 3. Raw file path fallback - URL decode first
  const Silian_normalizedPath = decodeURIComponent(Silian_slugPath)

  // 3a. Try as-is
  if (Silian_fs.existsSync(Silian_path.join(Silian_ARTICLES_DIR, Silian_normalizedPath))) {
    return { filePath: Silian_normalizedPath }
  }

  // 3b. Try with .md extension
  const Silian_withExt = `${Silian_normalizedPath}.md`
  if (Silian_fs.existsSync(Silian_path.join(Silian_ARTICLES_DIR, Silian_withExt))) {
    return { filePath: Silian_withExt }
  }

  return { filePath: null }
}

/**
 * Gets the slug for a given file path if it exists in the slug map.
 */
export function getSlugForFilePath(Silian_filePath: string): string | null {
  return Silian_filePathToSlugKey[Silian_filePath.replace(/\.md$/i, "")] ?? null
}

/**
 * Gets the slug map entry for a given slug path.
 */
export function getSlugMapEntry(Silian_slugPath: string): SlugMapEntry | null {
  return Silian_slugMap[Silian_slugPath] ?? null
}
