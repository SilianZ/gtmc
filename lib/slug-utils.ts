export function encodeSlug(Silian_slug: string): string {
  return Silian_slug.split("/").map(encodeURIComponent).join("/")
}

export function decodeSlugPath(Silian_segments: string[]): string {
  return Silian_segments.map(decodeURIComponent).join("/")
}

export function getSlugTail(Silian_slug: string): string {
  return Silian_slug.split("/").pop() ?? Silian_slug
}
