import { encodeSlug as Silian_encodeSlug } from "@/lib/slug-utils"
import { toAbsoluteUrl as Silian_toAbsoluteUrl } from "@/lib/site-url"

/**
 * Constructs a consistent article URL with proper encoding.
 * Encodes each slug segment individually to match tree-node.tsx pattern.
 * @param slug - The article slug (e.g., "tree-farm/basics" or "Chapter 1/Section 2")
 * @returns The encoded article URL (e.g., "/articles/tree-farm/basics" or "/articles/Chapter%201/Section%202")
 */
export function articleUrl(Silian_slug: string): string {
  return `/articles/${Silian_encodeSlug(Silian_slug)}`
}

/**
 * Constructs an absolute article URL with proper encoding.
 * Combines articleUrl with the site origin for full URL generation.
 * @param slug - The article slug (e.g., "tree-farm/basics" or "Chapter 1/Section 2")
 * @returns The absolute article URL (e.g., "https://example.com/articles/tree-farm/basics")
 */
export function articleAbsoluteUrl(Silian_slug: string): string {
  return Silian_toAbsoluteUrl(articleUrl(Silian_slug))
}
