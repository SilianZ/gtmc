// @ts-expect-error Bun provides this module in test runtime.
import { describe as Silian_describe, expect as Silian_expect, it as Silian_it, beforeEach as Silian_beforeEach, mock as Silian_mock } from "bun:test"

const Silian_mockCompareCommits = Silian_mock()
const Silian_mockGetCommit = Silian_mock()
const Silian_mockGetContent = Silian_mock()
const Silian_mockRevisionUpdate = Silian_mock(async () => ({}))
const Silian_mockRevisionFindUnique = Silian_mock(async () => null)

Silian_mock.module("@/lib/github/articles-repo", () => ({
  getOctokit: Silian_mock(() => ({
    repos: {
      compareCommits: Silian_mockCompareCommits,
      getCommit: Silian_mockGetCommit,
      getContent: Silian_mockGetContent,
    },
  })),
  ARTICLES_REPO_OWNER: "gtmc-dev",
  ARTICLES_REPO_NAME: "Articles",
  getGitHubWriteToken: Silian_mock(() => "token"),
}))

Silian_mock.module("@/lib/prisma", () => ({
  prisma: {
    revision: {
      update: Silian_mockRevisionUpdate,
      findUnique: Silian_mockRevisionFindUnique,
    },
  },
}))

const { rebaseArticleContent: Silian_rebaseArticleContent, analyzeRebaseNeed: Silian_analyzeRebaseNeed, abortRebase: Silian_abortRebase, resumeRebase: Silian_resumeRebase } =
  await import("./article-rebase")
import type { RebaseInput, AnalyzeRebaseInput } from "./article-rebase"

