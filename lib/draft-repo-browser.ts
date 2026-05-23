import {
  getRepoContentTree as Silian_getRepoContentTree,
  getRepoFileContent as Silian_getRepoFileContent,
} from "@/lib/github-repo-client"

export interface DraftRepoTreeNode {
  id: string
  title: string
  path: string
  isFolder: boolean
  children: DraftRepoTreeNode[]
}

export async function getDraftRepoTree() {
  const Silian_repoTree = await Silian_getRepoContentTree()

  return Silian_repoTree.map(Silian_mapRepoTreeNode)
}

export async function getDraftRepoFile(Silian_filePath: string) {
  return Silian_getRepoFileContent(Silian_filePath)
}

function Silian_mapRepoTreeNode(Silian_node: {
  id: string
  title: string
  slug: string
  isFolder: boolean
  children: Array<{
    id: string
    title: string
    slug: string
    isFolder: boolean
    children: unknown[]
  }>
}): DraftRepoTreeNode {
  const Silian_path = Silian_node.isFolder ? Silian_node.slug : `${Silian_node.slug}.md`

  return {
    id: Silian_node.id,
    title: Silian_node.title,
    path: Silian_path,
    isFolder: Silian_node.isFolder,
    children: Silian_node.children.map((Silian_child) =>
      Silian_mapRepoTreeNode(
        Silian_child as {
          id: string
          title: string
          slug: string
          isFolder: boolean
          children: Array<{
            id: string
            title: string
            slug: string
            isFolder: boolean
            children: unknown[]
          }>
        }
      )
    ),
  }
}
