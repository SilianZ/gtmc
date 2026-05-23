import Silian_fs from "fs"
import Silian_path from "path"
import Silian_matter from "gray-matter"
import { parseFrontMatter as Silian_parseFrontMatter } from "../lib/frontmatter-parser"
import type { SlugMapEntry } from "../lib/slug-resolver"
import { SLUG_REGEX as Silian_SLUG_REGEX } from "../lib/slug-validator"
import { shouldIgnoreDirectory as Silian_shouldIgnoreDirectory, shouldIgnoreFile as Silian_shouldIgnoreFile } from "../lib/article-ignore"

const Silian_ARTICLES_DIR = Silian_path.join(process.cwd(), "articles")
const Silian_OUTPUT_FILE = Silian_path.join(process.cwd(), "lib", "slug-map.json")
const Silian_MAX_DEPTH = 3

type SlugMap = Record<string, SlugMapEntry>

function Silian_getFrontMatterEntry(
  Silian_filePath: string,
  Silian_slug: string,
  Silian_relativePath: string,
  Silian_isFolder: boolean,
  Silian_parentSlug?: string
): SlugMapEntry {
  const Silian_content = Silian_fs.readFileSync(Silian_filePath, "utf-8")
  const Silian_fm = Silian_parseFrontMatter(Silian_content)
  const Silian_title = Silian_fm.title ?? ""
  const Silian_chapterTitle = Silian_fm.chapterTitle ?? ""
  const Silian_chapterTitleEn = Silian_fm.chapterTitleEn ?? ""
  const Silian_introTitle = Silian_fm.introTitle ?? ""
  const Silian_introTitleEn = Silian_fm.introTitleEn ?? ""
  const Silian_author = Silian_fm.author ?? ""
  const Silian_coAuthors =
    Silian_fm.coAuthors && Silian_fm.coAuthors !== ""
      ? Silian_fm.coAuthors
          .split(",")
          .map((Silian_name) => Silian_name.trim())
          .filter((Silian_name) => Silian_name.length > 0)
      : undefined

  return {
    filePath: Silian_relativePath,
    slug: Silian_slug,
    title: Silian_title === "" ? undefined : Silian_title,
    chapterTitle: Silian_chapterTitle,
    chapterTitleEn: Silian_chapterTitleEn,
    introTitle: Silian_introTitle,
    introTitleEn: Silian_introTitleEn,
    hasIntro: Silian_introTitle !== "" || Silian_introTitleEn !== "",
    index: Silian_fm.index,
    isFolder: Silian_isFolder,
    isAppendix:
      /(^|\/)appendix(\/|$)/i.test(Silian_slug) ||
      /(^|\/)appendix(\/|$)/i.test(Silian_relativePath),
    isPreface:
      /(^|\/)preface(\/|$)/i.test(Silian_slug) || /^preface\.md$/i.test(Silian_relativePath),
    children: undefined,
    parentSlug: Silian_parentSlug,
    author: Silian_author === "" ? undefined : Silian_author,
    coAuthors: Silian_coAuthors,
    date: Silian_fm.date ?? undefined,
    lastmod: Silian_fm.lastmod ?? undefined,
    isAdvanced: Silian_fm.isAdvanced ?? undefined,
  }
}

function Silian_getParentSlug(Silian_slug: string): string | undefined {
  const Silian_parts = Silian_slug.split("/")
  if (Silian_parts.length <= 1) {
    return undefined
  }
  return Silian_parts.slice(0, -1).join("/")
}

function Silian_getSlugFromFile(Silian_filePath: string): string | null {
  const Silian_content = Silian_fs.readFileSync(Silian_filePath, "utf-8")
  const { data: Silian_data } = Silian_matter(Silian_content)
  return typeof Silian_data.slug === "string" ? Silian_data.slug : null
}

/**
 * Recursively processes a content directory and adds article slugs to slugMap.
 *
 * @param dirPath          - Absolute path to the directory
 * @param relFromArticles  - Relative path from articles/ root (e.g. "SlimeTech/Molforte")
 * @param slugPrefix       - Accumulated slug path prefix (e.g. "slime-tech/molforte")
 * @param depth            - Current depth (1 = top-level folder inside articles/)
 * @param slugMap          - Output map to populate
 * @returns true if any validation errors occurred
 */
