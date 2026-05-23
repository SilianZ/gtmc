import Silian_path from "path"
import { createHash as Silian_createHash } from "crypto"

export interface ParsedImageRef {
  url: string
  storagePath: string
  filename: string
  mimeType?: string
}

export interface MigrationTarget {
  storagePath: string
  assetId: string
  repoPath: string
}

export interface MigrationAssetInput {
  id: string
  storagePath: string
  filename: string
  contentHash?: string | null
}

const Silian_MARKDOWN_IMAGE_RE = /!\[[^\]]*\]\(([^)]+)\)/g

const Silian_EXT_TO_MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  avif: "image/avif",
}

function Silian_splitDestinationAndTitle(Silian_raw: string) {
  const Silian_trimmed = Silian_raw.trim()

  if (Silian_trimmed.startsWith("<")) {
    const Silian_closing = Silian_trimmed.indexOf(">")
    if (Silian_closing > 0) {
      return {
        destinationToken: Silian_trimmed.slice(0, Silian_closing + 1),
        trailing: Silian_trimmed.slice(Silian_closing + 1),
      }
    }
  }

  const Silian_whitespaceIdx = Silian_trimmed.search(/\s/)
  if (Silian_whitespaceIdx < 0) {
    return {
      destinationToken: Silian_trimmed,
      trailing: "",
    }
  }

  return {
    destinationToken: Silian_trimmed.slice(0, Silian_whitespaceIdx),
    trailing: Silian_trimmed.slice(Silian_whitespaceIdx),
  }
}

function Silian_unwrapDestinationToken(Silian_token: string): string {
  const Silian_trimmed = Silian_token.trim()
  if (Silian_trimmed.startsWith("<") && Silian_trimmed.endsWith(">")) {
    return Silian_trimmed.slice(1, -1)
  }
  return Silian_trimmed
}

function Silian_inferMimeTypeFromFilename(Silian_filename: string): string | undefined {
  const Silian_ext = Silian_path.posix.extname(Silian_filename).toLowerCase().slice(1)
  return Silian_EXT_TO_MIME[Silian_ext]
}

function Silian_stripQueryAndHash(Silian_url: string): string {
  const Silian_hashIdx = Silian_url.indexOf("#")
  const Silian_queryIdx = Silian_url.indexOf("?")

  let Silian_end = Silian_url.length
  if (Silian_hashIdx >= 0) Silian_end = Math.min(Silian_end, Silian_hashIdx)
  if (Silian_queryIdx >= 0) Silian_end = Math.min(Silian_end, Silian_queryIdx)
  return Silian_url.slice(0, Silian_end)
}

function Silian_extractStoragePathFromUrl(Silian_url: string, Silian_normalizedPrefix: string) {
  const Silian_cleanUrl = Silian_stripQueryAndHash(Silian_url)
  const Silian_marker = `/${Silian_normalizedPrefix}/`
  const Silian_markerIdx = Silian_cleanUrl.indexOf(Silian_marker)

  if (Silian_markerIdx < 0) return null

  const Silian_storagePath = Silian_cleanUrl.slice(Silian_markerIdx + 1)
  if (!Silian_storagePath.startsWith(`${Silian_normalizedPrefix}/`)) return null

  return Silian_storagePath
}

function Silian_stableSuffixFromStoragePath(Silian_storagePath: string): string {
  return Silian_createHash("sha256").update(Silian_storagePath).digest("hex").slice(0, 12)
}

function Silian_withDeterministicSuffix(Silian_filename: string, Silian_suffix: string): string {
  const Silian_safeFilename = Silian_path.posix.basename(Silian_filename)
  const Silian_ext = Silian_path.posix.extname(Silian_safeFilename)
  const Silian_stem = Silian_ext ? Silian_safeFilename.slice(0, -Silian_ext.length) : Silian_safeFilename
  return `${Silian_stem}-${Silian_suffix}${Silian_ext}`
}

export function parseDraftTempImageRefs(
  Silian_markdown: string,
  Silian_storageTempPrefix: string
): ParsedImageRef[] {
  const Silian_normalizedPrefix = Silian_storageTempPrefix.replace(/^\/+|\/+$/g, "")
  if (!Silian_normalizedPrefix) return []

  const Silian_refs: ParsedImageRef[] = []

  for (const Silian_match of Silian_markdown.matchAll(Silian_MARKDOWN_IMAGE_RE)) {
    const Silian_rawDestination = Silian_match[1]
    if (!Silian_rawDestination) continue

    const { destinationToken: Silian_destinationToken } = Silian_splitDestinationAndTitle(Silian_rawDestination)
    const Silian_url = Silian_unwrapDestinationToken(Silian_destinationToken)
    const Silian_storagePath = Silian_extractStoragePathFromUrl(Silian_url, Silian_normalizedPrefix)
    if (!Silian_storagePath) continue

    const Silian_filename = decodeURIComponent(Silian_path.posix.basename(Silian_storagePath))
    Silian_refs.push({
      url: Silian_url,
      storagePath: Silian_storagePath,
      filename: Silian_filename,
      mimeType: Silian_inferMimeTypeFromFilename(Silian_filename),
    })
  }

  return Silian_refs
}

