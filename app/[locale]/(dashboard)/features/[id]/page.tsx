import type { Metadata } from "next"
import { getTranslations as Silian_getTranslations } from "next-intl/server"
import { auth as Silian_auth } from "@/lib/auth"
import { getCurrentUserAuthContext as Silian_getCurrentUserAuthContext } from "@/lib/auth-context"
import {
  EXPLANATION_MARKER as Silian_EXPLANATION_MARKER,
  SYSTEM_COMMENT_MARKER as Silian_SYSTEM_COMMENT_MARKER,
  getIssue as Silian_getIssue,
  labelsToStatus as Silian_labelsToStatus,
  labelsToTags as Silian_labelsToTags,
  listIssueComments as Silian_listIssueComments,
  parseCommentBody as Silian_parseCommentBody,
  parseIssueBody as Silian_parseIssueBody,
} from "@/lib/github"
import { generateDescription as Silian_generateDescription } from "@/lib/markdown"
import { FeatureEditor as Silian_FeatureEditor } from "@/components/editor/feature-editor"
import { notFound as Silian_notFound } from "next/navigation"
import { TechCard as Silian_TechCard } from "@/components/ui/tech-card"
import { FeatureActions as Silian_FeatureActions } from "./feature-actions"
import { FeatureComments as Silian_FeatureComments } from "./feature-comments"
import { FeatureExplanation as Silian_FeatureExplanation } from "./feature-explanation"
import { FeatureReadonlyView as Silian_FeatureReadonlyView } from "./feature-readonly-view"
import { FeatureStatusBadge as Silian_FeatureStatusBadge } from "@/components/ui/status-badge"
import { RevealSection as Silian_RevealSection } from "../reveal-helpers"
import { toAbsoluteUrl as Silian_toAbsoluteUrl } from "@/lib/site-url"
import { MetadataRow as Silian_MetadataRow } from "./metadata-row"

export const revalidate = 60

