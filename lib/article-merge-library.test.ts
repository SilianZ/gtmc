import { describe as Silian_describe, it as Silian_it, expect as Silian_expect } from "vitest"
import { getMergeLibrary as Silian_getMergeLibrary } from "./merge-strategy"

Silian_describe("article-merge-library", () => {
  const Silian_mergeLib = Silian_getMergeLibrary()

  Silian_it("should handle clean merge with no conflicts", () => {
    const Silian_result = Silian_mergeLib.merge({
      baseContent: "line1\nline2\nline3",
      draftContent: "line1\nline2\nline3\nline4",
      latestMainContent: "line1\nline2\nline3",
    })

    Silian_expect(Silian_result.conflict).toBe(false)
    Silian_expect(Silian_result.blocks.every((Silian_b) => Silian_b.type === "ok")).toBe(true)
    Silian_expect(Silian_result.content).not.toContain("<<<<<<<")
    Silian_expect(Silian_result.content).toContain("line4")
  })

  Silian_it("should detect conflicts", () => {
    const Silian_result = Silian_mergeLib.merge({
      baseContent: "line1\nline2\nline3",
      draftContent: "line1\ndraft-change\nline3",
      latestMainContent: "line1\nmain-change\nline3",
    })

    Silian_expect(Silian_result.conflict).toBe(true)
    Silian_expect(Silian_result.blocks.some((Silian_b) => Silian_b.type === "conflict")).toBe(true)
    Silian_expect(Silian_result.content).toContain("<<<<<<<")
    Silian_expect(Silian_result.content).toContain("=======")
    Silian_expect(Silian_result.content).toContain(">>>>>>>")
  })

  Silian_it("should return structured conflict blocks", () => {
    const Silian_result = Silian_mergeLib.merge({
      baseContent: "base",
      draftContent: "draft",
      latestMainContent: "main",
    })

    Silian_expect(Silian_result.conflict).toBe(true)
    const Silian_conflictBlock = Silian_result.blocks.find((Silian_b) => Silian_b.type === "conflict")
    Silian_expect(Silian_conflictBlock).toBeDefined()
    if (Silian_conflictBlock && Silian_conflictBlock.type === "conflict") {
      Silian_expect(Silian_conflictBlock.ours).toEqual(["draft"])
      Silian_expect(Silian_conflictBlock.base).toEqual(["base"])
      Silian_expect(Silian_conflictBlock.theirs).toEqual(["main"])
    }
  })

  Silian_it("should handle identical content", () => {
    const Silian_result = Silian_mergeLib.merge({
      baseContent: "same",
      draftContent: "same",
      latestMainContent: "same",
    })

    Silian_expect(Silian_result.conflict).toBe(false)
    Silian_expect(Silian_result.content).toBe("same")
  })

  Silian_it("should use custom labels in conflict markers", () => {
    const Silian_result = Silian_mergeLib.merge({
      baseContent: "base",
      draftContent: "draft",
      latestMainContent: "main",
      labels: { draft: "OURS", main: "THEIRS" },
    })

    Silian_expect(Silian_result.content).toContain("<<<<<<< OURS")
    Silian_expect(Silian_result.content).toContain(">>>>>>> THEIRS")
  })
})
