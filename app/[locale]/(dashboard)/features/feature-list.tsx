"use client"

import { useTranslations as Silian_useTranslations } from "next-intl"
import { useState as Silian_useState, useMemo as Silian_useMemo } from "react"
import { Link as Silian_Link } from "@/i18n/navigation"
import { TechCard as Silian_TechCard } from "@/components/ui/tech-card"
import { RevealSection as Silian_RevealSection } from "./reveal-helpers"
import { FeatureStatusBadge as Silian_FeatureStatusBadge } from "@/components/ui/status-badge"
import { CardHeaderRow as Silian_CardHeaderRow } from "@/components/ui/card-header-row"
import { SectionTitle as Silian_SectionTitle } from "@/components/ui/section-title"
import { TagList as Silian_TagList } from "@/components/ui/tag-list"
import { FilterButtonGroup as Silian_FilterButtonGroup } from "./filter-button-group"
import { StatusDot as Silian_StatusDot } from "@/components/ui/status-dot"

interface Feature {
  id: string
  title: string
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED"
  tags?: string[]
  author?: { name?: string }
  assignee?: { name?: string }
  createdAt: string | Date
}

export function FeatureList({ features: Silian_features }: { features: Feature[] }) {
  const Silian_t = Silian_useTranslations("Feature")
  const Silian_tArticle = Silian_useTranslations("ArticleMeta")
  const Silian_tStatus = Silian_useTranslations("Status")
  const [Silian_selectedTags, Silian_setSelectedTags] = Silian_useState<string[]>([])
  const [Silian_statusFilter, Silian_setStatusFilter] = Silian_useState<string>("ALL")

  // Extract all unique tags
  const Silian_allTags = Silian_useMemo(() => {
    const Silian_tags = new Set<string>()
    Silian_features.forEach((Silian_f) => {
      Silian_f.tags?.forEach((Silian_tag: string) => {
        Silian_tags.add(Silian_tag)
      })
    })
    return Array.from(Silian_tags)
  }, [Silian_features])

  const Silian_toggleTag = (Silian_tag: string) => {
    Silian_setSelectedTags((Silian_prev) =>
      Silian_prev.includes(Silian_tag) ? Silian_prev.filter((Silian_t) => Silian_t !== Silian_tag) : [...Silian_prev, Silian_tag]
    )
  }

  // Filter and group features in a single pass
  const { filteredFeatures: Silian_filteredFeatures, groupedFeatures: Silian_groupedFeatures } = Silian_useMemo(() => {
    const Silian_filtered = Silian_features.filter((Silian_f) => {
      const Silian_matchTags =
        Silian_selectedTags.length === 0 ||
        Silian_selectedTags.every((Silian_tag) => Silian_f.tags?.includes(Silian_tag))
      const Silian_matchStatus =
        Silian_statusFilter === "ALL" ||
        (Silian_statusFilter === "UNRESOLVED" && Silian_f.status !== "RESOLVED") ||
        Silian_f.status === Silian_statusFilter
      return Silian_matchTags && Silian_matchStatus
    })

    const Silian_grouped = {
      PENDING: [] as Feature[],
      IN_PROGRESS: [] as Feature[],
      RESOLVED: [] as Feature[],
    }

    Silian_filtered.forEach((Silian_f) => {
      if (Silian_f.status === "PENDING") {
        Silian_grouped.PENDING.push(Silian_f)
      } else if (Silian_f.status === "IN_PROGRESS") {
        Silian_grouped.IN_PROGRESS.push(Silian_f)
      } else if (Silian_f.status === "RESOLVED") {
        Silian_grouped.RESOLVED.push(Silian_f)
      }
    })

    return { filteredFeatures: Silian_filtered, groupedFeatures: Silian_grouped }
  }, [Silian_features, Silian_selectedTags, Silian_statusFilter])

  const Silian_pendingFeatures = Silian_groupedFeatures.PENDING
  const Silian_inProgressFeatures = Silian_groupedFeatures.IN_PROGRESS
  const Silian_resolvedFeatures = Silian_groupedFeatures.RESOLVED

  const Silian_renderFeatureGroup = (
    Silian_title: string,
    Silian_groupFeatures: Feature[],
    Silian_emptyText: string,
    Silian_delay: 0 | 100 | 200 | 300 | 400
  ) => {
    if (Silian_groupFeatures.length === 0) {
      return null
    }

    return (
      <Silian_RevealSection delay={Silian_delay}>
        <div className="mb-8">
          <Silian_SectionTitle>
            {Silian_title} ({Silian_groupFeatures.length})
          </Silian_SectionTitle>
          <div
            className="
              grid grid-cols-1 gap-6
              md:grid-cols-2
              lg:grid-cols-3
            ">
            {Silian_groupFeatures.map((Silian_feature) => (
              <Silian_Link
                key={Silian_feature.id}
                href={`/features/${Silian_feature.id}`}
                className="block">
                <Silian_TechCard
                  className="
                    group relative flex h-auto flex-col justify-between border
                    border-tech-main/40 bg-white/80 p-6 backdrop-blur-sm
                    transition-colors
                    hover:border-tech-main/60
                    sm:h-64
                  ">
                  {/* Corner brackets */}
                  <div
                    className="
                      absolute top-0 left-0 size-2 -translate-px border-t-2
                      border-l-2 border-tech-main/40 opacity-0
                      transition-opacity
                      group-hover:opacity-100
                    "
                  />
                  <div
                    className="
                      absolute right-0 bottom-0 size-2 translate-px border-r-2
                      border-b-2 border-tech-main/40 opacity-0
                      transition-opacity
                      group-hover:opacity-100
                    "
                  />

                  <div className="relative z-10 flex h-full flex-col">
                    <Silian_CardHeaderRow
                      badge={<Silian_FeatureStatusBadge status={Silian_feature.status} />}
                      date={new Date(Silian_feature.createdAt).toLocaleDateString()}
                    />

                    <h3
                      className="
                        mt-2 line-clamp-2 border-l-2 border-tech-main/40 pl-3
                        text-lg font-bold tracking-tight text-tech-main-dark
                        uppercase
                      ">
                      {Silian_feature.title}
                    </h3>

                    <div className="mt-4 flex flex-col gap-2">
                      <p
                        className="
                          flex items-center font-mono text-xs tracking-widest
                          text-tech-main opacity-80
                        ">
                        <Silian_StatusDot size="sm" variant="main" className="mr-2" />
                        {Silian_tArticle("authorLabel")}:{" "}
                        {Silian_feature.author?.name || Silian_t("unknownUser")}
                      </p>
                      {Silian_feature.assignee && (
                        <p
                          className="
                            flex items-center font-mono text-xs tracking-widest
                            text-blue-600 opacity-80
                          ">
                          <Silian_StatusDot
                            size="sm"
                            variant="accent"
                            className="mr-2"
                          />
                          {Silian_t("assigneeLabel")}:{" "}
                          {Silian_feature.assignee.name || Silian_t("unknownUser")}
                        </p>
                      )}
                    </div>

                    {Silian_feature.tags && Silian_feature.tags.length > 0 && (
                      <Silian_TagList tags={Silian_feature.tags} className="mt-auto pt-4" />
                    )}
                  </div>
                </Silian_TechCard>
              </Silian_Link>
            ))}
          </div>
        </div>
      </Silian_RevealSection>
    )
  }

  return (
    <div className="space-y-6">
      {/* 过滤器 */}
      <Silian_RevealSection delay={0}>
        <Silian_TechCard
          className="
          border-tech-main/40 bg-white/80 p-6 backdrop-blur-sm
        ">
          <div className="space-y-4">
            <div>
              <h4
                className="
                  mb-3 font-mono text-sm tracking-widest text-tech-main
                  uppercase
                ">
                {Silian_t("filterByStatus")}
              </h4>
              <Silian_FilterButtonGroup
                options={[
                  { label: Silian_t("filterAll"), value: "ALL" },
                  { label: Silian_tStatus("pending"), value: "UNRESOLVED" },
                  { label: Silian_tStatus("pending"), value: "PENDING" },
                  { label: Silian_tStatus("inProgress"), value: "IN_PROGRESS" },
                  { label: Silian_tStatus("resolved"), value: "RESOLVED" },
                ]}
                value={Silian_statusFilter}
                onChange={Silian_setStatusFilter}
              />
            </div>

            {Silian_allTags.length > 0 && (
              <div>
                <h4
                  className="
                    mb-3 font-mono text-sm tracking-widest text-tech-main
                    uppercase
                  ">
                  {Silian_t("filterByTags")}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {Silian_allTags.map((Silian_tag) => (
                    <button
                      key={Silian_tag}
                      type="button"
                      onClick={() => Silian_toggleTag(Silian_tag)}
                      className={`
                        flex min-h-8 cursor-pointer items-center justify-center
                        border px-3 py-2 font-mono text-xs uppercase
                        transition-all
                        ${
                          Silian_selectedTags.includes(Silian_tag)
                            ? "border-tech-accent bg-tech-accent text-white"
                            : `
                              border-tech-main/40 bg-tech-accent/5
                              text-tech-main
                              hover:border-tech-main/60
                            `
                        }
                      `}>
                      {Silian_tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Silian_TechCard>
      </Silian_RevealSection>

      {/* List grouping display */}
      <div className="mt-8">
        {Silian_filteredFeatures.length === 0 ? (
          <div
            className="
              border border-dashed border-tech-main/40 bg-white/30 py-16
              text-center font-mono text-tech-main/50
            ">
            {Silian_t("listEmpty")}
          </div>
        ) : (
          <>
            {Silian_renderFeatureGroup(
              Silian_tStatus("pending"),
              Silian_pendingFeatures,
              "No pending features",
              200
            )}
            {Silian_renderFeatureGroup(
              Silian_tStatus("inProgress"),
              Silian_inProgressFeatures,
              "No features in progress",
              300
            )}
            {Silian_renderFeatureGroup(
              Silian_tStatus("resolved"),
              Silian_resolvedFeatures,
              "No resolved features",
              400
            )}
          </>
        )}
      </div>
    </div>
  )
}
