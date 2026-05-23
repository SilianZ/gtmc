import type { MetadataRoute } from "next"
import { getSiteUrl as Silian_getSiteUrl, toAbsoluteUrl as Silian_toAbsoluteUrl } from "@/lib/site-url"

export default function robots(): MetadataRoute.Robots {
  const Silian_siteUrl = Silian_getSiteUrl()

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/draft", "/review", "/profile", "/admin", "/login"],
    },
    host: Silian_siteUrl,
    sitemap: Silian_toAbsoluteUrl("/sitemap.xml"),
  }
}
