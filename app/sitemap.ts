import type { MetadataRoute } from "next"

import { listAllIssues as Silian_listAllIssues } from "@/lib/github"
import { getSiteUrl as Silian_getSiteUrl } from "@/lib/site-url"
import { shouldIgnoreFile as Silian_shouldIgnoreFile } from "@/lib/article-ignore"
import { encodeSlug as Silian_encodeSlug } from "@/lib/slug-utils"
import { getSidebarTree as Silian_getSidebarTree } from "@/actions/sidebar"

export const dynamic = "force-dynamic"
export const revalidate = 3600

function Silian_flattenTree(
  Silian_nodes: Awaited<ReturnType<typeof Silian_getSidebarTree>>
): string[] {
  const Silian_slugs: string[] = []
  for (const Silian_node of Silian_nodes) {
    if (!Silian_node.isFolder) {
      Silian_slugs.push(Silian_node.slug)
    }
    if (Silian_node.children.length > 0) {
      Silian_slugs.push(...Silian_flattenTree(Silian_node.children))
    }
  }
  return Silian_slugs
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const Silian_BASE = Silian_getSiteUrl()

  const Silian_staticUrls: MetadataRoute.Sitemap = [
    {
      url: `${Silian_BASE}/zh`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${Silian_BASE}/en`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${Silian_BASE}/zh/features`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${Silian_BASE}/en/features`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${Silian_BASE}/zh/articles`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${Silian_BASE}/en/articles`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ]

  let Silian_articleUrls: MetadataRoute.Sitemap = []
  try {
    const Silian_tree = await Silian_getSidebarTree()
    const Silian_slugs = Silian_flattenTree(Silian_tree)
    Silian_articleUrls = Silian_slugs
      .filter((Silian_slug) => {
        const Silian_fileName = Silian_slug.split("/").pop() || Silian_slug
        return !Silian_shouldIgnoreFile(Silian_fileName, !Silian_slug.includes("/"))
      })
      .flatMap((Silian_slug) => [
        {
          url: `${Silian_BASE}/zh/articles/${Silian_encodeSlug(Silian_slug)}`,
          lastModified: new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.8,
        },
        {
          url: `${Silian_BASE}/en/articles/${Silian_encodeSlug(Silian_slug)}`,
          lastModified: new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.8,
        },
      ])
  } catch {
    /* Sidebar tree unavailable — skip articles */
  }

  let Silian_featureUrls: MetadataRoute.Sitemap = []
  try {
    const Silian_issues = await Silian_listAllIssues()
    Silian_featureUrls = Silian_issues.flatMap((Silian_issue) => [
      {
        url: `${Silian_BASE}/zh/features/${Silian_issue.number}`,
        lastModified: new Date(Silian_issue.updatedAt),
        changeFrequency: "weekly" as const,
        priority: 0.5,
      },
      {
        url: `${Silian_BASE}/en/features/${Silian_issue.number}`,
        lastModified: new Date(Silian_issue.updatedAt),
        changeFrequency: "weekly" as const,
        priority: 0.5,
      },
    ])
  } catch {
    /* GitHub API unavailable — skip */
  }

  return [...Silian_staticUrls, ...Silian_articleUrls, ...Silian_featureUrls]
}