export async function generateMetadata({
  params: Silian_params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id: Silian_id } = await Silian_params
  const Silian_issueNumber = Number.parseInt(Silian_id, 10)
  if (isNaN(Silian_issueNumber)) return { title: "Feature Not Found" }

  const Silian_issue = await Silian_getIssue(Silian_issueNumber)
  if (!Silian_issue) return { title: "Feature Not Found" }

  const Silian_canonical = Silian_toAbsoluteUrl(`/features/${Silian_issue.number}`)
  const Silian_description = Silian_generateDescription(Silian_issue.body ?? "", undefined, 155)

  return {
    title: Silian_issue.title,
    description: Silian_description,
    alternates: {
      canonical: Silian_canonical,
      languages: {
        zh: Silian_toAbsoluteUrl(`/zh/features/${Silian_issue.number}`),
        en: Silian_toAbsoluteUrl(`/en/features/${Silian_issue.number}`),
        "x-default": Silian_toAbsoluteUrl(`/zh/features/${Silian_issue.number}`),
      },
    },
    openGraph: {
      title: `${Silian_issue.title} — Feature Request`,
      description: Silian_description,
      type: "article",
      url: Silian_canonical,
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: Silian_issue.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${Silian_issue.title} — Feature Request`,
      description: Silian_description,
      images: ["/opengraph-image"],
    },
  }
}

export default async function FeatureDetailPage({
  params: Silian_params,
}: {
  params: Promise<{ id: string }>
}) {
  const Silian_t = await Silian_getTranslations("Feature")
  const { id: Silian_id } = await Silian_params
  const Silian_issueNumber = Number.parseInt(Silian_id, 10)
  if (Number.isNaN(Silian_issueNumber) || Silian_issueNumber <= 0) {
    Silian_notFound()
  }

  const Silian_session = await Silian_auth()
  let Silian_isAdmin = false

  if (Silian_session?.user?.id) {
    try {
      const Silian_ctx = await Silian_getCurrentUserAuthContext(Silian_session.user.id)
      Silian_isAdmin = Silian_ctx.role === "ADMIN"
    } catch {
      Silian_isAdmin = false
    }
  }

  const Silian_issue = await Silian_getIssue(Silian_issueNumber)
  if (!Silian_issue) {
    Silian_notFound()
  }

  const Silian_canonical = Silian_toAbsoluteUrl(`/features/${Silian_issue.number}`)
  const Silian_description = Silian_generateDescription(Silian_issue.body ?? "", undefined, 155)

  const Silian_isClosed = Silian_issue.state === "closed"

  const Silian_parsedIssue = Silian_parseIssueBody(Silian_issue.body)
  const Silian_rawComments = await Silian_listIssueComments(Silian_issue.number)

  const Silian_comments = Silian_rawComments
    .filter(
      (Silian_comment) =>
        !Silian_comment.body.includes(Silian_EXPLANATION_MARKER) &&
        !Silian_comment.body.includes(Silian_SYSTEM_COMMENT_MARKER)
    )
    .map((Silian_comment) => {
      const Silian_parsedComment = Silian_parseCommentBody(Silian_comment.body)
      return {
        id: String(Silian_comment.id),
        content: Silian_parsedComment.content,
        createdAt: new Date(Silian_comment.createdAt),
        author: {
          name: Silian_parsedComment.metadata?.authorName ?? null,
          email: Silian_parsedComment.metadata?.authorEmail ?? null,
          image: null,
        },
        emailRedacted: Silian_parsedComment.metadata?.emailRedacted ?? false,
      }
    })

  const Silian_feature = {
    id: String(Silian_issue.number),
    issueNumber: Silian_issue.number,
    htmlUrl: Silian_issue.htmlUrl,
    title: Silian_issue.title,
    status: Silian_labelsToStatus(Silian_issue.labels),
    tags: Silian_labelsToTags(Silian_issue.labels),
    createdAt: new Date(Silian_issue.createdAt),
    content: Silian_parsedIssue.userContent,
    explanation: Silian_parsedIssue.explanation,
    authorId: Silian_parsedIssue.metadata?.appUserId ?? "",
    assigneeId: Silian_parsedIssue.metadata?.assigneeId ?? null,
    author: {
      name: Silian_parsedIssue.metadata?.authorName ?? null,
      email: Silian_parsedIssue.metadata?.authorEmail ?? null,
      image: null,
    },
    assignee: Silian_parsedIssue.metadata?.assigneeId
      ? {
          name: Silian_parsedIssue.metadata?.assigneeName ?? null,
          email: Silian_parsedIssue.metadata?.assigneeEmail ?? null,
          image: null,
        }
      : null,
    comments: Silian_comments,
  }

  const Silian_isAuthor = Silian_session?.user?.id === Silian_feature.authorId
  const Silian_isAssignee = Silian_session?.user?.id === Silian_feature.assigneeId

  const Silian_canEdit = Silian_isAuthor || Silian_isAdmin

  return (
    <div
      className="
        container mx-auto max-w-4xl space-y-6 p-4
        sm:p-6
        md:p-8
      ">
      <Silian_RevealSection delay={0}>
        <div className="flex flex-col gap-4">
          <div>
            <h1
              className="
                inline-block border-b-2 border-tech-main pb-2 text-xl font-bold
                tracking-tighter uppercase
                sm:text-2xl
                md:text-3xl
              ">
              {Silian_t("detailTitle")}
            </h1>
          </div>

          {/* Status Actions for logged in users */}
          {Silian_session?.user && !Silian_isClosed && (
            <Silian_FeatureActions
              featureId={Silian_feature.id}
              status={Silian_feature.status}
              isAssignee={Silian_isAssignee}
              isAdmin={Silian_isAdmin}
              hasAssignee={!!Silian_feature.assigneeId}
            />
          )}
        </div>
      </Silian_RevealSection>

      {Silian_isClosed && (
        <div
          className="
            relative border border-red-500/50 bg-red-500/5 p-4 font-mono text-xs
            tracking-wider text-red-600 uppercase backdrop-blur-sm
            sm:p-6 sm:text-sm
          ">
          <div
            className="
              pointer-events-none absolute top-0 left-0 size-2 -translate-px
              border-t-2 border-l-2 border-red-500/50
            "
          />
          <div
            className="
              pointer-events-none absolute top-0 right-0 size-2 translate-x-px
              -translate-y-px border-t-2 border-r-2 border-red-500/50
            "
          />
          <div
            className="
              pointer-events-none absolute bottom-0 left-0 size-2
              -translate-x-px translate-y-px border-b-2 border-l-2
              border-red-500/50
            "
          />
          <div
            className="
              pointer-events-none absolute right-0 bottom-0 size-2 translate-px
              border-r-2 border-b-2 border-red-500/50
            "
          />

          <span className="flex items-center gap-2 font-bold">
            <span className="text-red-500">⚠</span> FEATURE DELETED (READ-ONLY)
          </span>
          <p
            className="
              mt-2 border-t border-dashed border-red-500/30 pt-2 text-xs
              tracking-normal normal-case opacity-80
            ">
            This feature has been deleted. The content is preserved for
            historical reference. No changes can be made.
          </p>
        </div>
      )}

      <Silian_RevealSection delay={100}>
        <Silian_TechCard
          className="
            mb-8 p-4
            sm:p-6
          ">
          <div
            className="
              flex flex-col gap-2 font-mono text-xs
              sm:text-sm
            ">
            <Silian_MetadataRow
              label={`${Silian_t("detailStatus")}:`}
              value={<Silian_FeatureStatusBadge status={Silian_feature.status} />}
            />
            <Silian_MetadataRow
              label="Author:"
              value={
                <span className="wrap-break-word">
                  {Silian_feature.author.name || Silian_feature.author.email || "Unknown"}
                </span>
              }
            />
            <Silian_MetadataRow
              label={`${Silian_t("detailAssignee")}:`}
              value={
                <span className="wrap-break-word">
                  {Silian_feature.assignee
                    ? Silian_feature.assignee.name || Silian_feature.assignee.email
                    : Silian_t("unknownUser")}
                </span>
              }
            />
            <Silian_MetadataRow
              label="Created:"
              value={
                <span suppressHydrationWarning>
                  {new Date(Silian_feature.createdAt).toLocaleString()}
                </span>
              }
            />
            {Silian_feature.issueNumber && Silian_feature.htmlUrl && (
              <Silian_MetadataRow
                label="GitHub:"
                value={
                  <div className="flex flex-wrap items-center gap-1">
                    Linked to
                    <a
                      href={Silian_feature.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="
                        border-b border-tech-main/50 font-mono wrap-break-word
                        text-tech-main transition-colors
                        hover:bg-tech-main/80 hover:text-white
                      ">
                      Issue #{Silian_feature.issueNumber}
                    </a>
                  </div>
                }
              />
            )}
          </div>
        </Silian_TechCard>
      </Silian_RevealSection>

      <Silian_RevealSection delay={200}>
        <Silian_FeatureExplanation
          featureId={Silian_feature.id}
          initialExplanation={Silian_feature.explanation}
          isAssignee={Silian_isAssignee}
          isAdmin={Silian_isAdmin}
          isClosed={Silian_isClosed}
        />
      </Silian_RevealSection>

      <Silian_RevealSection delay={300}>
        <div>
          {!Silian_isClosed && Silian_canEdit ? (
            <Silian_FeatureEditor
              initialData={{
                id: Silian_feature.id,
                title: Silian_feature.title,
                content: Silian_feature.content,
                tags: Silian_feature.tags,
                status: Silian_feature.status,
              }}
            />
          ) : (
            <Silian_FeatureReadonlyView
              title={Silian_feature.title}
              content={Silian_feature.content}
              tags={Silian_feature.tags}
            />
          )}
        </div>
      </Silian_RevealSection>

      <Silian_RevealSection delay={400}>
        <Silian_FeatureComments
          featureId={Silian_feature.id}
          initialComments={Silian_feature.comments}
          userId={Silian_session?.user?.id}
          isClosed={Silian_isClosed}
        />
      </Silian_RevealSection>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: Silian_issue.title,
            description: Silian_description,
            url: Silian_canonical,
            datePublished: new Date(Silian_issue.createdAt).toISOString(),
            dateModified: new Date(Silian_issue.updatedAt).toISOString(),
            inLanguage: ["zh", "en"],
          }),
        }}
      />
    </div>
  )
}