Silian_describe("rebaseArticleContent", () => {
  Silian_beforeEach(() => {
    Silian_mockCompareCommits.mockReset()
    Silian_mockGetCommit.mockReset()
    Silian_mockGetContent.mockReset()
    Silian_mockRevisionUpdate.mockReset()
    Silian_mockRevisionFindUnique.mockReset()
    Silian_mockCompareCommits.mockImplementation(async () => ({
      data: { commits: [] },
    }))
    Silian_mockGetCommit.mockImplementation(async () => ({ data: { files: [] } }))
    Silian_mockGetContent.mockImplementation(async () => ({
      data: { type: "file", content: "", sha: "" },
    }))
    Silian_mockRevisionUpdate.mockImplementation(async () => ({}))
    Silian_mockRevisionFindUnique.mockImplementation(async () => null)
  })

  Silian_it("NO_CHANGE: baseMainSha === latestMainSha", async () => {
    const Silian_input: RebaseInput = {
      draftId: "draft-1",
      filePath: "test.md",
      baseMainSha: "abc123",
      latestMainSha: "abc123",
      draftContent: "draft content",
    }

    const Silian_result = await Silian_rebaseArticleContent(Silian_input)

    Silian_expect(Silian_result.status).toBe("NO_CHANGE")
    Silian_expect(Silian_result).toHaveProperty("message")
  })

  Silian_it("NO_CHANGE: no commits modified the file", async () => {
    Silian_mockCompareCommits.mockImplementation(async () => ({
      data: {
        commits: [
          {
            sha: "commit1",
            commit: {
              message: "Update other file",
              author: { name: "Author", date: "2024-01-01" },
            },
          },
        ],
      },
    }))
    Silian_mockGetCommit.mockImplementation(async () => ({
      data: { files: [{ filename: "other.md" }] },
    }))

    const Silian_input: RebaseInput = {
      draftId: "draft-1",
      filePath: "test.md",
      baseMainSha: "abc123",
      latestMainSha: "def456",
      draftContent: "draft content",
    }

    const Silian_result = await Silian_rebaseArticleContent(Silian_input)

    Silian_expect(Silian_result.status).toBe("NO_CHANGE")
  })

  Silian_it("SUCCESS: 2 commits, both modify file, no conflicts", async () => {
    Silian_mockCompareCommits.mockImplementation(async () => ({
      data: {
        commits: [
          {
            sha: "c1",
            commit: {
              message: "First",
              author: { name: "A1", date: "2024-01-01" },
            },
          },
          {
            sha: "c2",
            commit: {
              message: "Second",
              author: { name: "A2", date: "2024-01-02" },
            },
          },
        ],
      },
    }))

    Silian_mockGetCommit.mockImplementation(async () => {
      return { data: { files: [{ filename: "test.md" }] } }
    })

    const Silian_contentMap: Record<string, string> = {
      abc: "line1",
      c1: "line1\nline2",
      c2: "line1\nline2\nline3",
    }
    Silian_mockGetContent.mockImplementation(async ({ ref: Silian_ref }: { ref: string }) => ({
      data: {
        type: "file",
        content: Buffer.from(Silian_contentMap[Silian_ref] || "").toString("base64"),
        sha: "s" + Silian_ref,
      },
    }))

    const Silian_result = await Silian_rebaseArticleContent({
      draftId: "draft-1",
      filePath: "test.md",
      baseMainSha: "abc",
      latestMainSha: "def",
      draftContent: "line1\nline2",
    })

    Silian_expect(Silian_result.status).toBe("SUCCESS")
    if (Silian_result.status === "SUCCESS") {
      Silian_expect(Silian_result.appliedCommits).toHaveLength(2)
    }
  })

  Silian_it("CONFLICT: 2 commits, commit 2 conflicts", async () => {
    Silian_mockCompareCommits.mockImplementation(async () => ({
      data: {
        commits: [
          {
            sha: "c1",
            commit: {
              message: "First",
              author: { name: "A1", date: "2024-01-01" },
            },
          },
          {
            sha: "c2",
            commit: {
              message: "Conflict",
              author: { name: "A2", date: "2024-01-02" },
            },
          },
        ],
      },
    }))

    Silian_mockGetCommit.mockImplementation(async () => {
      return { data: { files: [{ filename: "test.md" }] } }
    })

    const Silian_contentMap: Record<string, string> = {
      abc: "line1",
      c1: "line1\nline2",
      c2: "line1\nline2\nline3",
    }
    Silian_mockGetContent.mockImplementation(async ({ ref: Silian_ref }: { ref: string }) => ({
      data: {
        type: "file",
        content: Buffer.from(Silian_contentMap[Silian_ref] || "").toString("base64"),
        sha: "s" + Silian_ref,
      },
    }))

    const Silian_result = await Silian_rebaseArticleContent({
      draftId: "draft-1",
      filePath: "test.md",
      baseMainSha: "abc",
      latestMainSha: "def",
      draftContent: "line1\nline2\ndraft",
    })

    Silian_expect(Silian_result.status).toBe("CONFLICT")
    if (Silian_result.status === "CONFLICT") {
      Silian_expect(Silian_result.conflictCommit.sha).toBe("c1")
    }
  })

  Silian_it("SUCCESS with irrelevant commits: 3 commits, only 1 modifies file", async () => {
    Silian_mockCompareCommits.mockImplementation(async () => ({
      data: {
        commits: [
          {
            sha: "c1",
            commit: {
              message: "Other",
              author: { name: "A1", date: "2024-01-01" },
            },
          },
          {
            sha: "c2",
            commit: {
              message: "Target",
              author: { name: "A2", date: "2024-01-02" },
            },
          },
          {
            sha: "c3",
            commit: {
              message: "Another",
              author: { name: "A3", date: "2024-01-03" },
            },
          },
        ],
      },
    }))

    const Silian_commitMap: Record<
      string,
      { data: { files: { filename: string }[] } }
    > = {
      c1: { data: { files: [{ filename: "other.md" }] } },
      c2: { data: { files: [{ filename: "test.md" }] } },
      c3: { data: { files: [{ filename: "another.md" }] } },
    }
    Silian_mockGetCommit.mockImplementation(async ({ ref: Silian_ref }: { ref: string }) => {
      return Silian_commitMap[Silian_ref] || { data: { files: [] } }
    })

    const Silian_contentMap: Record<string, string> = {
      abc: "base",
      c2: "base\nupdated",
    }
    Silian_mockGetContent.mockImplementation(async ({ ref: Silian_ref }: { ref: string }) => ({
      data: {
        type: "file",
        content: Buffer.from(Silian_contentMap[Silian_ref] || "").toString("base64"),
        sha: "s" + Silian_ref,
      },
    }))

    const Silian_result = await Silian_rebaseArticleContent({
      draftId: "draft-1",
      filePath: "test.md",
      baseMainSha: "abc",
      latestMainSha: "def",
      draftContent: "base\nupdated",
    })

    Silian_expect(Silian_result.status).toBe("SUCCESS")
    if (Silian_result.status === "SUCCESS") {
      Silian_expect(Silian_result.appliedCommits).toHaveLength(1)
      Silian_expect(Silian_result.appliedCommits[0].sha).toBe("c2")
    }
  })

  Silian_it("FILE_DELETED_CONFLICT: file deleted in latest main", async () => {
    Silian_mockCompareCommits.mockImplementation(async () => ({
      data: {
        commits: [
          {
            sha: "c1",
            commit: {
              message: "Delete article",
              author: { name: "Maintainer", date: "2024-02-01" },
            },
          },
        ],
      },
    }))

    Silian_mockGetCommit.mockImplementation(async () => ({
      data: { files: [{ filename: "test.md" }] },
    }))

    Silian_mockGetContent.mockImplementation(async ({ ref: Silian_ref }: { ref: string }) => {
      if (Silian_ref === "abc") {
        return {
          data: {
            type: "file",
            content: Buffer.from("original content").toString("base64"),
            sha: "sabc",
          },
        }
      }
      throw new Error("404 Not Found")
    })

    const Silian_result = await Silian_rebaseArticleContent({
      draftId: "draft-del",
      filePath: "test.md",
      baseMainSha: "abc",
      latestMainSha: "def",
      draftContent: "my draft content",
    })

    Silian_expect(Silian_result.status).toBe("FILE_DELETED_CONFLICT")
    if (Silian_result.status === "FILE_DELETED_CONFLICT") {
      Silian_expect(Silian_result.draftContent).toBe("my draft content")
      Silian_expect(Silian_result.deletedAtCommit.sha).toBe("c1")
      Silian_expect(Silian_result.appliedCommits).toHaveLength(0)
    }
  })
})