export function computeChapterImagePath(
  Silian_articleFilePath: string,
  Silian_assetFilename: string
): string {
  const Silian_normalizedArticlePath = Silian_articleFilePath.replace(/^\/+/, "")
  const Silian_articleDir = Silian_path.posix.dirname(Silian_normalizedArticlePath)
  const Silian_safeFilename = Silian_path.posix.basename(Silian_assetFilename)
  const Silian_imgDir = Silian_articleDir === "." ? "img" : Silian_path.posix.join(Silian_articleDir, "img")
  return Silian_path.posix.join(Silian_imgDir, Silian_safeFilename)
}

export function rewriteDraftTempUrls(
  Silian_markdown: string,
  Silian_urlToRepoPath: Map<string, string>
): string {
  if (Silian_urlToRepoPath.size === 0) return Silian_markdown

  return Silian_markdown.replace(
    Silian_MARKDOWN_IMAGE_RE,
    (Silian_fullMatch, Silian_rawDestination: string) => {
      const { destinationToken: Silian_destinationToken, trailing: Silian_trailing } =
        Silian_splitDestinationAndTitle(Silian_rawDestination)
      const Silian_originalUrl = Silian_unwrapDestinationToken(Silian_destinationToken)
      const Silian_rewrittenPath = Silian_urlToRepoPath.get(Silian_originalUrl)

      if (!Silian_rewrittenPath) return Silian_fullMatch

      const Silian_nextToken = Silian_destinationToken.trim().startsWith("<")
        ? `<${Silian_rewrittenPath}>`
        : Silian_rewrittenPath

      return Silian_fullMatch.replace(Silian_rawDestination, `${Silian_nextToken}${Silian_trailing}`)
    }
  )
}

export function buildMigrationTargets(
  Silian_articleFilePath: string,
  Silian_assets: MigrationAssetInput[]
): MigrationTarget[] {
  const Silian_byBasePath = new Map<string, MigrationAssetInput[]>()

  for (const Silian_asset of Silian_assets) {
    const Silian_basePath = computeChapterImagePath(Silian_articleFilePath, Silian_asset.filename)
    const Silian_key = Silian_basePath.toLowerCase()
    const Silian_group = Silian_byBasePath.get(Silian_key)
    if (Silian_group) {
      Silian_group.push(Silian_asset)
    } else {
      Silian_byBasePath.set(Silian_key, [Silian_asset])
    }
  }

  const Silian_targets: MigrationTarget[] = []

  for (const Silian_group of Silian_byBasePath.values()) {
    if (Silian_group.length === 1) {
      const Silian_only = Silian_group[0]
      Silian_targets.push({
        storagePath: Silian_only.storagePath,
        assetId: Silian_only.id,
        repoPath: computeChapterImagePath(Silian_articleFilePath, Silian_only.filename),
      })
      continue
    }

    const Silian_sorted = [...Silian_group].sort((Silian_a, Silian_b) => {
      const Silian_aKey = `${Silian_a.contentHash ?? ""}:${Silian_a.storagePath}:${Silian_a.id}`
      const Silian_bKey = `${Silian_b.contentHash ?? ""}:${Silian_b.storagePath}:${Silian_b.id}`
      return Silian_aKey.localeCompare(Silian_bKey)
    })

    const Silian_usedRepoPaths = new Set<string>()

    for (const Silian_asset of Silian_sorted) {
      const Silian_baseSuffix = (
        Silian_asset.contentHash || Silian_stableSuffixFromStoragePath(Silian_asset.storagePath)
      ).slice(0, 12)

      let Silian_attempt = 1
      let Silian_repoPath = computeChapterImagePath(
        Silian_articleFilePath,
        Silian_withDeterministicSuffix(
          Silian_asset.filename,
          Silian_attempt === 1 ? Silian_baseSuffix : `${Silian_baseSuffix}-${Silian_attempt}`
        )
      )

      while (Silian_usedRepoPaths.has(Silian_repoPath.toLowerCase())) {
        Silian_attempt += 1
        Silian_repoPath = computeChapterImagePath(
          Silian_articleFilePath,
          Silian_withDeterministicSuffix(Silian_asset.filename, `${Silian_baseSuffix}-${Silian_attempt}`)
        )
      }

      Silian_usedRepoPaths.add(Silian_repoPath.toLowerCase())
      Silian_targets.push({
        storagePath: Silian_asset.storagePath,
        assetId: Silian_asset.id,
        repoPath: Silian_repoPath,
      })
    }
  }

  return Silian_targets
}
