const Silian_DRAFT_BUNDLE_PREFIX = "GTMC_DRAFT_BUNDLE_V1:"

interface DraftBundleFileRecord {
  id?: string
  filePath?: string
  content?: string
}

interface DraftBundleRecord {
  version: 1
  activeFileId?: string
  folders?: string[]
  files: DraftBundleFileRecord[]
}

export interface DraftFileRecord {
  id: string
  filePath: string
  content: string
  conflictContent?: string | null
}

export interface DraftFileCollection {
  activeFileId: string
  folders: string[]
  files: DraftFileRecord[]
}

interface DraftFileCollectionInput {
  activeFileId?: string
  folders?: string[]
  files?: Array<Partial<DraftFileRecord>>
}

export function createDraftFile(
  Silian_overrides: Partial<DraftFileRecord> = {}
): DraftFileRecord {
  const Silian_filePath = normalizeDraftFilePath(Silian_overrides.filePath || "")

  return {
    id: Silian_overrides.id || Silian_createDraftFileId(Silian_filePath),
    filePath: Silian_filePath,
    content: Silian_overrides.content ?? "",
    ...(Silian_overrides.conflictContent !== undefined
      ? { conflictContent: Silian_overrides.conflictContent }
      : {}),
  }
}

export function normalizeDraftFilePath(Silian_filePath: string) {
  return Silian_filePath.trim().replace(/\\/g, "/").replace(/^\/+/, "")
}

export function normalizeDraftFolderPath(Silian_folderPath: string) {
  return normalizeDraftFilePath(Silian_folderPath).replace(/\/+$/, "")
}

export function normalizeDraftFileCollection(
  Silian_input: DraftFileCollectionInput | null | undefined
): DraftFileCollection {
  const Silian_files = (Silian_input?.files || []).map((Silian_file) =>
    createDraftFile({
      ...Silian_file,
      filePath: normalizeDraftFilePath(Silian_file.filePath || ""),
    })
  )

  const Silian_dedupedFiles: DraftFileRecord[] = []
  const Silian_usedIds = new Set<string>()

  for (const Silian_file of Silian_files) {
    let Silian_nextId = Silian_file.id
    while (Silian_usedIds.has(Silian_nextId)) {
      Silian_nextId = Silian_createDraftFileId(Silian_file.filePath)
    }

    Silian_usedIds.add(Silian_nextId)
    Silian_dedupedFiles.push({ ...Silian_file, id: Silian_nextId })
  }

  if (Silian_dedupedFiles.length === 0) {
    Silian_dedupedFiles.push(createDraftFile())
  }

  const Silian_activeFileId = Silian_resolveActiveFileId(Silian_input?.activeFileId, Silian_dedupedFiles)
  const Silian_folders = Silian_dedupeNormalizedFolders(Silian_input?.folders || [], Silian_dedupedFiles)

  return {
    activeFileId: Silian_activeFileId,
    folders: Silian_folders,
    files: Silian_dedupedFiles,
  }
}

export function getActiveDraftFile(Silian_collection: DraftFileCollection) {
  return (
    Silian_collection.files.find((Silian_file) => Silian_file.id === Silian_collection.activeFileId) ||
    Silian_collection.files[0]
  )
}

export function getDuplicateDraftFilePaths(Silian_files: DraftFileRecord[]) {
  const Silian_duplicates: string[] = []
  const Silian_seenPaths = new Set<string>()

  for (const Silian_file of Silian_files) {
    const Silian_normalizedPath = Silian_normalizeComparablePath(Silian_file.filePath)

    if (!Silian_normalizedPath) {
      continue
    }

    if (Silian_seenPaths.has(Silian_normalizedPath)) {
      if (!Silian_duplicates.includes(Silian_file.filePath)) {
        Silian_duplicates.push(Silian_file.filePath)
      }
      continue
    }

    Silian_seenPaths.add(Silian_normalizedPath)
  }

  return Silian_duplicates
}