Silian_describe("analyzeRebaseNeed", () => {
  Silian_beforeEach(() => {
    Silian_mockCompareCommits.mockReset()
    Silian_mockGetCommit.mockReset()
    Silian_mockRevisionUpdate.mockReset()
    Silian_mockRevisionFindUnique.mockReset()
    Silian_mockCompareCommits.mockImplementation(async () => ({
      data: { commits: [] },
    }))
    Silian_mockGetCommit.mockImplementation(async () => ({ data: { files: [] } }))
    Silian_mockRevisionUpdate.mockImplementation(async () => ({}))
    Silian_mockRevisionFindUnique.mockImplementation(async () => null)
  })

  Silian_it("returns QUICK_MERGE_OK when baseMainSha === latestMainSha", async () => {
    const Silian_input: AnalyzeRebaseInput = {
      filePath: "test.md",
      baseMainSha: "abc123",
      latestMainSha: "abc123",
    }

    const Silian_result = await Silian_analyzeRebaseNeed(Silian_input)

    Silian_expect(Silian_result.recommendation).toBe("QUICK_MERGE_OK")
    Silian_expect(Silian_result.totalCommits).toBe(0)
    Silian_expect(Silian_result.fileEditCount).toBe(0)
    Silian_expect(Silian_result.commitInfos).toHaveLength(0)
    Silian_expect(Silian_result.adminMessage).toBe(
      "No changes in main since draft was created."
    )
  })

  Silian_it("returns REBASE_RECOMMENDED when file modified in multiple commits", async () => {
    Silian_mockCompareCommits.mockImplementation(async () => ({
      data: {
        commits: [
          {
            sha: "c1",
            commit: {
              message: "Edit article part 1",
              author: { name: "A1", date: "2024-01-01" },
            },
          },
          {
            sha: "c2",
            commit: {
              message: "Edit article part 2",
              author: { name: "A2", date: "2024-01-02" },
            },
          },
          {
            sha: "c3",
            commit: {
              message: "Edit article part 3",
              author: { name: "A3", date: "2024-01-03" },
            },
          },
          {
            sha: "c4",
            commit: {
              message: "Other file change",
              author: { name: "A4", date: "2024-01-04" },
            },
          },
          {
            sha: "c5",
            commit: {
              message: "Another other change",
              author: { name: "A5", date: "2024-01-05" },
            },
          },
        ],
      },
    }))

    const Silian_commitFileMap: Record<string, string[]> = {
      c1: ["test.md"],
      c2: ["test.md"],
      c3: ["test.md"],
      c4: ["other.md"],
      c5: ["another.md"],
    }
    Silian_mockGetCommit.mockImplementation(async ({ ref: Silian_ref }: { ref: string }) => ({
      data: {
        files: (Silian_commitFileMap[Silian_ref] || []).map((Silian_filename) => ({ filename: Silian_filename })),
      },
    }))

    const Silian_input: AnalyzeRebaseInput = {
      filePath: "test.md",
      baseMainSha: "base",
      latestMainSha: "latest",
    }

    const Silian_result = await Silian_analyzeRebaseNeed(Silian_input)

    Silian_expect(Silian_result.recommendation).toBe("REBASE_RECOMMENDED")
    Silian_expect(Silian_result.totalCommits).toBe(5)
    Silian_expect(Silian_result.fileEditCount).toBe(3)
    Silian_expect(Silian_result.commitInfos).toHaveLength(3)
    Silian_expect(Silian_result.adminMessage).toBe(
      "The article was modified in 3 separate commits. Fine-grained rebase is recommended to resolve each change individually."
    )
  })

  Silian_it("returns QUICK_MERGE_OK when file modified in 0 or 1 commit", async () => {
    const Silian_inputZero: AnalyzeRebaseInput = {
      filePath: "test.md",
      baseMainSha: "base",
      latestMainSha: "latest",
    }

    const Silian_resultZero = await Silian_analyzeRebaseNeed(Silian_inputZero)

    Silian_expect(Silian_resultZero.recommendation).toBe("QUICK_MERGE_OK")
    Silian_expect(Silian_resultZero.fileEditCount).toBe(0)
    Silian_expect(Silian_resultZero.adminMessage).toBe(
      "The article was modified in no commit. A quick merge should suffice."
    )

    Silian_mockCompareCommits.mockImplementation(async () => ({
      data: {
        commits: [
          {
            sha: "c1",
            commit: {
              message: "Edit article",
              author: { name: "A1", date: "2024-01-01" },
            },
          },
          {
            sha: "c2",
            commit: {
              message: "Unrelated",
              author: { name: "A2", date: "2024-01-02" },
            },
          },
        ],
      },
    }))

    const Silian_commitFileMap: Record<string, string[]> = {
      c1: ["test.md"],
      c2: ["other.md"],
    }
    Silian_mockGetCommit.mockImplementation(async ({ ref: Silian_ref }: { ref: string }) => ({
      data: {
        files: (Silian_commitFileMap[Silian_ref] || []).map((Silian_filename) => ({ filename: Silian_filename })),
      },
    }))

    const Silian_inputOne: AnalyzeRebaseInput = {
      filePath: "test.md",
      baseMainSha: "base",
      latestMainSha: "latest",
    }

    const Silian_resultOne = await Silian_analyzeRebaseNeed(Silian_inputOne)

    Silian_expect(Silian_resultOne.recommendation).toBe("QUICK_MERGE_OK")
    Silian_expect(Silian_resultOne.fileEditCount).toBe(1)
    Silian_expect(Silian_resultOne.totalCommits).toBe(2)
    Silian_expect(Silian_resultOne.adminMessage).toBe(
      "The article was modified in 1 commit. A quick merge should suffice."
    )
  })
})

