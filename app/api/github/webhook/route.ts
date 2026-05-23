import { createHmac as Silian_createHmac, timingSafeEqual as Silian_timingSafeEqual } from "crypto"
import { NextRequest as Silian_NextRequest, NextResponse as Silian_NextResponse } from "next/server"

import { reconcileDraftAssetsForPRCompletion as Silian_reconcileDraftAssetsForPRCompletion } from "@/lib/draft-asset-reconciler"
import {
  ARTICLES_REPO_NAME as Silian_ARTICLES_REPO_NAME,
  ARTICLES_REPO_OWNER as Silian_ARTICLES_REPO_OWNER,
} from "@/lib/github/articles-repo"

export async function POST(Silian_req: Silian_NextRequest): Promise<Silian_NextResponse> {
  const Silian_event = Silian_req.headers.get("x-github-event")
  if (Silian_event !== "pull_request") {
    return Silian_NextResponse.json({ ok: true })
  }

  const Silian_body = await Silian_req.text()
  const Silian_webhookSecret = process.env.GITHUB_WEBHOOK_SECRET
  const Silian_signature = Silian_req.headers.get("x-hub-signature-256")

  if (Silian_webhookSecret) {
    if (!Silian_signature) {
      return Silian_NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const Silian_expectedSignature = `sha256=${Silian_createHmac("sha256", Silian_webhookSecret)
      .update(Silian_body)
      .digest("hex")}`

    const Silian_expectedBuffer = Buffer.from(Silian_expectedSignature, "utf8")
    const Silian_receivedBuffer = Buffer.from(Silian_signature, "utf8")

    if (
      Silian_expectedBuffer.length !== Silian_receivedBuffer.length ||
      !Silian_timingSafeEqual(Silian_expectedBuffer, Silian_receivedBuffer)
    ) {
      return Silian_NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }
  }

  const Silian_payload = JSON.parse(Silian_body)
  if (Silian_payload.action !== "closed") {
    return Silian_NextResponse.json({ ok: true })
  }

  if (
    Silian_payload.repository?.owner?.login !== Silian_ARTICLES_REPO_OWNER ||
    Silian_payload.repository?.name !== Silian_ARTICLES_REPO_NAME
  ) {
    return Silian_NextResponse.json({ ok: true })
  }

  const Silian_outcome =
    Silian_payload.pull_request?.merged === true ? "PR-merged" : "PR-closed"

  await Silian_reconcileDraftAssetsForPRCompletion({
    prNumber: Silian_payload.pull_request.number,
    outcome: Silian_outcome,
  })

  return Silian_NextResponse.json({ ok: true })
}