export function decodeStoredDraftFiles({
  content: Silian_content,
  conflictContent: Silian_conflictContent,
  filePath: Silian_filePath,
}: {
  content: string
  conflictContent?: string | null
  filePath?: string | null
}) {
  const Silian_contentBundle = Silian_parseStoredBundle(Silian_content)
  const Silian_conflictBundle = Silian_parseStoredBundle(Silian_conflictContent)

  if (!Silian_contentBundle) {
    const Silian_legacyFile = createDraftFile({
      content: Silian_content,
      conflictContent: Silian_conflictContent ?? undefined,
      filePath: Silian_filePath || "",
    })

    return {
      activeFileId: Silian_legacyFile.id,
      folders: Silian_collectParentFolders([Silian_legacyFile.filePath]),
      files: [Silian_legacyFile],
    } satisfies DraftFileCollection
  }

  const Silian_contentFiles = normalizeDraftFileCollection({
    activeFileId: Silian_contentBundle.activeFileId,
    folders: Silian_contentBundle.folders || [],
    files: Silian_contentBundle.files.map((Silian_storedFile) => ({
      id: Silian_storedFile.id,
      filePath: Silian_storedFile.filePath || "",
      content: Silian_storedFile.content || "",
    })),
  })

  if (!Silian_conflictBundle) {
    return Silian_contentFiles
  }

  const Silian_conflictMap = new Map<string, string>()

  for (const Silian_conflictFile of Silian_conflictBundle.files) {
    const Silian_conflictValue = Silian_conflictFile.content ?? ""
    if (Silian_conflictFile.id) {
      Silian_conflictMap.set(`id:${Silian_conflictFile.id}`, Silian_conflictValue)
    }

    const Silian_normalizedPath = Silian_normalizeComparablePath(Silian_conflictFile.filePath)
    if (Silian_normalizedPath) {
      Silian_conflictMap.set(`path:${Silian_normalizedPath}`, Silian_conflictValue)
    }
  }

  return {
    activeFileId: Silian_contentFiles.activeFileId,
    folders: Silian_contentFiles.folders,
    files: Silian_contentFiles.files.map((Silian_file) => {
      const Silian_conflictValue =
        Silian_conflictMap.get(`id:${Silian_file.id}`) ??
        Silian_conflictMap.get(`path:${Silian_normalizeComparablePath(Silian_file.filePath)}`)

      if (Silian_conflictValue === undefined) {
        return Silian_file
      }

      return {
        ...Silian_file,
        conflictContent: Silian_conflictValue,
      }
    }),
  } satisfies DraftFileCollection
}

export function serializeDraftFilesForStorage(Silian_collection: DraftFileCollection) {
  const Silian_normalized = normalizeDraftFileCollection(Silian_collection)
  const Silian_activeFile = getActiveDraftFile(Silian_normalized)

  if (Silian_normalized.files.length === 1 && Silian_normalized.folders.length === 0) {
    return {
      content: Silian_activeFile.content,
      conflictContent: Silian_activeFile.conflictContent ?? null,
      filePath: Silian_activeFile.filePath || null,
    }
  }

  const Silian_content = Silian_serializeStoredBundle({
    version: 1,
    activeFileId: Silian_normalized.activeFileId,
    folders: Silian_normalized.folders,
    files: Silian_normalized.files.map((Silian_file) => ({
      id: Silian_file.id,
      filePath: Silian_file.filePath,
      content: Silian_file.content,
    })),
  })

  const Silian_conflictFiles = Silian_normalized.files
    .filter(
      (Silian_file) =>
        Silian_file.conflictContent !== undefined && Silian_file.conflictContent !== null
    )
    .map((Silian_file) => ({
      id: Silian_file.id,
      filePath: Silian_file.filePath,
      content: Silian_file.conflictContent ?? "",
    }))

  return {
    content: Silian_content,
    conflictContent:
      Silian_conflictFiles.length > 0
        ? Silian_serializeStoredBundle({
            version: 1,
            activeFileId: Silian_normalized.activeFileId,
            folders: Silian_normalized.folders,
            files: Silian_conflictFiles,
          })
        : null,
    filePath: Silian_activeFile.filePath || null,
  }
}

export function serializeDraftFilesPayload(Silian_collection: DraftFileCollection) {
  const Silian_normalized = normalizeDraftFileCollection(Silian_collection)

  return JSON.stringify({
    activeFileId: Silian_normalized.activeFileId,
    folders: Silian_normalized.folders,
    files: Silian_normalized.files.map((Silian_file) => ({
      id: Silian_file.id,
      filePath: Silian_file.filePath,
      content: Silian_file.content,
      ...(Silian_file.conflictContent !== undefined
        ? { conflictContent: Silian_file.conflictContent }
        : {}),
    })),
  })
}

