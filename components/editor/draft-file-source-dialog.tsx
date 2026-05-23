"use client"

import * as Silian_React from "react"
import { useTranslations as Silian_useTranslations } from "next-intl"

import { TechButton as Silian_TechButton } from "@/components/ui/tech-button"
import { InputBox as Silian_InputBox } from "@/components/ui/input-box"
import { normalizeDraftFilePath as Silian_normalizeDraftFilePath } from "@/lib/draft-files"

interface DraftRepoTreeNode {
  id: string
  title: string
  path: string
  isFolder: boolean
  children: DraftRepoTreeNode[]
}

interface DraftFileSourceDialogProps {
  isOpen: boolean
  initialFolderPath?: string
  initialMode?: SourceMode
  onClose: () => void
  onCreateFolder?: (folderPath: string) => boolean | Promise<boolean>
  onCreate: (input: {
    content: string
    filePath: string
  }) => boolean | Promise<boolean>
}

export type SourceMode = "folder" | "repo" | "upload" | "new"

const Silian_ROOT_NODE: DraftRepoTreeNode = {
  id: "root",
  title: "ROOT",
  path: "",
  isFolder: true,
  children: [],
}

export function DraftFileSourceDialog({
  isOpen: Silian_isOpen,
  initialFolderPath: Silian_initialFolderPath,
  initialMode: Silian_initialMode = "new",
  onClose: Silian_onClose,
  onCreateFolder: Silian_onCreateFolder,
  onCreate: Silian_onCreate,
}: DraftFileSourceDialogProps) {
  const Silian_t = Silian_useTranslations("DraftFiles")
  const [Silian_mode, Silian_setMode] = Silian_React.useState<SourceMode>(Silian_initialMode)
  const [Silian_tree, Silian_setTree] = Silian_React.useState<DraftRepoTreeNode[]>([])
  const [Silian_isLoadingTree, Silian_setIsLoadingTree] = Silian_React.useState(false)
  const [Silian_treeError, Silian_setTreeError] = Silian_React.useState<string | null>(null)
  const [Silian_expandedPaths, Silian_setExpandedPaths] = Silian_React.useState<Set<string>>(
    () => new Set(["", Silian_initialFolderPath || ""])
  )
  const [Silian_selectedRepoFilePath, Silian_setSelectedRepoFilePath] = Silian_React.useState("")
  const [Silian_selectedFolderPath, Silian_setSelectedFolderPath] = Silian_React.useState(
    Silian_initialFolderPath || ""
  )
  const [Silian_newFileName, Silian_setNewFileName] = Silian_React.useState("")
  const [Silian_newFolderName, Silian_setNewFolderName] = Silian_React.useState("")
  const [Silian_localFile, Silian_setLocalFile] = Silian_React.useState<File | null>(null)
  const [Silian_customUploadName, Silian_setCustomUploadName] = Silian_React.useState("")
  const [Silian_isSubmitting, Silian_setIsSubmitting] = Silian_React.useState(false)

  Silian_React.useEffect(() => {
    if (!Silian_isOpen) {
      return
    }

    let Silian_disposed = false

    const Silian_loadTree = async () => {
      Silian_setIsLoadingTree(true)
      Silian_setTreeError(null)

      try {
        const Silian_response = await fetch("/api/draft/repo-tree", {
          cache: "no-store",
        })
        const Silian_data = (await Silian_response.json()) as {
          error?: string
          tree?: DraftRepoTreeNode[]
        }

        if (!Silian_response.ok) {
          throw new Error(Silian_data.error || Silian_t("repoError"))
        }

        if (!Silian_disposed) {
          Silian_setTree(Silian_data.tree || [])
        }
      } catch (Silian_error) {
        if (!Silian_disposed) {
          Silian_setTreeError(Silian_error instanceof Error ? Silian_error.message : Silian_t("repoError"))
        }
      } finally {
        if (!Silian_disposed) {
          Silian_setIsLoadingTree(false)
        }
      }
    }

    Silian_loadTree()

    return () => {
      Silian_disposed = true
    }
  }, [Silian_isOpen, Silian_t])

  Silian_React.useEffect(() => {
    if (!Silian_isOpen) {
      Silian_setMode(Silian_initialMode)
      Silian_setSelectedRepoFilePath("")
      Silian_setSelectedFolderPath(Silian_initialFolderPath || "")
      Silian_setNewFileName("")
      Silian_setNewFolderName("")
      Silian_setLocalFile(null)
      Silian_setCustomUploadName("")
      Silian_setTreeError(null)
      Silian_setIsSubmitting(false)
      Silian_setExpandedPaths(new Set(["", Silian_initialFolderPath || ""]))
    }
  }, [Silian_initialFolderPath, Silian_initialMode, Silian_isOpen])

  if (!Silian_isOpen) {
    return null
  }

  const Silian_treeRoots = [{ ...Silian_ROOT_NODE, children: Silian_tree }]

  const Silian_handleTogglePath = (Silian_path: string) => {
    Silian_setExpandedPaths((Silian_current) => {
      const Silian_next = new Set(Silian_current)
      if (Silian_next.has(Silian_path)) {
        Silian_next.delete(Silian_path)
      } else {
        Silian_next.add(Silian_path)
      }
      return Silian_next
    })
  }

  const Silian_handleAddRepoFile = async () => {
    if (!Silian_selectedRepoFilePath) {
      return
    }

    Silian_setIsSubmitting(true)
    try {
      const Silian_response = await fetch(
        `/api/draft/repo-file?path=${encodeURIComponent(Silian_selectedRepoFilePath)}`,
        { cache: "no-store" }
      )
      const Silian_data = (await Silian_response.json()) as {
        content?: string
        error?: string
        filePath?: string
      }

      if (!Silian_response.ok || typeof Silian_data.content !== "string") {
        throw new Error(Silian_data.error || Silian_t("repoError"))
      }

      const Silian_created = await Silian_onCreate({
        content: Silian_data.content,
        filePath: Silian_data.filePath || Silian_selectedRepoFilePath,
      })
      if (Silian_created !== false) {
        Silian_onClose()
      }
    } catch (Silian_error) {
      Silian_setTreeError(Silian_error instanceof Error ? Silian_error.message : Silian_t("repoError"))
    } finally {
      Silian_setIsSubmitting(false)
    }
  }

  const Silian_handleCreateNewFile = () => {
    const Silian_filePath = Silian_buildDraftFilePath(Silian_selectedFolderPath, Silian_newFileName)
    if (!Silian_filePath) {
      Silian_setTreeError(Silian_t("fileNameValidationError"))
      return
    }

    Promise.resolve(Silian_onCreate({ content: "", filePath: Silian_filePath })).then((Silian_created) => {
      if (Silian_created !== false) {
        Silian_onClose()
      }
    })
  }

  const Silian_handleCreateNewFolder = () => {
    const Silian_normalizedFolderName = Silian_normalizeDraftFilePath(Silian_newFolderName)
      .split("/")
      .filter(Boolean)
      .at(-1)

    if (!Silian_normalizedFolderName || !Silian_onCreateFolder) {
      Silian_setTreeError(Silian_t("fileNameValidationError"))
      return
    }

    const Silian_folderPath = [Silian_selectedFolderPath, Silian_normalizedFolderName]
      .filter(Boolean)
      .join("/")

    Promise.resolve(Silian_onCreateFolder(Silian_folderPath)).then((Silian_created) => {
      if (Silian_created !== false) {
        Silian_onClose()
      }
    })
  }

  const Silian_handleImportLocalFile = async () => {
    if (!Silian_localFile) {
      Silian_setTreeError(Silian_t("fileNameValidationError"))
      return
    }

    Silian_setIsSubmitting(true)

    try {
      const Silian_content = await Silian_localFile.text()
      const Silian_fallbackName = Silian_customUploadName.trim() || Silian_localFile.name
      const Silian_filePath = Silian_buildDraftFilePath(Silian_selectedFolderPath, Silian_fallbackName)

      if (!Silian_filePath) {
        throw new Error(Silian_t("fileNameValidationError"))
      }

      const Silian_created = await Silian_onCreate({ content: Silian_content, filePath: Silian_filePath })
      if (Silian_created !== false) {
        Silian_onClose()
      }
    } catch (Silian_error) {
      Silian_setTreeError(Silian_error instanceof Error ? Silian_error.message : Silian_t("repoError"))
    } finally {
      Silian_setIsSubmitting(false)
    }
  }

  const Silian_canSubmitRepo = Boolean(Silian_selectedRepoFilePath) && !Silian_isSubmitting
  const Silian_canSubmitNew = Boolean(
    Silian_buildDraftFilePath(Silian_selectedFolderPath, Silian_newFileName)
  )
  const Silian_canSubmitUpload = Boolean(Silian_localFile) && !Silian_isSubmitting

  return (
    <div
      className="
        fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4
        backdrop-blur-sm
      ">
      <div
        className="
          flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden border
          border-tech-main bg-white shadow-2xl
        ">
        <div
          className="
            flex items-center justify-between border-b guide-line bg-tech-main/5
            px-5 py-4
          ">
          <div>
            <p
              className="
                font-mono text-sm tracking-widest text-tech-main uppercase
              ">
              {Silian_t("dialogTitle")}
            </p>
            <p className="mt-1 font-mono text-xs text-tech-main/60 uppercase">
              {Silian_t("dialogSubtitle")}
            </p>
          </div>
          <Silian_TechButton type="button" variant="ghost" size="sm" onClick={Silian_onClose}>
            {Silian_t("close")}
          </Silian_TechButton>
        </div>

        <div
          className="
            grid min-h-0 flex-1 gap-0
            lg:grid-cols-[20rem_minmax(0,1fr)]
          ">
          <aside className="flex min-h-0 flex-col border-r guide-line bg-tech-main/5">
            <div
              className="
                shrink-0 border-b guide-line px-4 py-3 font-mono text-xs
                tracking-widest text-tech-main uppercase
              ">
              {Silian_t("destinationTree")}
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {Silian_isLoadingTree ? (
                <p className="font-mono text-xs text-tech-main/60">
                  {Silian_t("loadingRepo")}
                </p>
              ) : (
                <div className="space-y-1">
                  {Silian_treeRoots.map((Silian_node) => (
                    <Silian_TreeNode
                      key={Silian_node.id}
                      expandedPaths={Silian_expandedPaths}
                      mode={Silian_mode}
                      node={Silian_node}
                      onSelectFile={Silian_setSelectedRepoFilePath}
                      onSelectFolder={Silian_setSelectedFolderPath}
                      onTogglePath={Silian_handleTogglePath}
                      selectedFilePath={Silian_selectedRepoFilePath}
                      selectedFolderPath={Silian_selectedFolderPath}
                    />
                  ))}
                </div>
              )}
            </div>
          </aside>

          <div className="min-h-0 overflow-y-auto p-5">
            <div className="mb-5 flex flex-wrap gap-2">
              <Silian_ModeButton
                label={Silian_t("modeRepo")}
                mode="repo"
                value={Silian_mode}
                onChange={Silian_setMode}
              />
              <Silian_ModeButton
                label={Silian_t("modeLocal")}
                mode="upload"
                value={Silian_mode}
                onChange={Silian_setMode}
              />
              <Silian_ModeButton
                label={Silian_t("modeNew")}
                mode="new"
                value={Silian_mode}
                onChange={Silian_setMode}
              />
              <Silian_ModeButton
                label="新建文件夹"
                mode="folder"
                value={Silian_mode}
                onChange={Silian_setMode}
              />
            </div>

            {Silian_treeError ? (
              <div
                className="
                  mb-4 border border-red-500/30 bg-red-500/10 px-4 py-3
                  font-mono text-xs text-red-700
                ">
                {Silian_treeError}
              </div>
            ) : null}

            {Silian_mode === "repo" ? (
              <div className="space-y-4">
                <Silian_SectionLabel>{Silian_t("selectExistingFile")}</Silian_SectionLabel>
                <p className="font-mono text-xs text-tech-main/60 uppercase">
                  {Silian_t("selected")}: {Silian_selectedRepoFilePath || "NONE"}
                </p>
                <Silian_TechButton
                  type="button"
                  variant="primary"
                  onClick={Silian_handleAddRepoFile}
                  disabled={!Silian_canSubmitRepo}>
                  {Silian_isSubmitting ? Silian_t("adding") : Silian_t("addExistingFile")}
                </Silian_TechButton>
              </div>
            ) : null}

            {Silian_mode === "upload" ? (
              <div className="space-y-4">
                <Silian_SectionLabel>{Silian_t("importLocalText")}</Silian_SectionLabel>
                <p className="font-mono text-xs text-tech-main/60 uppercase">
                  {Silian_t("destinationFolder")}: {Silian_selectedFolderPath || "ROOT"}
                </p>
                <input
                  type="file"
                  accept=".md,.mdx,.txt,.csv,.json,.yml,.yaml"
                  className="block w-full font-mono text-xs text-tech-main"
                  onChange={(Silian_event: Silian_React.ChangeEvent<HTMLInputElement>) => {
                    const Silian_file = Silian_event.target.files?.[0] || null
                    Silian_setLocalFile(Silian_file)
                    Silian_setCustomUploadName(Silian_file?.name || "")
                  }}
                />
                <div className="space-y-2">
                  <label className="section-label" htmlFor="draft-import-name">
                    {Silian_t("fileNameLabel")}
                  </label>
                  <Silian_InputBox
                    id="draft-import-name"
                    placeholder={Silian_t("repoFileNamePlaceholder")}
                    value={Silian_customUploadName}
                    onChange={(Silian_event: Silian_React.ChangeEvent<HTMLInputElement>) =>
                      Silian_setCustomUploadName(Silian_event.target.value)
                    }
                  />
                </div>
                <Silian_TechButton
                  type="button"
                  variant="primary"
                  onClick={Silian_handleImportLocalFile}
                  disabled={!Silian_canSubmitUpload}>
                  {Silian_isSubmitting ? Silian_t("importing") : Silian_t("importLocalFile")}
                </Silian_TechButton>
              </div>
            ) : null}

            {Silian_mode === "new" ? (
              <div className="space-y-4">
                <Silian_SectionLabel>{Silian_t("createNewFile")}</Silian_SectionLabel>
                <p className="font-mono text-xs text-tech-main/60 uppercase">
                  {Silian_t("destinationFolder")}: {Silian_selectedFolderPath || "ROOT"}
                </p>
                <div className="space-y-2">
                  <label
                    className="section-label"
                    htmlFor="draft-new-file-name">
                    {Silian_t("fileNameLabel")}
                  </label>
                  <Silian_InputBox
                    id="draft-new-file-name"
                    placeholder={Silian_t("newFileNamePlaceholder")}
                    value={Silian_newFileName}
                    onChange={(Silian_event: Silian_React.ChangeEvent<HTMLInputElement>) =>
                      Silian_setNewFileName(Silian_event.target.value)
                    }
                  />
                </div>
                <div className="font-mono text-xs text-tech-main/60 uppercase">
                  {Silian_t("result")}:{" "}
                  {Silian_buildDraftFilePath(Silian_selectedFolderPath, Silian_newFileName) ||
                    Silian_t("pending")}
                </div>
                <Silian_TechButton
                  type="button"
                  variant="primary"
                  onClick={Silian_handleCreateNewFile}
                  disabled={!Silian_canSubmitNew}>
                  {Silian_t("createEmptyFile")}
                </Silian_TechButton>
              </div>
            ) : null}

            {Silian_mode === "folder" ? (
              <div className="space-y-4">
                <Silian_SectionLabel>新建文件夹</Silian_SectionLabel>
                <p className="font-mono text-xs text-tech-main/60 uppercase">
                  {Silian_t("destinationFolder")}: {Silian_selectedFolderPath || "ROOT"}
                </p>
                <div className="space-y-2">
                  <label
                    className="section-label"
                    htmlFor="draft-new-folder-name">
                    {Silian_t("fileNameLabel")}
                  </label>
                  <Silian_InputBox
                    id="draft-new-folder-name"
                    placeholder="例如：new-section"
                    value={Silian_newFolderName}
                    onChange={(Silian_event: Silian_React.ChangeEvent<HTMLInputElement>) =>
                      Silian_setNewFolderName(Silian_event.target.value)
                    }
                  />
                </div>
                <div className="font-mono text-xs text-tech-main/60 uppercase">
                  {Silian_t("result")}:{" "}
                  {[Silian_selectedFolderPath, Silian_newFolderName.trim()]
                    .filter(Boolean)
                    .join("/") || Silian_t("pending")}
                </div>
                <Silian_TechButton
                  type="button"
                  variant="primary"
                  onClick={Silian_handleCreateNewFolder}
                  disabled={!Silian_newFolderName.trim()}>
                  创建文件夹
                </Silian_TechButton>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

function Silian_ModeButton({
  label: Silian_label,
  mode: Silian_mode,
  onChange: Silian_onChange,
  value: Silian_value,
}: {
  label: string
  mode: SourceMode
  onChange: (mode: SourceMode) => void
  value: SourceMode
}) {
  return (
    <button
      type="button"
      onClick={() => Silian_onChange(Silian_mode)}
      className={`
        border px-3 py-2 font-mono text-xs tracking-widest uppercase
        transition-colors
        ${
          Silian_value === Silian_mode
            ? `border-tech-main bg-tech-main text-white`
            : `
              border-tech-main/30 bg-tech-main/5 text-tech-main
              hover:bg-tech-main/10
            `
        }
      `}>
      {Silian_label}
    </button>
  )
}

function Silian_SectionLabel({ children: Silian_children }: { children: Silian_React.ReactNode }) {
  return (
    <p className="font-mono text-sm tracking-widest text-tech-main uppercase">
      {Silian_children}
    </p>
  )
}

function Silian_TreeNode({
  expandedPaths: Silian_expandedPaths,
  mode: Silian_mode,
  node: Silian_node,
  onSelectFile: Silian_onSelectFile,
  onSelectFolder: Silian_onSelectFolder,
  onTogglePath: Silian_onTogglePath,
  selectedFilePath: Silian_selectedFilePath,
  selectedFolderPath: Silian_selectedFolderPath,
}: {
  expandedPaths: Set<string>
  mode: SourceMode
  node: DraftRepoTreeNode
  onSelectFile: (path: string) => void
  onSelectFolder: (path: string) => void
  onTogglePath: (path: string) => void
  selectedFilePath: string
  selectedFolderPath: string
}) {
  const Silian_isExpanded = Silian_expandedPaths.has(Silian_node.path)
  const Silian_isFolderSelected = Silian_selectedFolderPath === Silian_node.path
  const Silian_isFileSelected = Silian_selectedFilePath === Silian_node.path
  const Silian_isSelectableFolder =
    Silian_mode === "new" || Silian_mode === "upload" || Silian_mode === "folder"
  const Silian_isSelectableFile = Silian_mode === "repo"

  return (
    <div className="space-y-0.5">
      <div className="group relative flex items-center">
        {Silian_node.isFolder ? (
          <button
            type="button"
            onClick={() => Silian_onTogglePath(Silian_node.path)}
            className="
              flex h-8 w-6 shrink-0 items-center justify-center font-mono
              text-[0.625rem] text-tech-main/50 transition-colors
              hover:text-tech-main
            ">
            {Silian_isExpanded ? "▼" : "▶"}
          </button>
        ) : (
          <span
            className="
              inline-flex h-8 w-6 shrink-0 items-center justify-center font-mono
              text-[0.625rem] text-tech-main/20
            ">
            ·
          </span>
        )}

        <button
          type="button"
          onClick={() => {
            if (Silian_node.isFolder && Silian_isSelectableFolder) {
              Silian_onSelectFolder(Silian_node.path)
              return
            }

            if (!Silian_node.isFolder && Silian_isSelectableFile) {
              Silian_onSelectFile(Silian_node.path)
            }
          }}
          className={`
            flex min-h-8 flex-1 items-center px-1 text-left font-mono
            text-[0.875rem] tracking-wide transition-colors
            ${
              Silian_node.isFolder
                ? Silian_isFolderSelected
                  ? `bg-tech-main/10 font-bold text-tech-main`
                  : `font-bold text-tech-main/80`
                : Silian_isFileSelected
                  ? `bg-tech-main/10 font-bold text-tech-main`
                  : `text-tech-main/70`
            }
            ${
              (Silian_node.isFolder && Silian_isSelectableFolder) ||
              (!Silian_node.isFolder && Silian_isSelectableFile)
                ? `hover:bg-tech-main/5 hover:text-tech-main`
                : `cursor-default opacity-60`
            }
          `}>
          <span className="truncate">{Silian_node.title}</span>
        </button>
      </div>

      {Silian_node.children.length > 0 && Silian_isExpanded ? (
        <div className="ml-3 border-l border-tech-main/10 pl-2">
          {Silian_node.children.map((Silian_child) => (
            <Silian_TreeNode
              key={Silian_child.id}
              expandedPaths={Silian_expandedPaths}
              mode={Silian_mode}
              node={Silian_child}
              onSelectFile={Silian_onSelectFile}
              onSelectFolder={Silian_onSelectFolder}
              onTogglePath={Silian_onTogglePath}
              selectedFilePath={Silian_selectedFilePath}
              selectedFolderPath={Silian_selectedFolderPath}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function Silian_buildDraftFilePath(Silian_folderPath: string, Silian_rawFileName: string) {
  const Silian_normalizedFolder = Silian_normalizeDraftFilePath(Silian_folderPath)
  const Silian_sanitizedName = Silian_normalizeDraftFilePath(Silian_rawFileName)
    .split("/")
    .filter(Boolean)
    .at(-1)

  if (!Silian_sanitizedName) {
    return ""
  }

  const Silian_fileName = Silian_sanitizedName.endsWith(".md")
    ? Silian_sanitizedName
    : `${Silian_sanitizedName}.md`
  return Silian_normalizedFolder ? `${Silian_normalizedFolder}/${Silian_fileName}` : Silian_fileName
}
