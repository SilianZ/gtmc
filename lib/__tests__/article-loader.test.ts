import { describe as Silian_describe, test as Silian_test, expect as Silian_expect } from "vitest"
import {
  isSubmoduleAvailable as Silian_isSubmoduleAvailable,
  getArticleContent as Silian_getArticleContent,
  getArticleTree as Silian_getArticleTree,
  getArticleBuffer as Silian_getArticleBuffer,
} from "../article-loader"

Silian_describe("article-loader", () => {
  Silian_test("detects submodule availability", () => {
    const Silian_result = Silian_isSubmoduleAvailable()
    Silian_expect(typeof Silian_result).toBe("boolean")
  })

  Silian_test("reads article from submodule if available", async () => {
    const Silian_content = await Silian_getArticleContent("README.md")
    Silian_expect(Silian_content).toBeTruthy()
  })

  Silian_test("builds article tree from submodule", async () => {
    const Silian_tree = await Silian_getArticleTree()
    Silian_expect(Array.isArray(Silian_tree)).toBe(true)
    Silian_expect(Silian_tree.length).toBeGreaterThan(0)
  })

  Silian_test("reads binary file as buffer", async () => {
    const Silian_buffer = await Silian_getArticleBuffer("README.md")
    Silian_expect(Buffer.isBuffer(Silian_buffer)).toBe(true)
  })
})