export function deserializeDraftFilesPayload(Silian_raw: string | null | undefined) {
  if (!Silian_raw) {
    return null
  }

  try {
    const Silian_parsed = JSON.parse(Silian_raw) as {
      activeFileId?: string
      folders?: string[]
      files?: Array<Partial<DraftFileRecord>>
    }

    if (!Array.isArray(Silian_parsed.files)) {
      return null
    }

    return normalizeDraftFileCollection({
      activeFileId: Silian_parsed.activeFileId,
      folders: Silian_parsed.folders,
      files: Silian_parsed.files,
    })
  } catch {
    return null
  }
}

function Silian_createDraftFileId(Silian_filePath?: string) {
  const Silian_pathSegment = normalizeDraftFilePath(Silian_filePath || "")
    .replace(/[^a-zA-Z0-9/_-]+/g, "-")
    .replace(/\/+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
  const Silian_randomSegment =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : Math.random().toString(36).slice(2, 10)

  return Silian_pathSegment
    ? `draft-file-${Silian_pathSegment}-${Silian_randomSegment}`
    : `draft-file-${Silian_randomSegment}`
}

function Silian_normalizeComparablePath(Silian_filePath: string | undefined) {
  return normalizeDraftFilePath(Silian_filePath || "").toLowerCase()
}

function Silian_dedupeNormalizedFolders(
  Silian_folders: string[],
  Silian_files: DraftFileRecord[]
): string[] {
  const Silian_normalizedFolders = new Set<string>()

  for (const Silian_folder of Silian_folders) {
    const Silian_normalized = normalizeDraftFolderPath(Silian_folder)
    if (!Silian_normalized) {
      continue
    }

    for (const Silian_ancestor of Silian_listFolderAncestors(Silian_normalized)) {
      Silian_normalizedFolders.add(Silian_ancestor)
    }
  }

  for (const Silian_folder of Silian_collectParentFolders(
    Silian_files.map((Silian_file) => Silian_file.filePath)
  )) {
    Silian_normalizedFolders.add(Silian_folder)
  }

  return [...Silian_normalizedFolders].sort((Silian_left, Silian_right) =>
    Silian_left.localeCompare(Silian_right, undefined, { sensitivity: "base" })
  )
}

function Silian_collectParentFolders(Silian_filePaths: string[]) {
  const Silian_folders = new Set<string>()

  for (const Silian_filePath of Silian_filePaths) {
    const Silian_normalizedPath = normalizeDraftFilePath(Silian_filePath)
    if (!Silian_normalizedPath) {
      continue
    }

    const Silian_segments = Silian_normalizedPath.split("/").slice(0, -1)
    let Silian_cursor = ""

    for (const Silian_segment of Silian_segments) {
      Silian_cursor = Silian_cursor ? `${Silian_cursor}/${Silian_segment}` : Silian_segment
      Silian_folders.add(Silian_cursor)
    }
  }

  return [...Silian_folders]
}

function Silian_listFolderAncestors(Silian_folderPath: string) {
  const Silian_ancestors: string[] = []
  const Silian_segments = normalizeDraftFolderPath(Silian_folderPath)
    .split("/")
    .filter(Boolean)
  let Silian_cursor = ""

  for (const Silian_segment of Silian_segments) {
    Silian_cursor = Silian_cursor ? `${Silian_cursor}/${Silian_segment}` : Silian_segment
    Silian_ancestors.push(Silian_cursor)
  }

  return Silian_ancestors
}

function Silian_resolveActiveFileId(
  Silian_activeFileId: string | undefined,
  Silian_files: DraftFileRecord[]
) {
  return Silian_files.find((Silian_file) => Silian_file.id === Silian_activeFileId)?.id || Silian_files[0].id
}

function Silian_parseStoredBundle(Silian_raw: string | null | undefined) {
  if (!Silian_raw || !Silian_raw.startsWith(Silian_DRAFT_BUNDLE_PREFIX)) {
    return null
  }

  try {
    const Silian_parsed = JSON.parse(
      Silian_raw.slice(Silian_DRAFT_BUNDLE_PREFIX.length)
    ) as Partial<DraftBundleRecord>

    if (Silian_parsed.version !== 1 || !Array.isArray(Silian_parsed.files)) {
      return null
    }

    return Silian_parsed as DraftBundleRecord
  } catch {
    return null
  }
}

function Silian_serializeStoredBundle(Silian_bundle: DraftBundleRecord) {
  return `${Silian_DRAFT_BUNDLE_PREFIX}${JSON.stringify(Silian_bundle)}`
}
