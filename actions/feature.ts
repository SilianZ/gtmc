"use server"

import { requireAuth as Silian_requireAuth } from "@/lib/auth-helpers"
import {
  getCurrentUserAuthContext as Silian_getCurrentUserAuthContext,
  getGithubPatForUser as Silian_getGithubPatForUser,
  requireAdmin as Silian_requireAdmin,
} from "@/lib/auth-context"
import { revalidatePath as Silian_revalidatePath } from "next/cache"
import { prisma as Silian_prisma } from "@/lib/prisma"
import { PATHS as Silian_PATHS } from "@/lib/cache-config"
import {
  addIssueComment as Silian_addIssueComment,
  createIssue as Silian_createIssue,
  updateIssue as Silian_updateIssue,
  setIssueLabels as Silian_setIssueLabels,
  setIssueState as Silian_setIssueState,
  parseIssueBody as Silian_parseIssueBody,
  serializeIssueBody as Silian_serializeIssueBody,
  serializeCommentBody as Silian_serializeCommentBody,
  serializeSystemComment as Silian_serializeSystemComment,
  getGithubLoginByAccountId as Silian_getGithubLoginByAccountId,
  getGithubLoginByToken as Silian_getGithubLoginByToken,
  ensureLabel as Silian_ensureLabel,
  tagsToLabels as Silian_tagsToLabels,
  statusToLabels as Silian_statusToLabels,
  labelsToStatus as Silian_labelsToStatus,
  labelsToTags as Silian_labelsToTags,
  getIssue as Silian_getIssue,
  getGithubEmailVisibility as Silian_getGithubEmailVisibility,
  createMetadataFromSession as Silian_createMetadataFromSession,
  parseIssueNumber as Silian_parseIssueNumber,
  type IssueMetadata,
} from "@/lib/github"

async function Silian_sendQQBotNotification(Silian_payload: {
  type?: string
  text: string
  data?: Record<string, unknown>
}) {
  const Silian_QQ_BOT_WEBHOOK = process.env.QQ_BOT_WEBHOOK || ""

  if (!Silian_QQ_BOT_WEBHOOK) {
    console.log("[Mock QQ Bot] Would send payload to webhook: ", Silian_payload.text)
    return
  }

  try {
    const Silian_res = await fetch(Silian_QQ_BOT_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Send a structured payload that AstrBot can easily parse in a custom plugin
      body: JSON.stringify(Silian_payload),
    })

    if (!Silian_res.ok) {
      console.error("QQ Bot Webhook returned error HTTP status:", Silian_res.status)
    }
  } catch (Silian_error) {
    console.error("Failed to send QQ Bot Notification:", Silian_error)
  }
}

async function Silian_getFeatureByIssueNumber(Silian_issueNumber: number) {
  const Silian_issue = await Silian_getIssue(Silian_issueNumber)
  if (!Silian_issue) return null
  const Silian_parsed = Silian_parseIssueBody(Silian_issue.body)
  return { issue: Silian_issue, parsed: Silian_parsed }
}

async function Silian_resolveGithubLoginFromAccount(
  Silian_account: {
    providerAccountId: string
    access_token: string | null
  } | null
): Promise<string | null> {
  if (!Silian_account) {
    return null
  }

  const Silian_loginByAccountId = await Silian_getGithubLoginByAccountId(
    Silian_account.providerAccountId
  )
  if (Silian_loginByAccountId) {
    return Silian_loginByAccountId
  }

  if (!Silian_account.access_token) {
    return null
  }

  return Silian_getGithubLoginByToken(Silian_account.access_token)
}

async function Silian_resolveMentionToken(
  Silian_appUserId: string,
  Silian_displayName: string | null
): Promise<string> {
  try {
    const Silian_account = await Silian_prisma.account.findFirst({
      where: { provider: "github", userId: Silian_appUserId },
    })
    if (Silian_account) {
      const Silian_login = await Silian_resolveGithubLoginFromAccount(Silian_account)
      if (Silian_login) {
        return `@${Silian_login}`
      }
    }
  } catch {
    // fallthrough to plain text
  }
  return Silian_displayName ?? Silian_appUserId
}

