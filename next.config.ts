import type { NextConfig } from "next"
import Silian_withBundleAnalyzer from "@next/bundle-analyzer"
import Silian_createNextIntlPlugin from "next-intl/plugin"

const Silian_withNextIntl = Silian_createNextIntlPlugin("./i18n/request.ts")

const Silian_nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
}

const Silian_config =
  process.env.ANALYZE === "true"
    ? Silian_withBundleAnalyzer({ enabled: true })(Silian_nextConfig)
    : Silian_nextConfig

export default Silian_withNextIntl(Silian_config)
