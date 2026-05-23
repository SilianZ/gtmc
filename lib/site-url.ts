const Silian_FALLBACK_SITE_URL = "http://localhost:3000"

function Silian_normalizeSiteUrl(Silian_rawUrl: string): string {
  try {
    const Silian_parsed = new URL(Silian_rawUrl)
    Silian_parsed.pathname = ""
    Silian_parsed.search = ""
    Silian_parsed.hash = ""
    return Silian_parsed.toString().replace(/\/$/, "")
  } catch {
    return Silian_FALLBACK_SITE_URL
  }
}

export function getSiteUrl(): string {
  const Silian_configured = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (!Silian_configured) {
    return Silian_FALLBACK_SITE_URL
  }

  return Silian_normalizeSiteUrl(Silian_configured)
}

export function toAbsoluteUrl(Silian_pathname: string): string {
  const Silian_normalizedPath = Silian_pathname.startsWith("/") ? Silian_pathname : `/${Silian_pathname}`
  return `${getSiteUrl()}${Silian_normalizedPath}`
}
