import { auth as Silian_auth } from "@/lib/auth"
import { getGithubPatForUser as Silian_getGithubPatForUser } from "@/lib/auth-context"
import { getMainBranchHeadSha as Silian_getMainBranchHeadSha } from "@/lib/article-submission"
import { getRepoFileContent as Silian_getRepoFileContent } from "@/lib/github/sync"
import { prisma as Silian_prisma } from "@/lib/prisma"
import { redirect as Silian_redirect } from "next/navigation"

export default async function NewDraftPage({
  searchParams: Silian_searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const Silian_session = await Silian_auth()
  if (!Silian_session?.user?.id) {
    Silian_redirect("/login")
  }

  const { file: Silian_fileParam } = await Silian_searchParams
  const Silian_filePath = typeof Silian_fileParam === "string" ? Silian_fileParam : undefined

  let Silian_initialTitle = "UNTITLED"
  let Silian_initialContent = ""
  const Silian_normalizedFilePath = Silian_filePath

  if (Silian_filePath) {
    Silian_initialTitle = Silian_filePath
    const Silian_normalizedPath = Silian_filePath.replace(/^\/+/, "")
    const Silian_candidates = Silian_normalizedPath.endsWith(".md")
      ? [Silian_normalizedPath]
      : [Silian_normalizedPath, `${Silian_normalizedPath}.md`]

    for (const Silian_candidate of Silian_candidates) {
      const Silian_content = await Silian_getRepoFileContent(Silian_candidate)
      if (Silian_content !== null) {
        Silian_initialContent = Silian_content
        break
      }
    }

    if (!Silian_initialContent) {
      Silian_initialContent = ""
    }
  }

  const Silian_token =
    (await Silian_getGithubPatForUser(Silian_session.user.id)) ?? process.env.GITHUB_TOKEN
  const Silian_baseMainSha = await Silian_getMainBranchHeadSha(Silian_token)
  const Silian_createData = {
    author: { connect: { id: Silian_session.user.id } },
    baseMainSha: Silian_baseMainSha,
    content: Silian_initialContent,
    filePath: Silian_normalizedFilePath,
    status: "DRAFT",
    syncedMainSha: Silian_baseMainSha,
    title: Silian_initialTitle,
  }
  const Silian_draft = await Silian_prisma.revision.create({
    data: Silian_createData,
  })

  Silian_redirect(`/draft/${Silian_draft.id}`)
}
