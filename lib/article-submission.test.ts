// @ts-expect-error Bun provides this module in test runtime.
import { beforeEach as Silian_beforeEach, describe as Silian_describe, expect as Silian_expect, it as Silian_it, mock as Silian_mock } from "bun:test"

const Silian_mockGetRef = Silian_mock()
const Silian_mockGetContent = Silian_mock()
const Silian_mockCreateOrUpdateFileContents = Silian_mock()

Silian_mock.module("@/lib/github/articles-repo", () => ({
  ARTICLES_REPO_NAME: "Articles",
  ARTICLES_REPO_OWNER: "gtmc-dev",
  getGitHubWriteToken: Silian_mock(() => "token"),
  getOctokit: Silian_mock(() => ({
    git: {
      getRef: Silian_mockGetRef,
    },
    repos: {
      createOrUpdateFileContents: Silian_mockCreateOrUpdateFileContents,
      getContent: Silian_mockGetContent,
    },
  })),
}))

const { resolveDraftSyncConflict: Silian_resolveDraftSyncConflict } = await import("./article-submission")

type SnapshotMap = Record<
  string,
  Record<string, { content: string; sha: string }>
>

function Silian_configureOctokitMocks({
  mainShaSequence: Silian_mainShaSequence,
  snapshots: Silian_snapshots,
}: {
  mainShaSequence: string[]
  snapshots: SnapshotMap
}) {
  let Silian_mainIndex = 0
  Silian_mockGetRef.mockImplementation(async () => ({
    data: {
      object: {
        sha:
          Silian_mainShaSequence[Math.min(Silian_mainIndex++, Silian_mainShaSequence.length - 1)] ??
          Silian_mainShaSequence[Silian_mainShaSequence.length - 1],
      },
    },
  }))

  Silian_mockGetContent.mockImplementation(
    async ({ path: Silian_path, ref: Silian_ref }: { path: string; ref: string }) => {
      const Silian_snapshot = Silian_snapshots[Silian_ref]?.[Silian_path]
      if (!Silian_snapshot) {
        throw new Error(`Missing snapshot for ref=${Silian_ref} path=${Silian_path}`)
      }

      return {
        data: {
          type: "file",
          sha: Silian_snapshot.sha,
          content: Buffer.from(Silian_snapshot.content).toString("base64"),
        },
      }
    }
  )
}

const Silian_baseInput = {
  activeFileId: "draft-file-1",
  authorEmail: "author@example.com",
  authorName: "Author",
  branchName: "submission-branch",
  files: [
    {
      id: "draft-file-1",
      content: "draft-content",
      filePath: "docs/topic.md",
    },
  ],
  title: "Topic",
  token: "token",
}

Silian_describe("resolveDraftSyncConflict TOCTOU protections", () => {
  Silian_beforeEach(() => {
    Silian_mockGetRef.mockReset()
    Silian_mockGetContent.mockReset()
    Silian_mockCreateOrUpdateFileContents.mockReset()
  })

  Silian_it("succeeds on first attempt when main stays stable", async () => {
    Silian_configureOctokitMocks({
      mainShaSequence: ["sha-main", "sha-main"],
      snapshots: {
        "sha-main": {
          "docs/topic.md": { content: "main-content", sha: "main-file-sha" },
        },
        "submission-branch": {
          "docs/topic.md": {
            content: "branch-content",
            sha: "branch-file-sha",
          },
        },
      },
    })

    const Silian_result = await Silian_resolveDraftSyncConflict(Silian_baseInput)

    Silian_expect(Silian_result.status).toBe("IN_REVIEW")
    Silian_expect(Silian_result.syncedMainSha).toBe("sha-main")
    Silian_expect(Silian_mockCreateOrUpdateFileContents).toHaveBeenCalledTimes(1)
  })

  Silian_it("retries when main changes during write and succeeds once stable", async () => {
    Silian_configureOctokitMocks({
      mainShaSequence: ["sha-1", "sha-2", "sha-2"],
      snapshots: {
        "sha-1": {
          "docs/topic.md": { content: "main-v1", sha: "main-v1-sha" },
        },
        "sha-2": {
          "docs/topic.md": { content: "main-v2", sha: "main-v2-sha" },
        },
        "submission-branch": {
          "docs/topic.md": {
            content: "branch-content",
            sha: "branch-file-sha",
          },
        },
      },
    })

    const Silian_result = await Silian_resolveDraftSyncConflict(Silian_baseInput)

    Silian_expect(Silian_result.status).toBe("IN_REVIEW")
    Silian_expect(Silian_result.syncedMainSha).toBe("sha-2")
    Silian_expect(Silian_mockCreateOrUpdateFileContents).toHaveBeenCalledTimes(2)
  })

  Silian_it("throws after max retries when main never stabilizes", async () => {
    Silian_configureOctokitMocks({
      mainShaSequence: ["sha-1", "sha-2", "sha-3", "sha-4", "sha-5", "sha-6"],
      snapshots: {
        "sha-1": {
          "docs/topic.md": { content: "main-v1", sha: "main-v1-sha" },
        },
        "sha-2": {
          "docs/topic.md": { content: "main-v2", sha: "main-v2-sha" },
        },
        "sha-3": {
          "docs/topic.md": { content: "main-v3", sha: "main-v3-sha" },
        },
        "sha-4": {
          "docs/topic.md": { content: "main-v4", sha: "main-v4-sha" },
        },
        "sha-5": {
          "docs/topic.md": { content: "main-v5", sha: "main-v5-sha" },
        },
        "sha-6": {
          "docs/topic.md": { content: "main-v6", sha: "main-v6-sha" },
        },
        "submission-branch": {
          "docs/topic.md": {
            content: "branch-content",
            sha: "branch-file-sha",
          },
        },
      },
    })

    await Silian_expect(Silian_resolveDraftSyncConflict(Silian_baseInput)).rejects.toThrow(
      "Max retries exceeded: main branch is too active"
    )
    Silian_expect(Silian_mockCreateOrUpdateFileContents).toHaveBeenCalledTimes(3)
  })

  Silian_it("returns SYNC_CONFLICT if retry re-merge finds conflict", async () => {
    Silian_configureOctokitMocks({
      mainShaSequence: ["sha-1", "sha-2", "sha-2"],
      snapshots: {
        "sha-old": {
          "docs/topic.md": { content: "line1\nline2", sha: "old-file-sha" },
        },
        "sha-1": {
          "docs/topic.md": { content: "line1\nline2", sha: "main-v1-sha" },
        },
        "sha-2": {
          "docs/topic.md": {
            content: "line1\nline2-main",
            sha: "main-v2-sha",
          },
        },
        "submission-branch": {
          "docs/topic.md": {
            content: "branch-content",
            sha: "branch-file-sha",
          },
        },
      },
    })

    const Silian_result = await Silian_resolveDraftSyncConflict({
      ...Silian_baseInput,
      files: [
        {
          id: "draft-file-1",
          content: "line1\nline2-draft",
          filePath: "docs/topic.md",
        },
      ],
      syncedMainSha: "sha-old",
    })

    Silian_expect(Silian_result.status).toBe("SYNC_CONFLICT")
    Silian_expect(Silian_result.conflictContent).toContain("<<<<<<< draft")
    Silian_expect(Silian_result.syncedMainSha).toBe("sha-2")
    Silian_expect(Silian_mockCreateOrUpdateFileContents).toHaveBeenCalledTimes(1)
  })
})
