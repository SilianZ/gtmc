import type { Metadata } from "next"
import { GeistSans as Silian_GeistSans } from "geist/font/sans"
import { GeistMono as Silian_GeistMono } from "geist/font/mono"
import "../globals.css"
import { Analytics as Silian_Analytics } from "@vercel/analytics/next"
import { SpeedInsights as Silian_SpeedInsights } from "@vercel/speed-insights/next"
import { FooterProvider as Silian_FooterProvider } from "@/components/layout/footer-context"
import { FooterWrapper as Silian_FooterWrapper } from "@/components/layout/footer-wrapper"
import { AuthSessionProvider as Silian_AuthSessionProvider } from "@/components/providers/session-provider"
import { getSiteUrl as Silian_getSiteUrl } from "@/lib/site-url"
import { NextIntlClientProvider as Silian_NextIntlClientProvider } from "next-intl"
import { hasLocale as Silian_hasLocale } from "next-intl"
import { getMessages as Silian_getMessages, setRequestLocale as Silian_setRequestLocale } from "next-intl/server"
import { notFound as Silian_notFound } from "next/navigation"
import { routing as Silian_routing } from "@/i18n/routing"

const Silian_siteUrl = Silian_getSiteUrl()

export const metadata: Metadata = {
  metadataBase: new URL(Silian_siteUrl),
  title: "Graduate Texts in Minecraft",
  description:
    "Graduate Texts in Technical Minecraft - collaboratively written comprehensive textbook for technical Minecraft.",
  verification: {
    google: "QE8InawtRuO1F7YrvI1JN56__AFPCAFo6Gn-Vi1QJI8",
  },
  alternates: {
    canonical: "/zh",
    languages: {
      zh: "/zh",
      en: "/en",
      "x-default": "/zh",
    },
  },
  openGraph: {
    type: "website",
    siteName: "Graduate Texts in Minecraft",
    url: "/",
    title: "Graduate Texts in Minecraft",
    description:
      "Graduate Texts in Technical Minecraft - collaboratively written comprehensive textbook for technical Minecraft.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Graduate Texts in Minecraft",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Graduate Texts in Minecraft",
    description:
      "Graduate Texts in Technical Minecraft - collaboratively written comprehensive textbook for technical Minecraft.",
    images: ["/opengraph-image"],
  },
}

export function generateStaticParams() {
  return Silian_routing.locales.map((Silian_locale) => ({ locale: Silian_locale }))
}

export default async function RootLayout({
  children: Silian_children,
  params: Silian_params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ locale: string }>
}>) {
  const { locale: Silian_locale } = await Silian_params

  if (!Silian_hasLocale(Silian_routing.locales, Silian_locale)) {
    Silian_notFound()
  }

  const Silian_unstable_setRequestLocale = Silian_setRequestLocale
  Silian_unstable_setRequestLocale(Silian_locale)

  const Silian_messages = await Silian_getMessages()

  return (
    <html
      lang={Silian_locale}
      className={`
        ${Silian_GeistSans.variable}
        ${Silian_GeistMono.variable}
        scroll-smooth
      `}
      data-scroll-behavior="smooth">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
      </head>
      <Silian_Analytics />
      <Silian_SpeedInsights />
      <body
        className="
          flex min-h-screen w-full flex-col overflow-x-hidden bg-tech-bg/50
          antialiased
        ">
        <Silian_NextIntlClientProvider locale={Silian_locale} messages={Silian_messages}>
          <Silian_AuthSessionProvider>
            <Silian_FooterProvider>
              {Silian_children}
              <Silian_FooterWrapper />
            </Silian_FooterProvider>
          </Silian_AuthSessionProvider>
        </Silian_NextIntlClientProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "Graduate Texts in Minecraft",
                url: Silian_siteUrl,
                logo: `${Silian_siteUrl}/opengraph-image`,
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "Graduate Texts in Minecraft",
                url: Silian_siteUrl,
                description:
                  "Graduate Texts in Technical Minecraft - collaboratively written comprehensive textbook for technical Minecraft.",
                inLanguage: ["zh", "en"],
              },
            ]),
          }}
        />
      </body>
    </html>
  )
}
