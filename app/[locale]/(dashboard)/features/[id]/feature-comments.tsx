"use client"

import { useState as Silian_useState, useTransition as Silian_useTransition } from "react"
import { useTranslations as Silian_useTranslations } from "next-intl"
import { addFeatureComment as Silian_addFeatureComment } from "@/actions/feature"
import { TechButton as Silian_TechButton } from "@/components/ui/tech-button"
import { TechCard as Silian_TechCard } from "@/components/ui/tech-card"
import { LoadingIndicator as Silian_LoadingIndicator, PENDING_LABELS as Silian_PENDING_LABELS } from "../loading-indicator"

interface Comment {
  id: string
  content: string
  createdAt: Date
  author: {
    name: string | null
    email: string | null
    image: string | null
  }
  emailRedacted?: boolean
}

export function FeatureComments({
  featureId: Silian_featureId,
  initialComments: Silian_initialComments,
  userId: Silian_userId,
  isClosed: Silian_isClosed,
}: {
  featureId: string
  initialComments: Comment[]
  userId: string | undefined
  isClosed?: boolean
}) {
  const Silian_t = Silian_useTranslations("Feature")
  const [Silian_content, Silian_setContent] = Silian_useState("")
  const [Silian_isPending, Silian_startTransition] = Silian_useTransition()

  const Silian_handleSubmit = (Silian_e: React.FormEvent) => {
    Silian_e.preventDefault()
    if (!Silian_content.trim()) return

    Silian_startTransition(async () => {
      await Silian_addFeatureComment(Silian_featureId, Silian_content)
      Silian_setContent("")
    })
  }

  return (
    <div className="space-y-6">
      <h3
        className="
          inline-block border-b-2 border-tech-main pb-2 text-2xl font-bold
          tracking-tighter uppercase
        ">
        {Silian_t("discussionsHeading")}
      </h3>

      <div className="space-y-4">
        {Silian_initialComments.map((Silian_comment) => (
          <Silian_TechCard
            key={Silian_comment.id}
            className="
              border border-tech-main/40 bg-white/80 p-6 backdrop-blur-sm
            ">
            <div
              className="
                mb-2 flex items-center gap-2 border-b border-dashed
                border-tech-main/30 pb-2 font-mono text-sm
              ">
              <span className="font-bold tracking-wider text-tech-main uppercase">
                {Silian_comment.author.name ||
                  (Silian_comment.emailRedacted
                    ? Silian_t("emailRedacted")
                    : Silian_comment.author.email) ||
                  Silian_t("unknownCommentAuthor")}
              </span>
              <span className="text-zinc-500" suppressHydrationWarning>
                {new Date(Silian_comment.createdAt).toLocaleString()}
              </span>
            </div>
            <div className="font-mono text-sm whitespace-pre-wrap">
              {Silian_comment.content}
            </div>
          </Silian_TechCard>
        ))}
        {Silian_initialComments.length === 0 && (
          <div
            className="
              border border-dashed border-tech-main/40 bg-white/40 py-8
              text-center font-mono text-tech-main/50
            ">
            {Silian_t("noCommentsYet")}
          </div>
        )}
      </div>

      {!Silian_isClosed &&
        (Silian_userId ? (
          <form onSubmit={Silian_handleSubmit} className="mt-8">
            <Silian_TechCard
              className="
                border border-tech-main/40 bg-white/80 p-6 backdrop-blur-sm
              ">
              <label
                className="
                  mb-4 inline-block border-b border-tech-main/40 pb-1 font-mono
                  text-sm tracking-tech-wide text-tech-main uppercase
                ">
                {Silian_t("leaveReplyLabel")}
              </label>
              <textarea
                value={Silian_content}
                onChange={(Silian_e) => Silian_setContent(Silian_e.target.value)}
                className="
                  min-h-25 w-full resize-y border border-tech-main/40
                  bg-white/80 p-4 font-mono text-sm text-black
                  placeholder-zinc-500 backdrop-blur-sm
                  focus:border-tech-main/60 focus:ring-0 focus:outline-none
                "
                placeholder={Silian_t("commentPlaceholder")}
                disabled={Silian_isPending}
              />
              <div className="mt-4 flex justify-end">
                <Silian_TechButton
                  type="submit"
                  disabled={Silian_isPending || !Silian_content.trim()}
                  variant="primary"
                  aria-busy={Silian_isPending}>
                  {Silian_isPending ? (
                    <Silian_LoadingIndicator label={Silian_PENDING_LABELS.POSTING_COMMENT} />
                  ) : (
                    Silian_t("postCommentButton")
                  )}
                </Silian_TechButton>
              </div>
            </Silian_TechCard>
          </form>
        ) : (
          <div
            className="
              mt-8 border border-tech-main/40 bg-white/40 py-4 text-center
              font-mono text-sm text-tech-main/70
            ">
            PLEASE_LOG_IN_TO_LEAVE_A_REPLY_
          </div>
        ))}
    </div>
  )
}