function Silian_getMetadataForWrite(
  Silian_metadata: IssueMetadata | null,
  Silian_fallbackAppUserId: string
): IssueMetadata {
  if (Silian_metadata) {
    return Silian_metadata
  }

  return {
    appUserId: Silian_fallbackAppUserId,
    authorName: null,
    authorEmail: null,
  }
}

export async function createFeature(Silian_data: {
  title: string
  content: string
  tags: string[]
}) {
  const Silian_session = await Silian_requireAuth()

  const Silian_metadata = Silian_createMetadataFromSession(Silian_session)

  const Silian_body = Silian_serializeIssueBody(Silian_data.content, Silian_metadata, undefined)

  // Ensure all tag labels exist on the repo
  for (const Silian_tag of Silian_data.tags) {
    await Silian_ensureLabel(Silian_tag)
  }

  const Silian_labels = [...Silian_tagsToLabels(Silian_data.tags), ...Silian_statusToLabels("PENDING")]

  const Silian_created = await Silian_createIssue(Silian_data.title, Silian_body, Silian_labels)

  // Send structured payload for AstrBot
  await Silian_sendQQBotNotification({
    type: "new_feature",
    text: `New feature report from [${Silian_session.user.name || Silian_session.user.email}]: ${Silian_data.title}\nIssue #${Silian_created.number}`,
    data: {
      id: String(Silian_created.number),
      issueNumber: Silian_created.number,
      title: Silian_data.title,
      author: Silian_session.user.name || Silian_session.user.email,
      tags: Silian_data.tags,
      url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/features/${Silian_created.number}`,
    },
  })

  Silian_revalidatePath(Silian_PATHS.FEATURES)
  return {
    success: true,
    feature: {
      id: String(Silian_created.number),
      title: Silian_data.title,
      content: Silian_data.content,
      tags: Silian_data.tags,
    },
  }
}

export async function updateFeature(
  Silian_id: string,
  Silian_data: { title: string; content: string; tags: string[] }
) {
  const Silian_session = await Silian_requireAuth()

  const Silian_issueNumber = Silian_parseIssueNumber(Silian_id)

  const Silian_feature = await Silian_getFeatureByIssueNumber(Silian_issueNumber)
  if (!Silian_feature) throw new Error("Not found")

  if (Silian_feature.issue.state === "closed") {
    throw new Error("Feature is deleted and read-only")
  }

  const { issue: Silian_issue, parsed: Silian_parsed } = Silian_feature
  const Silian_authContext = await Silian_getCurrentUserAuthContext(Silian_session.user.id)

  if (
    Silian_parsed.metadata?.appUserId !== Silian_session.user.id &&
    Silian_authContext.role !== "ADMIN"
  ) {
    throw new Error("Forbidden")
  }

  for (const Silian_tag of Silian_data.tags) {
    await Silian_ensureLabel(Silian_tag)
  }

  const Silian_currentStatus = Silian_labelsToStatus(Silian_issue.labels)
  const Silian_newLabels = [
    ...Silian_tagsToLabels(Silian_data.tags),
    ...Silian_statusToLabels(Silian_currentStatus),
  ]

  const Silian_fallbackMetadata: IssueMetadata = {
    appUserId: "",
    authorName: null,
    authorEmail: null,
  }
  const Silian_newBody = Silian_serializeIssueBody(
    Silian_data.content,
    Silian_parsed.metadata ?? Silian_fallbackMetadata,
    Silian_parsed.explanation ?? undefined
  )

  await Silian_updateIssue(Silian_issue.number, {
    title: Silian_data.title,
    body: Silian_newBody,
    labels: Silian_newLabels,
  })

  Silian_revalidatePath(Silian_PATHS.FEATURES)
  Silian_revalidatePath(Silian_PATHS.FEATURE(Silian_id))
  return {
    success: true,
    feature: {
      id: Silian_id,
      title: Silian_data.title,
      content: Silian_data.content,
      tags: Silian_data.tags,
    },
  }
}

export async function updateFeatureExplanation(
  Silian_id: string,
  Silian_explanation: string
) {
  const Silian_session = await Silian_requireAuth()

  const Silian_issueNumber = Silian_parseIssueNumber(Silian_id)

  const Silian_feature = await Silian_getFeatureByIssueNumber(Silian_issueNumber)
  if (!Silian_feature) throw new Error("Not found")

  if (Silian_feature.issue.state === "closed") {
    throw new Error("Feature is deleted and read-only")
  }

  const { issue: Silian_issue, parsed: Silian_parsed } = Silian_feature

  const Silian_authContext = await Silian_getCurrentUserAuthContext(Silian_session.user.id)
  const Silian_isAdmin = Silian_authContext.role === "ADMIN"
  const Silian_isAssignee = Silian_parsed.metadata?.assigneeId === Silian_session.user.id
  if (!Silian_isAssignee && !Silian_isAdmin) throw new Error("Forbidden")

  const Silian_newBody = Silian_serializeIssueBody(
    Silian_parsed.userContent,
    Silian_parsed.metadata ?? {
      appUserId: "",
      authorName: null,
      authorEmail: null,
    },
    Silian_explanation || undefined
  )

  await Silian_updateIssue(Silian_issue.number, { body: Silian_newBody })

  Silian_revalidatePath(`/features/${Silian_id}`)
  return { success: true }
}

export async function assignFeature(Silian_id: string) {
  const Silian_session = await Silian_requireAuth()

  const Silian_issueNumber = Silian_parseIssueNumber(Silian_id)

  const Silian_feature = await Silian_getFeatureByIssueNumber(Silian_issueNumber)
  if (!Silian_feature) throw new Error("Not found")

  if (Silian_feature.issue.state === "closed") {
    throw new Error("Feature is deleted and read-only")
  }

  const { issue: Silian_issue, parsed: Silian_parsed } = Silian_feature
  const Silian_metadataForWrite = Silian_getMetadataForWrite(
    Silian_parsed.metadata,
    `legacy-issue-${Silian_issue.number}`
  )

  const Silian_newBodyWithAssignee = Silian_serializeIssueBody(
    Silian_parsed.userContent,
    {
      appUserId: Silian_metadataForWrite.appUserId,
      authorName: Silian_metadataForWrite.authorName,
      authorEmail: Silian_metadataForWrite.authorEmail,
      assigneeId: Silian_session.user.id,
      assigneeName: Silian_session.user.name ?? null,
      assigneeEmail: Silian_session.user.email ?? null,
    },
    Silian_parsed.explanation ?? undefined
  )

  const Silian_tags = Silian_labelsToTags(Silian_issue.labels)
  const Silian_newLabels = [...Silian_tagsToLabels(Silian_tags), ...Silian_statusToLabels("IN_PROGRESS")]

  await Promise.all([
    Silian_setIssueLabels(Silian_issue.number, Silian_newLabels),
    Silian_updateIssue(Silian_issue.number, { body: Silian_newBodyWithAssignee }),
  ])

  // Post claim bot comment (best-effort, does not fail the action)
  try {
    const Silian_mentionToken = await Silian_resolveMentionToken(
      Silian_session.user.id,
      Silian_session.user.name ?? null
    )

    // Query GitHub Account and check email visibility
    const Silian_token = await Silian_getGithubPatForUser(Silian_session.user.id)
    const Silian_visibility = await Silian_getGithubEmailVisibility(Silian_token || "")
    const Silian_assigneeEmail =
      Silian_visibility === "private"
        ? "REDACTED FOR PRIVACY"
        : (Silian_session.user.email ?? "Unknown")

    const Silian_payload = `[Assignment Notice]
Action: CLAIMED
Assignee: ${Silian_mentionToken}
AssigneeId: ${Silian_session.user.id}
AssigneeEmail: ${Silian_assigneeEmail}
By: ${Silian_mentionToken}
At: ${new Date().toISOString()}`
    await Silian_addIssueComment(Silian_issue.number, Silian_serializeSystemComment(Silian_payload))
  } catch (Silian_error) {
    console.warn("Failed to post claim bot comment:", Silian_error)
  }

  Silian_revalidatePath("/features")
  Silian_revalidatePath(`/features/${Silian_id}`)
  return { success: true, feature: { id: Silian_id } }
}

export async function unassignFeature(Silian_id: string) {
  const Silian_session = await Silian_requireAuth()

  const Silian_issueNumber = Silian_parseIssueNumber(Silian_id)

  const Silian_feature = await Silian_getFeatureByIssueNumber(Silian_issueNumber)
  if (!Silian_feature) throw new Error("Not found")

  if (Silian_feature.issue.state === "closed") {
    throw new Error("Feature is deleted and read-only")
  }

  const { issue: Silian_issue, parsed: Silian_parsed } = Silian_feature
  const Silian_authContext = await Silian_getCurrentUserAuthContext(Silian_session.user.id)
  const Silian_isAdmin = Silian_authContext.role === "ADMIN"
  const Silian_isAssignee = Silian_parsed.metadata?.assigneeId === Silian_session.user.id
  if (!Silian_isAssignee && !Silian_isAdmin) throw new Error("Forbidden")

  const Silian_metadataForWrite = Silian_getMetadataForWrite(
    Silian_parsed.metadata,
    `legacy-issue-${Silian_issue.number}`
  )

  const Silian_newBody = Silian_serializeIssueBody(
    Silian_parsed.userContent,
    {
      appUserId: Silian_metadataForWrite.appUserId,
      authorName: Silian_metadataForWrite.authorName,
      authorEmail: Silian_metadataForWrite.authorEmail,
    },
    Silian_parsed.explanation ?? undefined
  )

  const Silian_tags = Silian_labelsToTags(Silian_issue.labels)
  const Silian_newLabels = [...Silian_tagsToLabels(Silian_tags), ...Silian_statusToLabels("PENDING")]

  await Promise.all([
    Silian_setIssueLabels(Silian_issue.number, Silian_newLabels),
    Silian_updateIssue(Silian_issue.number, { body: Silian_newBody }),
  ])

  // Post drop bot comment (best-effort, does not fail the action)
  try {
    const Silian_mentionToken = await Silian_resolveMentionToken(
      Silian_session.user.id,
      Silian_session.user.name ?? null
    )
    const Silian_prevAssigneeId = Silian_parsed.metadata?.assigneeId ?? ""
    const Silian_previousMentionToken = Silian_prevAssigneeId
      ? await Silian_resolveMentionToken(
          Silian_prevAssigneeId,
          Silian_parsed.metadata?.assigneeName ?? null
        )
      : "N/A"
    const Silian_payload = `[Assignment Notice]
Action: DROPPED
PreviousAssignee: ${Silian_previousMentionToken}
PreviousAssigneeId: ${Silian_parsed.metadata?.assigneeId ?? "N/A"}
By: ${Silian_mentionToken}
At: ${new Date().toISOString()}`
    await Silian_addIssueComment(Silian_issue.number, Silian_serializeSystemComment(Silian_payload))
  } catch (Silian_error) {
    console.warn("Failed to post drop bot comment:", Silian_error)
  }

  Silian_revalidatePath("/features")
  Silian_revalidatePath(`/features/${Silian_id}`)
  return { success: true, feature: { id: Silian_id } }
}

export async function resolveFeature(Silian_id: string, Silian_resolutionComment?: string) {
  const Silian_session = await Silian_requireAuth()

  const Silian_issueNumber = Silian_parseIssueNumber(Silian_id)

  await Silian_requireAdmin(Silian_session.user.id)

  const Silian_feature = await Silian_getFeatureByIssueNumber(Silian_issueNumber)
  if (!Silian_feature) throw new Error("Not found")

  if (Silian_feature.issue.state === "closed") {
    throw new Error("Feature is deleted and read-only")
  }

  const { issue: Silian_issue } = Silian_feature

  const Silian_tags = Silian_labelsToTags(Silian_issue.labels)
  const Silian_newLabels = [...Silian_tagsToLabels(Silian_tags), ...Silian_statusToLabels("RESOLVED")]

  await Silian_setIssueLabels(Silian_issue.number, Silian_newLabels)
  await Silian_setIssueState(Silian_issue.number, "closed")

  if (Silian_resolutionComment) {
    await Silian_addIssueComment(
      Silian_issue.number,
      Silian_serializeCommentBody(
        `[Resolution]: ${Silian_resolutionComment}`,
        Silian_createMetadataFromSession(Silian_session)
      )
    )
  }

  Silian_revalidatePath("/features")
  Silian_revalidatePath(`/features/${Silian_id}`)
  return { success: true, feature: { id: Silian_id } }
}

export async function addFeatureComment(Silian_id: string, Silian_content: string) {
  const Silian_session = await Silian_requireAuth()

  const Silian_issueNumber = Silian_parseIssueNumber(Silian_id)

  const Silian_feature = await Silian_getFeatureByIssueNumber(Silian_issueNumber)
  if (!Silian_feature) throw new Error("Not found")

  if (Silian_feature.issue.state === "closed") {
    throw new Error("Feature is deleted and read-only")
  }

  // Query GitHub Account and check email visibility
  const Silian_account = await Silian_prisma.account.findFirst({
    where: {
      provider: "github",
      userId: Silian_session.user.id,
    },
  })

  const Silian_token = await Silian_getGithubPatForUser(Silian_session.user.id)
  const Silian_visibility = await Silian_getGithubEmailVisibility(Silian_token || "")
  const Silian_isPrivate = Silian_visibility === "private"

  const Silian_githubLogin = await Silian_resolveGithubLoginFromAccount(Silian_account)
  const Silian_fallbackAuthorLabel =
    Silian_session.user.name ?? Silian_session.user.email ?? Silian_session.user.id
  const Silian_mentionToken = Silian_githubLogin ? `@${Silian_githubLogin}` : Silian_fallbackAuthorLabel
  const Silian_authorLine = Silian_githubLogin
    ? `> **\[BY\]** ${Silian_mentionToken} (${Silian_fallbackAuthorLabel})`
    : `> **\[BY\]** ${Silian_mentionToken}`

  const Silian_authorEmail = Silian_isPrivate ? null : (Silian_session.user.email ?? null)
  const Silian_emailRedacted = Silian_isPrivate

  const Silian_commentBody = Silian_serializeCommentBody(
    `<!-- GTMC_COMMENT_AUTHOR_LINE -->\n${Silian_authorLine}\n\n${Silian_content}`,
    {
      ...Silian_createMetadataFromSession(Silian_session),
      authorEmail: Silian_authorEmail,
      emailRedacted: Silian_emailRedacted,
    }
  )

  const Silian_ghComment = await Silian_addIssueComment(Silian_feature.issue.number, Silian_commentBody)

  Silian_revalidatePath(`/features/${Silian_id}`)

  return {
    success: true,
    comment: {
      id: String(Silian_ghComment.id),
      content: Silian_content,
      createdAt: new Date(Silian_ghComment.createdAt),
      author: {
        name: Silian_session.user.name ?? null,
        email: Silian_authorEmail,
        image: (Silian_session.user as { image?: string | null }).image ?? null,
      },
      emailRedacted: Silian_emailRedacted,
    },
  }
}