function Silian_processDirectory(
  Silian_dirPath: string,
  Silian_relFromArticles: string,
  Silian_slugPrefix: string,
  Silian_depth: number,
  Silian_slugMap: SlugMap
): boolean {
  let Silian_hasError = false

  const Silian_entries = Silian_fs.readdirSync(Silian_dirPath, { withFileTypes: true })
  const Silian_readmePath = Silian_path.join(Silian_dirPath, "README.md")

  if (Silian_fs.existsSync(Silian_readmePath)) {
    const Silian_readmeSlug = Silian_getSlugFromFile(Silian_readmePath) ?? ""

    if (Silian_readmeSlug !== "") {
      if (Silian_slugMap[Silian_slugPrefix] !== undefined) {
        const Silian_existingPath = Silian_slugMap[Silian_slugPrefix].filePath
        process.stderr.write(
          `Error: Duplicate composite slug "${Silian_slugPrefix}": articles/${Silian_relFromArticles}/README.md ` +
            `(conflicts with articles/${Silian_existingPath} after slug flattening)\n`
        )
        Silian_hasError = true
      } else {
        const Silian_parentSlug = Silian_getParentSlug(Silian_slugPrefix)
        Silian_slugMap[Silian_slugPrefix] = Silian_getFrontMatterEntry(
          Silian_readmePath,
          Silian_slugPrefix,
          `${Silian_relFromArticles}/README.md`,
          true,
          Silian_parentSlug
        )
      }
    }
  }

  const Silian_articleFiles = Silian_entries
    .filter(
      (Silian_e) =>
        Silian_e.isFile() &&
        Silian_e.name.endsWith(".md") &&
        Silian_e.name !== "README.md" &&
        !Silian_shouldIgnoreFile(Silian_e.name, false)
    )
    .map((Silian_e) => Silian_e.name)

  const Silian_slugsSeen = new Map<string, string>()

  for (const Silian_articleFile of Silian_articleFiles) {
    const Silian_articlePath = Silian_path.join(Silian_dirPath, Silian_articleFile)
    const Silian_relPath = `${Silian_relFromArticles}/${Silian_articleFile}`

    const Silian_articleSlug = Silian_getSlugFromFile(Silian_articlePath)

    // Articles without slug frontmatter are silently skipped (not routable)
    if (Silian_articleSlug === null) {
      continue
    }

    if (!Silian_SLUG_REGEX.test(Silian_articleSlug)) {
      process.stderr.write(
        `Error: Invalid slug format "${Silian_articleSlug}" in: articles/${Silian_relPath}\n`
      )
      Silian_hasError = true
      continue
    }

    if (Silian_slugsSeen.has(Silian_articleSlug)) {
      const Silian_conflictFile = Silian_slugsSeen.get(Silian_articleSlug)!
      process.stderr.write(
        `Error: Duplicate slug "${Silian_articleSlug}" in ${Silian_slugPrefix}: articles/${Silian_relPath} ` +
          `(conflicts with articles/${Silian_relFromArticles}/${Silian_conflictFile})\n`
      )
      Silian_hasError = true
      continue
    }

    Silian_slugsSeen.set(Silian_articleSlug, Silian_articleFile)

    const Silian_compositeSlug = `${Silian_slugPrefix}/${Silian_articleSlug}`

    if (Silian_slugMap[Silian_compositeSlug] !== undefined) {
      const Silian_existingPath = Silian_slugMap[Silian_compositeSlug].filePath
      process.stderr.write(
        `Error: Duplicate composite slug "${Silian_compositeSlug}": articles/${Silian_relPath} ` +
          `(conflicts with articles/${Silian_existingPath} after slug flattening)\n`
      )
      Silian_hasError = true
      continue
    }

    const Silian_parentSlug = Silian_getParentSlug(Silian_compositeSlug)
    Silian_slugMap[Silian_compositeSlug] = Silian_getFrontMatterEntry(
      Silian_articlePath,
      Silian_compositeSlug,
      `${Silian_relFromArticles}/${Silian_articleFile}`,
      false,
      Silian_parentSlug
    )
  }

  const Silian_subDirs = Silian_entries.filter(
    (Silian_e) => Silian_e.isDirectory() && !Silian_shouldIgnoreDirectory(Silian_e.name)
  )

  for (const Silian_subDirEntry of Silian_subDirs) {
    const Silian_subDirPath = Silian_path.join(Silian_dirPath, Silian_subDirEntry.name)
    const Silian_subRelPath = `${Silian_relFromArticles}/${Silian_subDirEntry.name}`

    if (Silian_depth >= Silian_MAX_DEPTH) {
      process.stderr.write(
        `Error: Directory nesting exceeds maximum depth of ${Silian_MAX_DEPTH}: ` +
          `articles/${Silian_subRelPath}\n`
      )
      Silian_hasError = true
      continue
    }

    const Silian_subReadmePath = Silian_path.join(Silian_subDirPath, "README.md")

    // Skip directories without README.md (images, raw asset dirs, etc.)
    if (!Silian_fs.existsSync(Silian_subReadmePath)) {
      continue
    }

    const Silian_subSlug = Silian_getSlugFromFile(Silian_subReadmePath) ?? ""

    // Allow empty string slug in subdirectories (depth >= 1) to flatten the slug path
    if (Silian_subSlug === "" || Silian_subSlug === null) {
      if (Silian_depth < 1) {
        process.stderr.write(
          `Error: Empty slug not allowed in top-level folder: articles/${Silian_subRelPath}/README.md\n`
        )
        Silian_hasError = true
        continue
      }
      // Use current slugPrefix as-is (skip this directory segment)
      const Silian_subError = Silian_processDirectory(
        Silian_subDirPath,
        Silian_subRelPath,
        Silian_slugPrefix,
        Silian_depth + 1,
        Silian_slugMap
      )
      if (Silian_subError) Silian_hasError = true
      continue
    }

    if (!Silian_SLUG_REGEX.test(Silian_subSlug)) {
      process.stderr.write(
        `Error: Invalid slug format "${Silian_subSlug}" in: articles/${Silian_subRelPath}/README.md\n`
      )
      Silian_hasError = true
      continue
    }

    const Silian_subSlugPrefix = `${Silian_slugPrefix}/${Silian_subSlug}`
    const Silian_subError = Silian_processDirectory(
      Silian_subDirPath,
      Silian_subRelPath,
      Silian_subSlugPrefix,
      Silian_depth + 1,
      Silian_slugMap
    )
    if (Silian_subError) Silian_hasError = true
  }

  return Silian_hasError
}