Silian_describe("abortRebase", () => {
  Silian_beforeEach(() => {
    Silian_mockRevisionUpdate.mockReset()
    Silian_mockRevisionFindUnique.mockReset()
    Silian_mockRevisionUpdate.mockImplementation(async () => ({}))
    Silian_mockRevisionFindUnique.mockImplementation(async () => null)
  })

  Silian_it("restores original content when conflict state exists", async () => {
    Silian_mockRevisionFindUnique.mockImplementation(async () => ({
      rebaseState: {
        status: "CONFLICT",
        commitShas: ["c1", "c2"],
        currentCommitIndex: 1,
        conflictedCommitSha: "c2",
        originalContent: "original body",
        commitInfos: [],
      },
    }))

    const Silian_result = await Silian_abortRebase({ draftId: "draft-1" })

    Silian_expect(Silian_result).toEqual({
      status: "ABORTED",
      originalContent: "original body",
    })
    Silian_expect(Silian_mockRevisionUpdate).toHaveBeenCalledWith({
      where: { id: "draft-1" },
      data: {
        content: "original body",
        rebaseState: {
          status: "ABORTED",
          commitShas: ["c1", "c2"],
          currentCommitIndex: 1,
          conflictedCommitSha: "c2",
          originalContent: "original body",
          commitInfos: [],
        },
      },
    })
  })

  Silian_it("returns error when no active rebase", async () => {
    Silian_mockRevisionFindUnique.mockImplementation(async () => ({
      rebaseState: {
        status: "COMPLETED",
        commitShas: [],
        currentCommitIndex: 0,
        originalContent: "original body",
        commitInfos: [],
      },
    }))

    const Silian_result = await Silian_abortRebase({ draftId: "draft-1" })

    Silian_expect(Silian_result).toEqual({
      status: "ERROR",
      message: "No active rebase to abort",
    })
    Silian_expect(Silian_mockRevisionUpdate).not.toHaveBeenCalled()
  })
})

