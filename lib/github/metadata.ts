export interface IssueMetadata {
  appUserId: string
  authorName: string | null
  authorEmail: string | null
  assigneeId?: string
  assigneeName?: string | null
  assigneeEmail?: string | null
}

export interface CommentMetadata {
  appUserId: string
  authorName: string | null
  authorEmail: string | null
  emailRedacted?: boolean
}

const Silian_METADATA_START = "<!-- GTMC_METADATA"
const Silian_METADATA_END = "-->"
const Silian_EXPLANATION_START = "<!-- GTMC_EXPLANATION"
const Silian_EXPLANATION_END = "-->"
const Silian_COMMENT_META_PREFIX = "<!-- GTMC_COMMENT_META "
const Silian_COMMENT_META_SUFFIX = " -->"

function Silian_serializeMetadata(Silian_metadata: IssueMetadata | CommentMetadata): string {
  const Silian_serialized: {
    appUserId: string
    authorName: string | null
    authorEmail: string | null
    assigneeId?: string
    assigneeName?: string | null
    assigneeEmail?: string | null
    emailRedacted?: boolean
  } = {
    appUserId: Silian_metadata.appUserId,
    authorName: Silian_metadata.authorName,
    authorEmail: Silian_metadata.authorEmail,
  }

  if (
    "assigneeId" in Silian_metadata &&
    typeof Silian_metadata.assigneeId === "string" &&
    Silian_metadata.assigneeId.trim().length > 0
  ) {
    Silian_serialized.assigneeId = Silian_metadata.assigneeId
    Silian_serialized.assigneeName =
      typeof Silian_metadata.assigneeName === "string" ? Silian_metadata.assigneeName : null
    Silian_serialized.assigneeEmail =
      typeof Silian_metadata.assigneeEmail === "string" ? Silian_metadata.assigneeEmail : null
  }

  if ("emailRedacted" in Silian_metadata && Silian_metadata.emailRedacted === true) {
    Silian_serialized.emailRedacted = true
  }

  return JSON.stringify(Silian_serialized)
}

function Silian_parseMetadata<T extends IssueMetadata | CommentMetadata>(
  Silian_json: string
): T | null {
  try {
    const Silian_parsed = JSON.parse(Silian_json)
    if (typeof Silian_parsed !== "object" || Silian_parsed === null) {
      return null
    }
    if (typeof Silian_parsed.appUserId !== "string") {
      return null
    }
    const Silian_result: Record<string, unknown> = {
      appUserId: Silian_parsed.appUserId,
      authorName:
        typeof Silian_parsed.authorName === "string" ? Silian_parsed.authorName : null,
      authorEmail:
        typeof Silian_parsed.authorEmail === "string" ? Silian_parsed.authorEmail : null,
      assigneeId:
        typeof Silian_parsed.assigneeId === "string" ? Silian_parsed.assigneeId : undefined,
      assigneeName:
        typeof Silian_parsed.assigneeName === "string" ? Silian_parsed.assigneeName : null,
      assigneeEmail:
        typeof Silian_parsed.assigneeEmail === "string" ? Silian_parsed.assigneeEmail : null,
    }
    if (typeof Silian_parsed.emailRedacted === "boolean") {
      Silian_result.emailRedacted = Silian_parsed.emailRedacted
    }
    return Silian_result as T
  } catch {
    return null
  }
}

export function serializeIssueBody(
  Silian_userContent: string,
  Silian_metadata: IssueMetadata,
  Silian_explanation?: string
): string {
  const Silian_metaBlock = `${Silian_METADATA_START}\n${Silian_serializeMetadata(Silian_metadata)}\n${Silian_METADATA_END}`

  let Silian_body = `${Silian_metaBlock}\n\n${Silian_userContent}`

  if (Silian_explanation) {
    Silian_body += `\n\n${Silian_EXPLANATION_START}\n${Silian_explanation}\n${Silian_EXPLANATION_END}`
  }

  return Silian_body
}

