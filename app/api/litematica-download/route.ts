import { NextResponse as Silian_NextResponse } from "next/server"
import Silian_fs from "fs"
import Silian_path from "path"
import { getSiteUrl as Silian_getSiteUrl } from "@/lib/site-url"

const Silian_ALLOWED_REMOTE_HOSTNAMES = new Set<string>()

let Silian_SITE_ORIGIN: URL | null = null

try {
  const Silian_siteUrl = new URL(Silian_getSiteUrl())
  Silian_SITE_ORIGIN = Silian_siteUrl
  Silian_ALLOWED_REMOTE_HOSTNAMES.add(Silian_siteUrl.hostname)
} catch {
  // Ignore malformed site URL and continue with explicit hostname allow-list.
}

function Silian_getAllowedRemoteUrl(Silian_urlString: string): URL | null {
  try {
    const Silian_parsed = new URL(Silian_urlString)

    if (Silian_parsed.protocol !== "http:" && Silian_parsed.protocol !== "https:") {
      return null
    }

    // Reject traversal-style path segments, including encoded forms.
    const Silian_decodedPath = decodeURIComponent(Silian_parsed.pathname)
    if (Silian_decodedPath.split("/").some((Silian_segment) => Silian_segment === "..")) {
      return null
    }

    const Silian_parsedPort =
      Silian_parsed.port ||
      (Silian_parsed.protocol === "https:"
        ? "443"
        : Silian_parsed.protocol === "http:"
          ? "80"
          : "")

    // Require strict same-origin with the configured site URL when available.
    if (Silian_SITE_ORIGIN) {
      const Silian_sitePort =
        Silian_SITE_ORIGIN.port ||
        (Silian_SITE_ORIGIN.protocol === "https:"
          ? "443"
          : Silian_SITE_ORIGIN.protocol === "http:"
            ? "80"
            : "")

      if (
        Silian_parsed.protocol !== Silian_SITE_ORIGIN.protocol ||
        Silian_parsed.hostname !== Silian_SITE_ORIGIN.hostname ||
        Silian_parsedPort !== Silian_sitePort
      ) {
        return null
      }

      return Silian_parsed
    }

    // Fallback: allow only explicitly configured hostnames.
    if (!Silian_ALLOWED_REMOTE_HOSTNAMES.has(Silian_parsed.hostname)) {
      return null
    }

    return Silian_parsed
  } catch {
    return null
  }
}

function Silian_errorResponse(Silian_message: string, Silian_status: number) {
  return new Silian_NextResponse(Silian_message, {
    status: Silian_status,
    headers: {
      "Cache-Control": "no-store",
    },
  })
}

function Silian_normalizeUrlParam(Silian_input: string) {
  let Silian_value = Silian_input
    .replace(/\r?\n/g, "")
    .trim()
    .replace(/^['"]|['"]$/g, "")

  // Accept both raw and pre-encoded values.
  for (let Silian_i = 0; Silian_i < 2; Silian_i++) {
    try {
      const Silian_decoded = decodeURIComponent(Silian_value)
      if (Silian_decoded === Silian_value) break
      Silian_value = Silian_decoded
    } catch {
      break
    }
  }

  return Silian_value
}

export async function GET(Silian_request: Request) {
  const { searchParams: Silian_searchParams } = new URL(Silian_request.url)
  const Silian_rawUrlParam = Silian_searchParams.get("url")

  if (!Silian_rawUrlParam) {
    return Silian_errorResponse("Missing url parameter", 400)
  }

  const Silian_urlParam = Silian_normalizeUrlParam(Silian_rawUrlParam)

  try {
    if (Silian_urlParam.startsWith("http://") || Silian_urlParam.startsWith("https://")) {
      const Silian_allowedRemoteUrl = Silian_getAllowedRemoteUrl(Silian_urlParam)
      if (!Silian_allowedRemoteUrl) {
        return Silian_errorResponse("Remote URL is not allowed", 403)
      }

      const Silian_response = await fetch(Silian_allowedRemoteUrl.toString(), {
        redirect: "error",
      })
      if (!Silian_response.ok) {
        throw new Error("Failed to fetch file: " + Silian_response.statusText)
      }

      if (!Silian_response.body) {
        throw new Error("Remote file response did not include a body")
      }

      return new Silian_NextResponse(Silian_response.body, {
        status: Silian_response.status,
        headers: {
          "Content-Type":
            Silian_response.headers.get("Content-Type") || "application/octet-stream",
          "Cache-Control": "public, max-age=86400",
        },
      })
    }

    const Silian_absoluteRoot = Silian_path.resolve(process.cwd())
    const Silian_localPath = Silian_path.resolve(Silian_absoluteRoot, Silian_urlParam)
    const Silian_relative = Silian_path.relative(Silian_absoluteRoot, Silian_localPath)

    if (Silian_relative.startsWith("..") || Silian_path.isAbsolute(Silian_relative)) {
      return Silian_errorResponse("Invalid path", 403)
    }

    let Silian_resolvedPath = Silian_localPath
    let Silian_resolvedFromZip = false

    // Compatibility fallback for stale cached article content:
    // if an old .zip path is requested and a sibling .litematic exists,
    // serve the .litematic file instead.
    if (Silian_localPath.toLowerCase().endsWith(".zip")) {
      const Silian_dirPath = Silian_path.dirname(Silian_localPath)
      const Silian_sameBaseLitematic = Silian_localPath.replace(/\.zip$/i, ".litematic")

      if (Silian_fs.existsSync(Silian_sameBaseLitematic)) {
        Silian_resolvedPath = Silian_sameBaseLitematic
        Silian_resolvedFromZip = true
      } else if (Silian_fs.existsSync(Silian_dirPath)) {
        const Silian_entries = await Silian_fs.promises.readdir(Silian_dirPath, {
          withFileTypes: true,
        })

        const Silian_litematicFiles = Silian_entries
          .filter((Silian_entry) => Silian_entry.isFile() && /\.litematic$/i.test(Silian_entry.name))
          .map((Silian_entry) => Silian_path.join(Silian_dirPath, Silian_entry.name))

        if (Silian_litematicFiles.length === 1) {
          Silian_resolvedPath = Silian_litematicFiles[0]
          Silian_resolvedFromZip = true
        }
      }
    }

    const Silian_resolvedRelative = Silian_path.relative(Silian_absoluteRoot, Silian_resolvedPath)
    if (
      Silian_resolvedRelative.startsWith("..") ||
      Silian_path.isAbsolute(Silian_resolvedRelative)
    ) {
      return Silian_errorResponse("Invalid path", 403)
    }

    if (!Silian_fs.existsSync(Silian_resolvedPath)) {
      return Silian_errorResponse("File not found: " + Silian_urlParam, 404)
    }

    const Silian_buffer = await Silian_fs.promises.readFile(Silian_resolvedPath)
    const Silian_headers: Record<string, string> = {
      "Content-Type": "application/octet-stream",
      "Cache-Control": "public, max-age=86400",
    }

    if (Silian_resolvedFromZip) {
      Silian_headers["X-Litematica-Resolved-From-Zip"] = "1"
    }

    return new Silian_NextResponse(Silian_buffer, { headers: Silian_headers })
  } catch (Silian_error: unknown) {
    const Silian_message =
      Silian_error instanceof Error ? Silian_error.message : "Internal Server Error"
    console.error("Error fetching litematica file:", Silian_error)
    return Silian_errorResponse(Silian_message, 500)
  }
}