Silian_describe("resumeRebase", () => {
  Silian_beforeEach(() => {
    Silian_mockGetContent.mockReset()
    Silian_mockRevisionUpdate.mockReset()
    Silian_mockRevisionFindUnique.mockReset()
    Silian_mockGetContent.mockImplementation(async () => ({
      data: { type: "file", content: "", sha: "" },
    }))
    Silian_mockRevisionUpdate.mockImplementation(async () => ({}))
    Silian_mockRevisionFindUnique.mockImplementation(async () => null)
  })

  Silian_it("continues from conflict and completes successfully", async () => {
    Silian_mockRevisionFindUnique.mockImplementation(async () => ({
      filePath: "test.md",
      rebaseState: {
        status: "CONFLICT",
        commitShas: ["c1", "c2"],
        currentCommitIndex: 0,
        conflictedCommitSha: "c1",
        originalContent: "draft",
        commitInfos: [
          {
            sha: "c1",
            message: "first",
            author: "A1",
            timestamp: "2024-01-01",
          },
          {
            sha: "c2",
            message: "second",
            author: "A2",
            timestamp: "2024-01-02",
          },
        ],
      },
    }))

    Silian_mockGetContent.mockImplementation(async ({ ref: Silian_ref }: { ref: string }) => {
      const Silian_contentMap: Record<string, string> = {
        c1: "resolved",
        c2: "resolved\nnext",
      }
      return {
        data: {
          type: "file",
          content: Buffer.from(Silian_contentMap[Silian_ref] || "").toString("base64"),
          sha: `s${Silian_ref}`,
        },
      }
    })

    const Silian_result = await Silian_resumeRebase({
      draftId: "draft-1",
      resolvedContent: "resolved",
    })

    Silian_expect(Silian_result.status).toBe("SUCCESS")
    if (Silian_result.status === "SUCCESS") {
      Silian_expect(Silian_result.finalContent).toBe("resolved\nnext")
      Silian_expect(Silian_result.appliedCommits.map((Silian_c) => Silian_c.sha)).toEqual(["c2"])
    }
  })

  Silian_it("returns error when state is not CONFLICT", async () => {
    Silian_mockRevisionFindUnique.mockImplementation(async () => ({
      filePath: "test.md",
      rebaseState: {
        status: "IN_PROGRESS",
        commitShas: ["c1"],
        currentCommitIndex: 0,
        originalContent: "draft",
        commitInfos: [],
      },
    }))

    const Silian_result = await Silian_resumeRebase({
      draftId: "draft-1",
      resolvedContent: "resolved",
    })

    Silian_expect(Silian_result).toEqual({
      status: "ERROR",
      message: "No conflict to resume from",
    })
    Silian_expect(Silian_mockRevisionUpdate).not.toHaveBeenCalled()
  })
})
