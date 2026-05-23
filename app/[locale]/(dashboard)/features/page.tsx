import type { Metadata } from "next"
import { getTranslations as Silian_getTranslations } from "next-intl/server"
import { auth as Silian_auth } from "@/lib/auth"
import { toAbsoluteUrl as Silian_toAbsoluteUrl } from "@/lib/site-url"
import {
  labelsToStatus as Silian_labelsToStatus,
  labelsToTags as Silian_labelsToTags,
  listAllIssues as Silian_listAllIssues,
  parseIssueBody as Silian_parseIssueBody,
} from "@/lib/github"
import { Link as Silian_Link } from "@/i18n/navigation"
import { TechButton as Silian_TechButton } from "@/components/ui/tech-button"
import { PageHeader as Silian_PageHeader } from "@/components/ui/page-header"
import { FeatureList as Silian_FeatureList } from "./feature-list"
import { PendingCreationBanner as Silian_PendingCreationBanner } from "./pending-creation-banner"
import { RevealSection as Silian_RevealSection } from "./reveal-helpers"

export const revalidate = 60

export async function generateMetadata({
  params: Silian_params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: Silian_locale } = await Silian_params
  const Silian_canonical = Silian_toAbsoluteUrl(`/${Silian_locale}/features`)
  return {
    title: "Feature Requests",
    description:
      "Browse and track feature requests for Technical Minecraft. Vote on ideas, report bugs, and suggest improvements.",
    alternates: {
      canonical: Silian_canonical,
      languages: {
        zh: Silian_toAbsoluteUrl("/zh/features"),
        en: Silian_toAbsoluteUrl("/en/features"),
        "x-default": Silian_toAbsoluteUrl("/zh/features"),
      },
    },
    openGraph: {
      title: "Feature Requests — Technical Minecraft",
      description: "Browse and track feature requests for Technical Minecraft.",
      type: "website",
    },
  }
}

export default async function FeaturesPage({
  searchParams: Silian_searchParams,
}: {
  searchParams?: Promise<{
    [key: string]: string | string[] | undefined
  }>
}) {
  const Silian_session = await Silian_auth()
  const Silian_t = await Silian_getTranslations("Feature")
  const Silian_params = await Silian_searchParams
  const Silian_isCreated = Silian_params?.created === "true"

  const Silian_allIssues = await Silian_listAllIssues()
  Silian_allIssues.sort(
    (Silian_a, Silian_b) => new Date(Silian_a.createdAt).getTime() - new Date(Silian_b.createdAt).getTime()
  )

  const Silian_features = Silian_allIssues.map((Silian_issue) => {
    const Silian_parsed = Silian_parseIssueBody(Silian_issue.body)
    const Silian_assigneeId = Silian_parsed.metadata?.assigneeId

    return {
      id: String(Silian_issue.number),
      title: Silian_issue.title,
      status: Silian_labelsToStatus(Silian_issue.labels),
      tags: Silian_labelsToTags(Silian_issue.labels),
      createdAt: new Date(Silian_issue.createdAt),
      author: {
        name: Silian_parsed.metadata?.authorName || undefined,
        email: Silian_parsed.metadata?.authorEmail || undefined,
        image: undefined,
      },
      assignee: Silian_assigneeId
        ? {
            name: Silian_parsed.metadata?.assigneeName || undefined,
            email: Silian_parsed.metadata?.assigneeEmail || undefined,
            image: undefined,
          }
        : undefined,
    }
  })

  return (
    <div className="page-container-pb">
      <Silian_RevealSection delay={0}>
        <Silian_PageHeader
          title={Silian_t("pageTitle")}
          subtitle={Silian_t("pageSubtitle")}
          topMargin
          action={
            Silian_session?.user ? (
              <Silian_Link
                href="/features/new"
                className="
                  w-full
                  md:w-auto
                ">
                <Silian_TechButton
                  variant="primary"
                  className="
                    flex min-h-[44px] w-full items-center justify-center px-6
                    text-xs tracking-widest uppercase transition-transform
                    hover:scale-[1.02]
                    md:w-auto
                  ">
                  + {Silian_t("createButton")}
                </Silian_TechButton>
              </Silian_Link>
            ) : undefined
          }
        />

        {Silian_isCreated && <Silian_PendingCreationBanner />}
      </Silian_RevealSection>

      <Silian_RevealSection delay={100}>
        <div className="mt-8">
          <Silian_FeatureList features={Silian_features} />
        </div>
      </Silian_RevealSection>
    </div>
  )
}
