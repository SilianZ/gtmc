import { describe as Silian_describe, expect as Silian_expect, test as Silian_test } from "vitest"

import { encodeSlug as Silian_encodeSlug, decodeSlugPath as Silian_decodeSlugPath, getSlugTail as Silian_getSlugTail } from "./slug-utils"

Silian_describe("slug-utils", () => {
  Silian_test("encodeSlug encodes each segment and preserves separators", () => {
    Silian_expect(Silian_encodeSlug("Chapter 1/Section 2")).toBe("Chapter%201/Section%202")
  })

  Silian_test("decodeSlugPath decodes segments and joins with slash", () => {
    Silian_expect(Silian_decodeSlugPath(["Chapter%201", "Section%202"])).toBe(
      "Chapter 1/Section 2"
    )
  })

  Silian_test("getSlugTail returns last segment of slug path", () => {
    Silian_expect(Silian_getSlugTail("chapter/section/article")).toBe("article")
  })
})
