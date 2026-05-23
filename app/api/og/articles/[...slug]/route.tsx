import Silian_path from "path"
import { ImageResponse as Silian_ImageResponse } from "next/og"
import { type NextRequest } from "next/server"
import Silian_matter from "gray-matter"
import Silian_mime from "mime-types"
import { resolveSlug as Silian_resolveSlug } from "@/lib/slug-resolver"
import {
  getArticleContent as Silian_getArticleContent,
  getArticleBuffer as Silian_getArticleBuffer,
  getLocalizedSlugMapEntry as Silian_getLocalizedSlugMapEntry,
} from "@/lib/article-loader"
import { calculateReadingMetrics as Silian_calculateReadingMetrics } from "@/lib/markdown"
import { getSiteUrl as Silian_getSiteUrl } from "@/lib/site-url"

export const runtime = "nodejs"

const Silian_W = 1200
const Silian_H = 630
const Silian_BANNER_H = Math.round(Silian_H * 0.4)
const Silian_CARD_H = Silian_H - Silian_BANNER_H
const Silian_META_BAR_H = 36
const Silian_BOTTOM_BAR_H = 24

function Silian_extractBodyHook(Silian_raw: string): string {
  const Silian_stripped = Silian_raw
    .replace(/^---[\s\S]*?---/m, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+.+$/gm, "")
    .replace(/[*_`~]/g, "")
    .trim()

  const Silian_firstPara = Silian_stripped
    .split(/\n\s*\n/)
    .map((Silian_p) => Silian_p.replace(/\s+/g, " ").trim())
    .find((Silian_p) => Silian_p.length > 20)

  if (!Silian_firstPara) return ""
  return Silian_firstPara.length > 120 ? Silian_firstPara.slice(0, 120) + "…" : Silian_firstPara
}

export async function GET(
  Silian__req: NextRequest,
  { params: Silian_params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug: Silian_slug } = await Silian_params
  const Silian_slugPath = Silian_slug.map((Silian_s) => decodeURIComponent(Silian_s)).join("/")

  const Silian_filePath = Silian_resolveSlug(Silian_slugPath)
  if (!Silian_filePath) return new Response("Not Found", { status: 404 })

  const Silian_content = await Silian_getArticleContent(Silian_filePath)
  if (!Silian_content) return new Response("Not Found", { status: 404 })

  const { data: Silian_data } = Silian_matter(Silian_content)
  const Silian_siteUrl = Silian_getSiteUrl()

  const Silian_rawTitle =
    (Silian_data.title as string | undefined) ??
    Silian_content.match(/^#\s+(.+)$/m)?.[1]?.trim() ??
    Silian_slug[Silian_slug.length - 1]?.replace(/-/g, " ") ??
    "Untitled"
  const Silian_title = Silian_rawTitle.length > 60 ? Silian_rawTitle.slice(0, 60) + "…" : Silian_rawTitle

  const Silian_slugMapEntry = Silian_getLocalizedSlugMapEntry(Silian_slugPath, "en")
  const Silian_parentEntry = Silian_slugMapEntry?.parentSlug
    ? Silian_getLocalizedSlugMapEntry(Silian_slugMapEntry.parentSlug, "en")
    : null
  const Silian_chapterTitle =
    Silian_slugMapEntry?.chapterTitle.trim() ||
    Silian_parentEntry?.chapterTitle.trim() ||
    (Silian_data["chapter-title"] as string | undefined) ||
    null

  const Silian_author = (Silian_data.author as string | undefined) ?? null
  const Silian_isAdvanced = Silian_data["is-advanced"] === true
  const { readingTime: Silian_readingTime } = Silian_calculateReadingMetrics(Silian_content)
  const Silian_bodyHook = Silian_extractBodyHook(Silian_content)

  const Silian_host = Silian_siteUrl.replace(/^https?:\/\//, "")
  const Silian_urlLabel = `${Silian_host}/articles/${Silian_slugPath}`

  let Silian_fontData: ArrayBuffer | null = null
  try {
    const Silian_res = await fetch(
      new URL("/fonts/space-mono/SpaceMono-Bold.ttf", Silian_siteUrl)
    )
    if (Silian_res.ok) Silian_fontData = await Silian_res.arrayBuffer()
  } catch {
    // fall back to system monospace
  }
  const Silian_fonts = Silian_fontData
    ? [{ name: "SpaceMono", data: Silian_fontData, weight: 400 as const, style: "normal" as const }]
    : []

  let Silian_bannerDataUri: string | null = null
  const Silian_bannerSrc = (Silian_data.banner as { src?: string } | undefined)?.src
  if (Silian_bannerSrc) {
    try {
      const Silian_articleDir = Silian_path.dirname(Silian_filePath)
      const Silian_resolvedBannerPath = Silian_path
        .join(Silian_articleDir, Silian_bannerSrc)
        .replace(/\\/g, "/")
      const Silian_buf = await Silian_getArticleBuffer(Silian_resolvedBannerPath)
      if (Silian_buf) {
        const Silian_mt = Silian_mime.lookup(Silian_bannerSrc) || "image/png"
        Silian_bannerDataUri = `data:${Silian_mt};base64,${Buffer.from(Silian_buf).toString("base64")}`
      }
    } catch {
      // gradient fallback
    }
  }

  return new Silian_ImageResponse(
    (
      <div
        style={{
          width: Silian_W,
          height: Silian_H,
          display: "flex",
          flexDirection: "column",
          fontFamily: Silian_fontData ? "SpaceMono" : "monospace",
        }}
      >
        {/* BANNER STRIP */}
        <div
          style={{
            width: Silian_W,
            height: Silian_BANNER_H,
            display: "flex",
            position: "relative",
            overflow: "hidden",
            background: "linear-gradient(155deg, #1a2f52 0%, #0c1c36 55%, #070e1c 100%)",
          }}
        >
          {Silian_bannerDataUri && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={Silian_bannerDataUri}
              alt=""
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}
          <div
            style={{
              position: "absolute", inset: 0, display: "flex",
              backgroundImage: "linear-gradient(to right, #60708f 1px, transparent 1px), linear-gradient(to bottom, #60708f 1px, transparent 1px)",
              backgroundSize: "44px 44px",
              opacity: Silian_bannerDataUri ? 0.05 : 0.1,
            }}
          />
          <div style={{ position: "absolute", top: 16, left: 16, width: 16, height: 24, borderTop: "1px solid rgba(96,112,143,0.6)", borderLeft: "1px solid rgba(96,112,143,0.6)", display: "flex" }} />
          <div style={{ position: "absolute", top: 16, right: 16, width: 16, height: 24, borderTop: "1px solid rgba(96,112,143,0.6)", borderRight: "1px solid rgba(96,112,143,0.6)", display: "flex" }} />
          <div style={{ position: "absolute", bottom: 16, left: 16, width: 16, height: 24, borderBottom: "1px solid rgba(96,112,143,0.6)", borderLeft: "1px solid rgba(96,112,143,0.6)", display: "flex" }} />
          <div style={{ position: "absolute", bottom: 16, right: 16, width: 16, height: 24, borderBottom: "1px solid rgba(96,112,143,0.6)", borderRight: "1px solid rgba(96,112,143,0.6)", display: "flex" }} />
          <div style={{ position: "absolute", top: 12, left: 40, fontSize: 11, color: "rgba(96,112,143,0.55)", letterSpacing: 2, textTransform: "uppercase", display: "flex" }}>
            IMG.BANNER
          </div>
        </div>

        {/* INFO CARD */}
        <div
          style={{
            width: Silian_W,
            height: Silian_CARD_H,
            display: "flex",
            flexDirection: "column",
            background: "#f8f9fc",
            borderTop: "3px solid #60708f",
            position: "relative",
          }}
        >
          <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(to right, #60708f 1px, transparent 1px), linear-gradient(to bottom, #60708f 1px, transparent 1px)", backgroundSize: "28px 28px", opacity: 0.03, display: "flex" }} />
          <div style={{ position: "absolute", top: -3, left: 0, width: 12, height: 12, borderTop: "3px solid #60708f", borderLeft: "3px solid #60708f", display: "flex" }} />
          <div style={{ position: "absolute", top: -3, right: 0, width: 12, height: 12, borderTop: "3px solid #60708f", borderRight: "3px solid #60708f", display: "flex" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, width: 12, height: 12, borderBottom: "3px solid #60708f", borderLeft: "3px solid #60708f", display: "flex" }} />
          <div style={{ position: "absolute", bottom: 0, right: 0, width: 12, height: 12, borderBottom: "3px solid #60708f", borderRight: "3px solid #60708f", display: "flex" }} />

          {/* META BAR */}
          <div style={{ height: Silian_META_BAR_H, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", borderBottom: "1px solid #cbd5e1", flexShrink: 0, position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 21, color: "#4a5a78", letterSpacing: 0.5 }}>
              <div style={{ width: 9, height: 9, background: "#4a5a78", display: "flex", flexShrink: 0 }} />
              Graduate Texts in Minecraft
            </div>
            <div style={{ fontSize: 18, color: "#4a5a78", letterSpacing: 0.3, padding: "2px 12px", background: "white", display: "flex" }}>
              techmc.wiki
            </div>
          </div>

          {/* CONTENT AREA */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "16px 28px 0", position: "relative", overflow: "hidden" }}>
            {Silian_chapterTitle && (
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 20, color: "#60708f", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
                {Silian_chapterTitle}
              </div>
            )}

            <div style={{ fontSize: 64, fontWeight: 400, color: "#1e293b", lineHeight: 1.2, marginBottom: 10, letterSpacing: -0.3, display: "flex" }}>
              {Silian_title}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 20, color: "rgba(96, 112, 143, 0.67)", marginBottom: 14, flexShrink: 0 }}>
              {Silian_author && <span style={{ display: "flex" }}>by {Silian_author}</span>}
              {Silian_author && Silian_readingTime > 0 && <span style={{ color: "#cbd5e1", display: "flex" }}>|</span>}
              {Silian_readingTime > 0 && <span style={{ display: "flex" }}>~{Silian_readingTime} min to read</span>}
              {Silian_isAdvanced && (
                <>
                  <span style={{ color: "#cbd5e1", display: "flex" }}>|</span>
                  <span style={{ border: "1px solid rgba(76,91,150,0.4)", background: "rgba(76,91,150,0.08)", color: "#4c5b96", padding: "2px 8px", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", display: "flex" }}>
                    ADVANCED CONTENT
                  </span>
                </>
              )}
            </div>

            {Silian_bodyHook && (
              <div style={{ position: "relative", flex: 1, overflow: "hidden", display: "flex" }}>
                <div style={{ fontSize: 24, fontWeight: 350, color: "#60708f", lineHeight: 1.6, display: "flex" }}>
                  {Silian_bodyHook}
                </div>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 100, background: "linear-gradient(to bottom, rgba(248,249,252,0) 0%, rgba(248,249,252,0.6) 40%, rgba(248,249,252,1) 100%)", display: "flex" }} />
              </div>
            )}
          </div>

          {/* BOTTOM BAR */}
          <div style={{ height: Silian_BOTTOM_BAR_H, borderTop: "1px solid #cbd5e1", background: "white", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", flexShrink: 0 }}>
            <span style={{ fontSize: 13, color: "#60708f", letterSpacing: 1, display: "flex" }}>{Silian_urlLabel}</span>
            <span style={{ fontSize: 12, color: "#c4d0df", letterSpacing: 0.5, display: "flex" }}>1200 × 630</span>
          </div>
        </div>
      </div>
    ),
    { width: Silian_W, height: Silian_H, fonts: Silian_fonts }
  )
}