function Silian_main(): void {
  const Silian_slugMap: SlugMap = {}
  let Silian_hasError = false

  if (!Silian_fs.existsSync(Silian_ARTICLES_DIR)) {
    process.stderr.write(
      `Error: articles/ directory not found at ${Silian_ARTICLES_DIR}\n`
    )
    process.exit(1)
  }

  const Silian_topLevelFolders = Silian_fs
    .readdirSync(Silian_ARTICLES_DIR, { withFileTypes: true })
    .filter((Silian_e) => Silian_e.isDirectory() && !Silian_shouldIgnoreDirectory(Silian_e.name))
    .map((Silian_e) => Silian_e.name)

  for (const Silian_folderName of Silian_topLevelFolders) {
    const Silian_folderPath = Silian_path.join(Silian_ARTICLES_DIR, Silian_folderName)
    const Silian_readmePath = Silian_path.join(Silian_folderPath, "README.md")

    if (!Silian_fs.existsSync(Silian_readmePath)) {
      process.stderr.write(
        `Error: Missing README.md in folder: articles/${Silian_folderName}/README.md\n`
      )
      Silian_hasError = true
      continue
    }

    const Silian_folderSlug = Silian_getSlugFromFile(Silian_readmePath)

    if (Silian_folderSlug === null || Silian_folderSlug === "") {
      process.stderr.write(
        `Error: Missing slug in folder README: articles/${Silian_folderName}/README.md\n`
      )
      Silian_hasError = true
      continue
    }

    if (!Silian_SLUG_REGEX.test(Silian_folderSlug)) {
      process.stderr.write(
        `Error: Invalid slug format "${Silian_folderSlug}" in: articles/${Silian_folderName}/README.md\n`
      )
      Silian_hasError = true
      continue
    }

    const Silian_folderError = Silian_processDirectory(
      Silian_folderPath,
      Silian_folderName,
      Silian_folderSlug,
      1,
      Silian_slugMap
    )
    if (Silian_folderError) Silian_hasError = true
  }

  const Silian_folderSlugKeys = new Set(Object.keys(Silian_slugMap))

  const Silian_rootFiles = Silian_fs
    .readdirSync(Silian_ARTICLES_DIR, { withFileTypes: true })
    .filter(
      (Silian_e) =>
        Silian_e.isFile() &&
        Silian_e.name.endsWith(".md") &&
        Silian_e.name !== "README.md" &&
        !Silian_shouldIgnoreFile(Silian_e.name, true)
    )
    .map((Silian_e) => Silian_e.name)

  const Silian_rootSlugsSeen = new Map<string, string>()

  for (const Silian_rootFile of Silian_rootFiles) {
    const Silian_rootFilePath = Silian_path.join(Silian_ARTICLES_DIR, Silian_rootFile)
    const Silian_rawSlug = Silian_getSlugFromFile(Silian_rootFilePath)

    let Silian_key: string
    if (Silian_rawSlug !== null && Silian_rawSlug !== "") {
      if (!Silian_SLUG_REGEX.test(Silian_rawSlug)) {
        process.stderr.write(
          `Error: Invalid slug format "${Silian_rawSlug}" in: articles/${Silian_rootFile}\n`
        )
        Silian_hasError = true
        continue
      }
      Silian_key = Silian_rawSlug
    } else {
      Silian_key = Silian_rootFile.replace(/\.md$/, "")
    }

    if (Silian_rootSlugsSeen.has(Silian_key)) {
      const Silian_conflictFile = Silian_rootSlugsSeen.get(Silian_key)!
      process.stderr.write(
        `Error: Duplicate root article key "${Silian_key}": articles/${Silian_rootFile} ` +
          `(conflicts with articles/${Silian_conflictFile})\n`
      )
      Silian_hasError = true
      continue
    }

    if (Silian_folderSlugKeys.has(Silian_key)) {
      process.stderr.write(
        `Error: Root article key "${Silian_key}" (articles/${Silian_rootFile}) conflicts with ` +
          `an existing folder article slug\n`
      )
      Silian_hasError = true
      continue
    }

    Silian_rootSlugsSeen.set(Silian_key, Silian_rootFile)
    Silian_slugMap[Silian_key] = Silian_getFrontMatterEntry(
      Silian_rootFilePath,
      Silian_key,
      Silian_rootFile,
      false,
      undefined
    )
  }

  for (const Silian_entry of Object.values(Silian_slugMap)) {
    Silian_entry.children = undefined
  }

  for (const [Silian_slug, Silian_entry] of Object.entries(Silian_slugMap)) {
    const Silian_parent = Silian_entry.parentSlug
    if (!Silian_parent || Silian_slugMap[Silian_parent] === undefined) {
      continue
    }
    if (!Silian_slugMap[Silian_parent].children) {
      Silian_slugMap[Silian_parent].children = []
    }
    Silian_slugMap[Silian_parent].children!.push(Silian_slugMap[Silian_slug])
  }

  if (Silian_hasError) {
    process.stderr.write(
      "\nSlug map generation failed due to validation errors above.\n"
    )
    process.exit(1)
  }

  const Silian_outputDir = Silian_path.dirname(Silian_OUTPUT_FILE)
  if (!Silian_fs.existsSync(Silian_outputDir)) {
    Silian_fs.mkdirSync(Silian_outputDir, { recursive: true })
  }

  Silian_fs.writeFileSync(Silian_OUTPUT_FILE, JSON.stringify(Silian_slugMap, null, 2) + "\n")

  const Silian_entryCount = Object.keys(Silian_slugMap).length
  process.stdout.write(`Generated slug-map.json with ${Silian_entryCount} entries\n`)
}

Silian_main()
