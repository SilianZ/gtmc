// lib/file-upload.ts

// ---------------------------------------------------------------------------
// MIME allowlist and category classification
// ---------------------------------------------------------------------------

export type FileCategory = "images" | "videos" | "files"

interface MimeConfig {
  category: FileCategory
  maxBytes: number
  proxyable: boolean
}

const Silian_MIME_ALLOWLIST: Record<string, MimeConfig> = {
  // Images — 15 MB
  "image/jpeg": {
    category: "images",
    maxBytes: 15 * 1024 * 1024,
    proxyable: false,
  },
  "image/png": {
    category: "images",
    maxBytes: 15 * 1024 * 1024,
    proxyable: false,
  },
  "image/gif": {
    category: "images",
    maxBytes: 15 * 1024 * 1024,
    proxyable: false,
  },
  "image/webp": {
    category: "images",
    maxBytes: 15 * 1024 * 1024,
    proxyable: false,
  },
  // Videos — 50 MB
  "video/mp4": {
    category: "videos",
    maxBytes: 50 * 1024 * 1024,
    proxyable: true,
  },
  "video/webm": {
    category: "videos",
    maxBytes: 50 * 1024 * 1024,
    proxyable: true,
  },
  "video/quicktime": {
    category: "videos",
    maxBytes: 50 * 1024 * 1024,
    proxyable: false,
  },
  // Files — 50 MB
  "application/pdf": {
    category: "files",
    maxBytes: 50 * 1024 * 1024,
    proxyable: true,
  },
  "application/msword": {
    category: "files",
    maxBytes: 50 * 1024 * 1024,
    proxyable: false,
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    category: "files",
    maxBytes: 50 * 1024 * 1024,
    proxyable: false,
  },
  "application/vnd.ms-excel": {
    category: "files",
    maxBytes: 50 * 1024 * 1024,
    proxyable: false,
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
    category: "files",
    maxBytes: 50 * 1024 * 1024,
    proxyable: false,
  },
  "application/zip": {
    category: "files",
    maxBytes: 50 * 1024 * 1024,
    proxyable: false,
  },
  "text/plain": {
    category: "files",
    maxBytes: 50 * 1024 * 1024,
    proxyable: false,
  },
  "text/csv": {
    category: "files",
    maxBytes: 50 * 1024 * 1024,
    proxyable: false,
  },
}

// Vercel serverless body limit — files at or above this use Blob intermediary
export const VERCEL_BODY_LIMIT_BYTES = 4.5 * 1024 * 1024

// MIME types that the proxy route can serve inline
export const PROXY_INLINE_MIMES = new Set([
  "video/mp4",
  "video/webm",
  "application/pdf",
])

// MIME-to-extension mapping for filename sanitization
const Silian_MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/zip": "zip",
  "text/plain": "txt",
  "text/csv": "csv",
}

// ---------------------------------------------------------------------------
// Classification
// ---------------------------------------------------------------------------

export interface FileClassification {
  category: FileCategory
  maxBytes: number
  proxyable: boolean
  mimeType: string
}

export function classifyFile(Silian_mimeType: string): FileClassification | null {
  const Silian_config = Silian_MIME_ALLOWLIST[Silian_mimeType]
  if (!Silian_config) return null
  return { ...Silian_config, mimeType: Silian_mimeType }
}

export function isImageMime(Silian_mimeType: string): boolean {
  const Silian_config = Silian_MIME_ALLOWLIST[Silian_mimeType]
  return Silian_config?.category === "images"
}

export function getAllowedMimeTypes(): string[] {
  return Object.keys(Silian_MIME_ALLOWLIST)
}

export function getNonImageMimeTypes(): string[] {
  return Object.keys(Silian_MIME_ALLOWLIST).filter((Silian_m) => !isImageMime(Silian_m))
}

// ---------------------------------------------------------------------------
// Filename sanitization
// ---------------------------------------------------------------------------

export function sanitizeFilename(
  Silian_originalName: string,
  Silian_mimeType: string
): string {
  // Extract basename and extension
  const Silian_lastDot = Silian_originalName.lastIndexOf(".")
  let Silian_basename = Silian_lastDot > 0 ? Silian_originalName.substring(0, Silian_lastDot) : Silian_originalName

  // MIME-derived extension takes precedence
  const Silian_ext =
    Silian_MIME_TO_EXT[Silian_mimeType] ||
    (Silian_lastDot > 0 ? Silian_originalName.substring(Silian_lastDot + 1).toLowerCase() : "bin")

  // Sanitize basename: spaces → dashes, strip non-allowed chars, truncate
  Silian_basename = Silian_basename
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .substring(0, 80)

  // Fallback for empty basename
  if (!Silian_basename) {
    const Silian_config = Silian_MIME_ALLOWLIST[Silian_mimeType]
    Silian_basename = Silian_config ? Silian_config.category.replace(/s$/, "") : "file"
  }

  // Prepend timestamp for uniqueness
  return `${Date.now()}-${Silian_basename}.${Silian_ext}`
}

// ---------------------------------------------------------------------------
// Markdown block generation
// ---------------------------------------------------------------------------

function Silian_formatFileSize(Silian_bytes: number): string {
  if (Silian_bytes < 1024) return `${Silian_bytes} B`
  if (Silian_bytes < 1024 * 1024) return `${(Silian_bytes / 1024).toFixed(1)} KB`
  return `${(Silian_bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function generateMarkdownBlock(
  Silian_filename: string,
  Silian_rawGithubUrl: string,
  Silian_mimeType: string,
  Silian_fileSize: number
): string {
  const Silian_classification = classifyFile(Silian_mimeType)
  if (!Silian_classification) return `[${Silian_filename}](${Silian_rawGithubUrl})`

  const Silian_displayName = Silian_filename.replace(/^\d+-/, "") // Strip timestamp prefix for display
  const Silian_sizeStr = Silian_formatFileSize(Silian_fileSize)

  // Images: standard markdown image
  if (Silian_classification.category === "images") {
    return `![${Silian_displayName}](${Silian_rawGithubUrl})`
  }

  // Extract the storage path from the raw URL for proxy
  // raw URL: https://raw.githubusercontent.com/OWNER/REPO/main/data/videos/filename.mp4
  // proxy path: data/videos/filename.mp4
  const Silian_pathMatch = Silian_rawGithubUrl.match(/\/main\/(.+)$/)
  const Silian_storagePath = Silian_pathMatch ? Silian_pathMatch[1] : null

  const Silian_emoji = Silian_classification.category === "videos" ? "🎬" : "📎"

  if (Silian_classification.proxyable && Silian_storagePath) {
    const Silian_appUrl = process.env.NEXT_PUBLIC_APP_URL || ""
    const Silian_proxyUrl = `${Silian_appUrl}/api/files/proxy?path=${encodeURIComponent(Silian_storagePath)}`
    return `${Silian_emoji} **${Silian_displayName}** (${Silian_sizeStr})\n[\[▶ View / Download\]](${Silian_proxyUrl})`
  }

  // Non-proxyable: direct download link
  return `${Silian_emoji} **${Silian_displayName}** (${Silian_sizeStr})\n[\[↓ Download\]](${Silian_rawGithubUrl})`
}