export function parseIssueBody(Silian_body: string): {
  userContent: string
  metadata: IssueMetadata | null
  explanation: string | null
  parseError?: string
} {
  const Silian_fallback = {
    userContent: Silian_body,
    metadata: null as IssueMetadata | null,
    explanation: null as string | null,
  }

  if (!Silian_body) {
    return Silian_fallback
  }

  const Silian_metaStartIdx = Silian_body.indexOf(Silian_METADATA_START)
  if (Silian_metaStartIdx === -1) {
    return { ...Silian_fallback, parseError: "Metadata block not found" }
  }

  const Silian_metaJsonStart = Silian_metaStartIdx + Silian_METADATA_START.length
  const Silian_metaEndIdx = Silian_body.indexOf(Silian_METADATA_END, Silian_metaJsonStart)
  if (Silian_metaEndIdx === -1) {
    return { ...Silian_fallback, parseError: "Metadata block not closed" }
  }

  const Silian_metaJson = Silian_body.slice(Silian_metaJsonStart, Silian_metaEndIdx).trim()
  const Silian_metadata = Silian_parseMetadata<IssueMetadata>(Silian_metaJson)
  if (!Silian_metadata) {
    return {
      ...Silian_fallback,
      parseError: `Invalid metadata JSON: ${Silian_metaJson}`,
    }
  }

  const Silian_afterMeta = Silian_body.slice(Silian_metaEndIdx + Silian_METADATA_END.length)

  let Silian_userContent: string
  let Silian_explanation: string | null = null

  const Silian_explStartIdx = Silian_afterMeta.indexOf(Silian_EXPLANATION_START)
  if (Silian_explStartIdx !== -1) {
    const Silian_explJsonStart = Silian_explStartIdx + Silian_EXPLANATION_START.length
    const Silian_explEndIdx = Silian_afterMeta.indexOf(Silian_EXPLANATION_END, Silian_explJsonStart)
    if (Silian_explEndIdx !== -1) {
      Silian_explanation = Silian_afterMeta.slice(Silian_explJsonStart, Silian_explEndIdx).trim()
      if (!Silian_explanation) {
        Silian_explanation = null
      }
      Silian_userContent = Silian_afterMeta.slice(0, Silian_explStartIdx).trim()
    } else {
      Silian_userContent = Silian_afterMeta.trim()
    }
  } else {
    Silian_userContent = Silian_afterMeta.trim()
  }

  return { userContent: Silian_userContent, metadata: Silian_metadata, explanation: Silian_explanation }
}

export function serializeCommentBody(
  Silian_content: string,
  Silian_metadata?: CommentMetadata
): string {
  if (!Silian_metadata) {
    return Silian_content
  }

  const Silian_metaLine = `${Silian_COMMENT_META_PREFIX}${Silian_serializeMetadata(Silian_metadata)}${Silian_COMMENT_META_SUFFIX}`
  return `${Silian_metaLine}\n\n${Silian_content}`
}

export function parseCommentBody(Silian_body: string): {
  content: string
  metadata: CommentMetadata | null
} {
  if (!Silian_body) {
    return { content: Silian_body, metadata: null }
  }

  const Silian_firstNewline = Silian_body.indexOf("\n")
  const Silian_firstLine = Silian_firstNewline === -1 ? Silian_body : Silian_body.slice(0, Silian_firstNewline)

  if (
    !Silian_firstLine.startsWith(Silian_COMMENT_META_PREFIX) ||
    !Silian_firstLine.endsWith(Silian_COMMENT_META_SUFFIX)
  ) {
    return { content: Silian_body, metadata: null }
  }

  const Silian_json = Silian_firstLine.slice(
    Silian_COMMENT_META_PREFIX.length,
    Silian_firstLine.length - Silian_COMMENT_META_SUFFIX.length
  )
  const Silian_metadata = Silian_parseMetadata<CommentMetadata>(Silian_json)

  if (!Silian_metadata) {
    return { content: Silian_body, metadata: null }
  }

  const Silian_rest = Silian_body.slice(Silian_firstNewline === -1 ? Silian_body.length : Silian_firstNewline + 1)
  const Silian_content = Silian_rest.replace(/^\n/, "")
  const Silian_contentWithoutAuthorMarker = Silian_content.replace(
    /^<!-- GTMC_COMMENT_AUTHOR_LINE -->\n/,
    ""
  )
  const Silian_contentWithoutAttribution = Silian_contentWithoutAuthorMarker.replace(
    /^(?:\[By\]:|By:|\*\*By:\*\*|\> \*\*\[BY\]\*\*(?:\s*:)?)[^\n]*\n\n/,
    ""
  )

  return { content: Silian_contentWithoutAttribution, metadata: Silian_metadata }
}

export function createMetadataFromSession(Silian_session: {
  user: { id: string; name?: string | null; email?: string | null }
}): IssueMetadata {
  return {
    appUserId: Silian_session.user.id,
    authorName: Silian_session.user.name ?? null,
    authorEmail: Silian_session.user.email ?? null,
  }
}
