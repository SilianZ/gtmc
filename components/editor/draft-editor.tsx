"use client"

import * as Silian_React from "react"
import { diffLines as Silian_diffLines } from "diff"
import type { ReactCodeMirrorRef } from "@uiw/react-codemirror"
import { useRouter as Silian_useRouter } from "@/i18n/navigation"
import { useTranslations as Silian_useTranslations } from "next-intl"

import { saveDraftAction as Silian_saveDraftAction, submitForReviewAction as Silian_submitForReviewAction } from "@/actions/article"
import { DraftFileSourceDialog as Silian_DraftFileSourceDialog } from "@/components/editor/draft-file-source-dialog"
import { DraftFileList as Silian_DraftFileList } from "@/components/editor/draft-file-list"
import { EditorBadge as Silian_EditorBadge } from "@/components/editor/editor-badge"
import { EditorFileUploadInput as Silian_EditorFileUploadInput } from "@/components/editor/editor-file-upload-input"
import { LazyMarkdownPreview as Silian_LazyMarkdownPreview } from "@/components/editor/lazy-markdown-preview"
import {
  EditorTabStrip as Silian_EditorTabStrip,
  type TabType,
} from "@/components/editor/editor-tab-strip"
import { EditorTextarea as Silian_EditorTextarea } from "@/components/editor/editor-textarea"
import {
  createDraftFile as Silian_createDraftFile,
  getActiveDraftFile as Silian_getActiveDraftFile,
  getDuplicateDraftFilePaths as Silian_getDuplicateDraftFilePaths,
  normalizeDraftFileCollection as Silian_normalizeDraftFileCollection,
  normalizeDraftFilePath as Silian_normalizeDraftFilePath,
  normalizeDraftFolderPath as Silian_normalizeDraftFolderPath,
  serializeDraftFilesPayload as Silian_serializeDraftFilesPayload,
  type DraftFileCollection,
} from "@/lib/draft-files"
import { EditorToolbar as Silian_EditorToolbar } from "@/components/editor/editor-toolbar"
import {
  OperationProgress as Silian_OperationProgress,
  type OperationProgressStage,
  type OperationProgressState,
} from "@/components/ui/operation-progress"
import { TechButton as Silian_TechButton } from "../ui/tech-button"
import { InputBox as Silian_InputBox } from "../ui/input-box"
import { useBadge as Silian_useBadge } from "@/hooks/use-badge"
import { useEditorUpload as Silian_useEditorUpload } from "@/hooks/use-editor-upload"
import type { SourceMode } from "@/components/editor/draft-file-source-dialog"

interface DraftEditorProps {
  initialData?: {
    activeFileId?: string
    contributingGuides?: Array<{
      id: string
      title: string
      content: string
    }>
    folders?: string[]
    id?: string
    githubPrUrl?: string
    files: DraftFileCollection["files"]
    title: string
    status?: string
  }
}

const Silian_MAX_DRAFT_HISTORY_ENTRIES = 100

interface DraftContentHistory {
  undoStack: string[]
  redoStack: string[]
}

interface DraftFileDialogIntent {
  kind: "add" | "replace"
  initialMode: SourceMode
}

interface RepoFileSnapshot {
  content: string | null
  filePath: string
  status: "error" | "loaded" | "loading" | "missing"
}

interface DraftDiffRow {
  newLine: number | null
  oldLine: number | null
  type: "add" | "context" | "remove" | "skipped"
  value: string
}

export function DraftEditor({ initialData: Silian_initialData }: DraftEditorProps) {
  const Silian_router = Silian_useRouter()
  const Silian_t = Silian_useTranslations("Editor")
  const Silian_progressT = Silian_useTranslations("OperationProgress")
  const Silian_initialStatus = Silian_initialData?.status || "DRAFT"
  const Silian_initialDraftCollection = Silian_React.useMemo(
    () =>
      Silian_normalizeDraftFileCollection({
        activeFileId: Silian_initialData?.activeFileId,
        folders: Silian_initialData?.folders,
        files:
          Silian_initialData?.files && Silian_initialData.files.length > 0
            ? Silian_initialData.files
            : [Silian_createDraftFile()],
      }),
    [Silian_initialData?.activeFileId, Silian_initialData?.files, Silian_initialData?.folders]
  )

  const [Silian_draftStatus, Silian_setDraftStatus] = Silian_React.useState(Silian_initialStatus)
  const [Silian_title, Silian_setTitle] = Silian_React.useState(Silian_initialData?.title || "")
  const [Silian_draftCollection, Silian_setDraftCollection] = Silian_React.useState(
    Silian_initialDraftCollection
  )
  const [Silian_lastSavedDraftCollection, Silian_setLastSavedDraftCollection] =
    Silian_React.useState(Silian_initialDraftCollection)
  const [Silian_lastSavedTitle, Silian_setLastSavedTitle] = Silian_React.useState(
    Silian_initialData?.title || ""
  )
  const [Silian_revisionId, Silian_setRevisionId] = Silian_React.useState<string | undefined>(
    Silian_initialData?.id
  )
  const [Silian_fileDialogIntent, Silian_setFileDialogIntent] =
    Silian_React.useState<DraftFileDialogIntent | null>(null)
  const [Silian_isSaving, Silian_setIsSaving] = Silian_React.useState(false)
  const [Silian_isSubmittingReview, Silian_setIsSubmittingReview] = Silian_React.useState(false)
  const [Silian_saveProgressState, Silian_setSaveProgressState] =
    Silian_React.useState<OperationProgressState>("idle")
  const [Silian_submitProgressState, Silian_setSubmitProgressState] =
    Silian_React.useState<OperationProgressState>("idle")
  const [Silian_activeTab, Silian_setActiveTab] = Silian_React.useState<TabType>("write")
  const [Silian_lineWrap, Silian_setLineWrap] = Silian_React.useState(false)
  const [Silian_activeInfoTab, Silian_setActiveInfoTab] = Silian_React.useState<"changes" | "guide">(
    "changes"
  )
  const [Silian_activeGuideId, Silian_setActiveGuideId] = Silian_React.useState(
    Silian_initialData?.contributingGuides?.[0]?.id || ""
  )
  const [Silian_repoSnapshots, Silian_setRepoSnapshots] = Silian_React.useState<
    Record<string, RepoFileSnapshot>
  >({})
  const [Silian_insertDialogIntent, Silian_setInsertDialogIntent] = Silian_React.useState(false)

  const Silian_textareaRef = Silian_React.useRef<ReactCodeMirrorRef | null>(null)
  const Silian_fileInputRef = Silian_React.useRef<HTMLInputElement>(null)
  const Silian_autoSaveTimeoutRef = Silian_React.useRef<number | null>(null)
  const Silian_saveProgressResetRef = Silian_React.useRef<number | null>(null)
  const Silian_submitProgressResetRef = Silian_React.useRef<number | null>(null)
  const Silian_contentHistoryRef = Silian_React.useRef<Record<string, DraftContentHistory>>(
    {}
  )
  const { badge: Silian_badge, showBadge: Silian_showBadge, clearBadge: Silian_clearBadge } = Silian_useBadge()

  const Silian_saveProgressStages = Silian_React.useMemo<OperationProgressStage[]>(
    () => [
      {
        id: "normalize",
        label: Silian_progressT("saveDraftStageNormalize"),
        durationMs: 260,
      },
      {
        id: "serialize",
        label: Silian_progressT("saveDraftStageSerialize"),
        durationMs: 300,
      },
      {
        id: "persist",
        label: Silian_progressT("saveDraftStagePersist"),
        durationMs: 940,
      },
      {
        id: "assets",
        label: Silian_progressT("saveDraftStageAssets"),
        durationMs: 540,
      },
      {
        id: "refresh",
        label: Silian_progressT("saveDraftStageRefresh"),
        durationMs: 280,
      },
    ],
    [Silian_progressT]
  )

  const Silian_submitProgressStages = Silian_React.useMemo<OperationProgressStage[]>(
    () => [
      {
        id: "preflight",
        label: Silian_progressT("submitStagePreflight"),
        durationMs: 260,
      },
      {
        id: "assets",
        label: Silian_progressT("submitStageAssets"),
        durationMs: 580,
      },
      {
        id: "migrate",
        label: Silian_progressT("submitStageMigrate"),
        durationMs: 760,
      },
      {
        id: "open-pr",
        label: Silian_progressT("submitStagePr"),
        durationMs: 920,
      },
      {
        id: "refresh",
        label: Silian_progressT("submitStageRefresh"),
        durationMs: 300,
      },
    ],
    [Silian_progressT]
  )

  Silian_React.useEffect(() => {
    return () => {
      if (Silian_autoSaveTimeoutRef.current !== null) {
        window.clearTimeout(Silian_autoSaveTimeoutRef.current)
      }

      if (Silian_saveProgressResetRef.current !== null) {
        window.clearTimeout(Silian_saveProgressResetRef.current)
      }

      if (Silian_submitProgressResetRef.current !== null) {
        window.clearTimeout(Silian_submitProgressResetRef.current)
      }
    }
  }, [])

  const Silian_updateSaveProgressState = (
    Silian_nextState: Exclude<OperationProgressState, "idle">
  ) => {
    if (Silian_saveProgressResetRef.current !== null) {
      window.clearTimeout(Silian_saveProgressResetRef.current)
      Silian_saveProgressResetRef.current = null
    }

    Silian_setSaveProgressState(Silian_nextState)

    if (Silian_nextState === "running") {
      return
    }

    Silian_saveProgressResetRef.current = window.setTimeout(
      () => {
        Silian_setSaveProgressState("idle")
      },
      Silian_nextState === "success" ? 1400 : 3200
    )
  }

  const Silian_updateSubmitProgressState = (
    Silian_nextState: Exclude<OperationProgressState, "idle">
  ) => {
    if (Silian_submitProgressResetRef.current !== null) {
      window.clearTimeout(Silian_submitProgressResetRef.current)
      Silian_submitProgressResetRef.current = null
    }

    Silian_setSubmitProgressState(Silian_nextState)

    if (Silian_nextState === "running") {
      return
    }

    Silian_submitProgressResetRef.current = window.setTimeout(
      () => {
        Silian_setSubmitProgressState("idle")
      },
      Silian_nextState === "success" ? 1400 : 3200
    )
  }

  const Silian_githubPrUrl = Silian_initialData?.githubPrUrl
  const Silian_isSyncConflict = Silian_draftStatus === "SYNC_CONFLICT"
  const Silian_isReadOnly =
    Silian_draftStatus === "IN_REVIEW" || Silian_draftStatus === "SYNC_CONFLICT"
  const Silian_activeFile = Silian_getActiveDraftFile(Silian_draftCollection)
  const Silian_activeFileContent =
    Silian_isSyncConflict && Silian_activeFile.conflictContent !== undefined
      ? Silian_activeFile.conflictContent || ""
      : Silian_activeFile.content
  const Silian_duplicateFilePaths = Silian_getDuplicateDraftFilePaths(Silian_draftCollection.files)
  const Silian_hasMissingFilePath = Silian_draftCollection.files.some(
    (Silian_file) => !Silian_file.filePath
  )
  const Silian_activeFileHasDuplicatePath = Silian_duplicateFilePaths.some(
    (Silian_filePath) =>
      Silian_normalizeDraftFilePath(Silian_filePath) ===
      Silian_normalizeDraftFilePath(Silian_activeFile.filePath)
  )
  const Silian_activeFileIndex =
    Silian_draftCollection.files.findIndex((Silian_file) => Silian_file.id === Silian_activeFile.id) + 1
  const Silian_contributingGuides = Silian_initialData?.contributingGuides || []
  const Silian_unsavedFileIds = Silian_React.useMemo(() => {
    const Silian_savedFilesById = new Map(
      Silian_lastSavedDraftCollection.files.map((Silian_file) => [Silian_file.id, Silian_file])
    )
    const Silian_nextUnsavedFileIds = new Set<string>()

    for (const Silian_file of Silian_draftCollection.files) {
      const Silian_savedFile = Silian_savedFilesById.get(Silian_file.id)

      if (
        !Silian_savedFile ||
        Silian_savedFile.content !== Silian_file.content ||
        Silian_normalizeDraftFilePath(Silian_savedFile.filePath) !==
          Silian_normalizeDraftFilePath(Silian_file.filePath)
      ) {
        Silian_nextUnsavedFileIds.add(Silian_file.id)
      }
    }

    return Silian_nextUnsavedFileIds
  }, [Silian_draftCollection.files, Silian_lastSavedDraftCollection.files])
  const Silian_hasUnsavedChanges =
    Silian_title !== Silian_lastSavedTitle ||
    Silian_draftCollection.files.length !== Silian_lastSavedDraftCollection.files.length ||
    (Silian_draftCollection.folders || []).join("|") !==
      (Silian_lastSavedDraftCollection.folders || []).join("|") ||
    Silian_unsavedFileIds.size > 0

  const Silian_updateDraftCollection = (
    Silian_updater: (current: DraftFileCollection) => DraftFileCollection
  ) => {
    Silian_setDraftCollection((Silian_current) =>
      Silian_normalizeDraftFileCollection(Silian_updater(Silian_current))
    )
  }

  const Silian_getDraftContentHistory = Silian_React.useCallback((Silian_fileId: string) => {
    const Silian_existingHistory = Silian_contentHistoryRef.current[Silian_fileId]

    if (Silian_existingHistory) {
      return Silian_existingHistory
    }

    const Silian_nextHistory: DraftContentHistory = {
      undoStack: [],
      redoStack: [],
    }
    Silian_contentHistoryRef.current[Silian_fileId] = Silian_nextHistory
    return Silian_nextHistory
  }, [])

  const Silian_pushHistoryEntry = Silian_React.useCallback(
    (Silian_stack: string[], Silian_value: string) => {
      if (Silian_stack[Silian_stack.length - 1] === Silian_value) {
        return
      }

      Silian_stack.push(Silian_value)

      if (Silian_stack.length > Silian_MAX_DRAFT_HISTORY_ENTRIES) {
        Silian_stack.splice(0, Silian_stack.length - Silian_MAX_DRAFT_HISTORY_ENTRIES)
      }
    },
    []
  )

  const Silian_updateFileById = (
    Silian_fileId: string,
    Silian_updates: {
      content?: string
      filePath?: string
      conflictContent?: string | null
    }
  ) => {
    Silian_updateDraftCollection((Silian_current) => ({
      ...Silian_current,
      files: Silian_current.files.map((Silian_file) =>
        Silian_file.id === Silian_fileId
          ? {
              ...Silian_file,
              ...(Silian_updates.content !== undefined
                ? { content: Silian_updates.content }
                : {}),
              ...(Silian_updates.filePath !== undefined
                ? { filePath: Silian_normalizeDraftFilePath(Silian_updates.filePath) }
                : {}),
              ...(Silian_updates.conflictContent !== undefined
                ? { conflictContent: Silian_updates.conflictContent }
                : {}),
            }
          : Silian_file
      ),
    }))
  }

  const Silian_updateFileContent = Silian_React.useCallback(
    (
      Silian_fileId: string,
      Silian_nextContent: string,
      Silian_mode: "record" | "undo" | "redo" = "record"
    ) => {
      Silian_updateDraftCollection((Silian_current) => {
        const Silian_targetFile = Silian_current.files.find((Silian_file) => Silian_file.id === Silian_fileId)

        if (!Silian_targetFile || Silian_targetFile.content === Silian_nextContent) {
          return Silian_current
        }

        const Silian_history = Silian_getDraftContentHistory(Silian_fileId)

        if (Silian_mode === "record") {
          Silian_pushHistoryEntry(Silian_history.undoStack, Silian_targetFile.content)
          Silian_history.redoStack = []
        } else if (Silian_mode === "undo") {
          Silian_pushHistoryEntry(Silian_history.redoStack, Silian_targetFile.content)
        } else {
          Silian_pushHistoryEntry(Silian_history.undoStack, Silian_targetFile.content)
        }

        return {
          ...Silian_current,
          files: Silian_current.files.map((Silian_file) =>
            Silian_file.id === Silian_fileId ? { ...Silian_file, content: Silian_nextContent } : Silian_file
          ),
        }
      })
    },
    [Silian_getDraftContentHistory, Silian_pushHistoryEntry]
  )

  const Silian_updateActiveFile = (Silian_updates: {
    content?: string
    filePath?: string
  }) => {
    if (Silian_updates.content !== undefined) {
      Silian_updateFileContent(Silian_draftCollection.activeFileId, Silian_updates.content)
    }

    if (Silian_updates.filePath !== undefined) {
      Silian_updateFileById(Silian_draftCollection.activeFileId, {
        filePath: Silian_updates.filePath,
      })
    }
  }

  const Silian_persistDraft = Silian_React.useCallback(async () => {
    const Silian_normalizedDraftCollection =
      Silian_normalizeDraftFileCollection(Silian_draftCollection)
    const Silian_primaryFile = Silian_getActiveDraftFile(Silian_normalizedDraftCollection)
    const Silian_formData = new FormData()
    Silian_formData.append("title", Silian_title)
    Silian_formData.append("activeFileId", Silian_normalizedDraftCollection.activeFileId)
    Silian_formData.append("content", Silian_primaryFile.content)
    Silian_formData.append(
      "draftFiles",
      Silian_serializeDraftFilesPayload(Silian_normalizedDraftCollection)
    )
    Silian_formData.append("filePath", Silian_primaryFile.filePath)
    if (Silian_revisionId) {
      Silian_formData.append("revisionId", Silian_revisionId)
    }

    const Silian_result = await Silian_saveDraftAction(Silian_formData)

    if (!Silian_result.success || !Silian_result.revisionId) {
      throw new Error("Failed to save draft")
    }

    Silian_setDraftCollection(Silian_normalizedDraftCollection)
    Silian_setLastSavedDraftCollection(Silian_normalizedDraftCollection)
    Silian_setLastSavedTitle(Silian_title)
    Silian_setRevisionId(Silian_result.revisionId)

    return {
      normalizedDraftCollection: Silian_normalizedDraftCollection,
      revisionId: Silian_result.revisionId,
    }
  }, [Silian_draftCollection, Silian_revisionId, Silian_title])

  const Silian_saveDraftWithFeedback = Silian_React.useCallback(
    async (Silian_mode: "manual" | "auto" = "manual") => {
      if (Silian_isSaving || !Silian_title.trim()) {
        return
      }

      if (Silian_autoSaveTimeoutRef.current !== null) {
        window.clearTimeout(Silian_autoSaveTimeoutRef.current)
        Silian_autoSaveTimeoutRef.current = null
      }

      Silian_setIsSaving(true)

      if (Silian_mode === "manual") {
        Silian_updateSaveProgressState("running")
      }

      try {
        await Silian_persistDraft()

        if (Silian_mode === "manual") {
          Silian_updateSaveProgressState("success")
          Silian_showBadge("DRAFT_SAVED_", "info", 3000)
        } else {
          Silian_showBadge("AUTOSAVED_", "info", 1800)
        }
      } catch (Silian_error) {
        console.error(Silian_error)

        if (Silian_mode === "manual") {
          Silian_updateSaveProgressState("error")
          Silian_showBadge("SAVE_FAILED_", "error")
        } else {
          Silian_showBadge("AUTOSAVE_FAILED_", "error")
        }
      } finally {
        Silian_setIsSaving(false)
      }
    },
    [Silian_isSaving, Silian_persistDraft, Silian_showBadge, Silian_title]
  )

  const Silian_handleUndoDraftEdit = Silian_React.useCallback(() => {
    if (Silian_isReadOnly) {
      return
    }

    const Silian_history = Silian_contentHistoryRef.current[Silian_draftCollection.activeFileId]
    const Silian_previousContent = Silian_history?.undoStack.pop()

    if (Silian_previousContent === undefined) {
      return
    }

    Silian_updateFileContent(Silian_draftCollection.activeFileId, Silian_previousContent, "undo")
  }, [Silian_draftCollection.activeFileId, Silian_isReadOnly, Silian_updateFileContent])

  const Silian_handleRedoDraftEdit = Silian_React.useCallback(() => {
    if (Silian_isReadOnly) {
      return
    }

    const Silian_history = Silian_contentHistoryRef.current[Silian_draftCollection.activeFileId]
    const Silian_nextContent = Silian_history?.redoStack.pop()

    if (Silian_nextContent === undefined) {
      return
    }

    Silian_updateFileContent(Silian_draftCollection.activeFileId, Silian_nextContent, "redo")
  }, [Silian_draftCollection.activeFileId, Silian_isReadOnly, Silian_updateFileContent])

  const Silian_insertTextAtCursor = (Silian_text: string) => {
    if (!Silian_textareaRef.current) return
    const Silian_view = Silian_textareaRef.current.view
    if (!Silian_view) return

    const Silian_selection = Silian_view.state.selection.main

    Silian_view.dispatch({
      changes: {
        from: Silian_selection.from,
        to: Silian_selection.to,
        insert: Silian_text,
      },
      selection: {
        anchor: Silian_selection.from + Silian_text.length,
        head: Silian_selection.from + Silian_text.length,
      },
    })

    Silian_view.focus()
  }

  const Silian_insertSyntax = (Silian_prefix: string, Silian_suffix: string = "") => {
    if (Silian_isReadOnly || !Silian_textareaRef.current) return
    const Silian_view = Silian_textareaRef.current.view
    if (!Silian_view) return

    const Silian_selection = Silian_view.state.selection.main
    const Silian_selectedText = Silian_view.state.sliceDoc(Silian_selection.from, Silian_selection.to)
    const Silian_newText = Silian_prefix + Silian_selectedText + Silian_suffix

    Silian_view.dispatch({
      changes: {
        from: Silian_selection.from,
        to: Silian_selection.to,
        insert: Silian_newText,
      },
      selection: {
        anchor: Silian_selection.from + Silian_prefix.length,
        head: Silian_selection.from + Silian_prefix.length + Silian_selectedText.length,
      },
    })

    Silian_view.focus()
  }

  const Silian_draftUploadAdapter = Silian_React.useCallback(
    async (Silian_file: File) => {
      if (!Silian_revisionId) {
        throw new Error("Save draft first before uploading files.")
      }

      const Silian_formData = new FormData()
      Silian_formData.append("file", Silian_file)
      Silian_formData.append("revisionId", Silian_revisionId)

      const Silian_res = await fetch("/api/upload/draft", {
        method: "POST",
        body: Silian_formData,
      })

      if (Silian_res.status === 413) {
        throw new Error(Silian_t("errorFileTooLarge"))
      }

      const Silian_data = await Silian_res.json()
      if (!Silian_res.ok) throw new Error(Silian_data.error || Silian_t("errorUploadFailed"))

      return {
        url: Silian_data.url,
        filename: Silian_data.filename,
        mimeType: Silian_data.mimeType,
        fileSize: Silian_data.fileSize,
      }
    },
    [Silian_revisionId, Silian_t]
  )

  const { uploadFile: Silian_uploadFile, isUploading: Silian_isUploading, isCompressing: Silian_isCompressing } = Silian_useEditorUpload({
    adapter: Silian_draftUploadAdapter,
    onInsertContent: (Silian_text: string) => {
      if (Silian_text === "") {
        Silian_updateActiveFile({
          content: Silian_activeFileContent.replace(
            /<!-- UPLOAD_PENDING_[a-f0-9-]+ -->\n?/g,
            ""
          ),
        })
      } else if (Silian_text.startsWith("<!--")) {
        Silian_insertTextAtCursor(Silian_text)
      } else {
        Silian_updateActiveFile({
          content: Silian_activeFileContent.replace(
            /<!-- UPLOAD_PENDING_[a-f0-9-]+ -->/,
            Silian_text
          ),
        })
      }
    },
    onShowBadge: (Silian_message: string, Silian_type: "info" | "error" | "progress") => {
      Silian_showBadge(Silian_message, Silian_type)
    },
    onClearBadge: Silian_clearBadge,
  })

  Silian_React.useEffect(() => {
    if (Silian_isReadOnly || !Silian_title.trim() || !Silian_hasUnsavedChanges) {
      if (Silian_autoSaveTimeoutRef.current !== null) {
        window.clearTimeout(Silian_autoSaveTimeoutRef.current)
        Silian_autoSaveTimeoutRef.current = null
      }
      return
    }

    if (Silian_isSaving || Silian_isSubmittingReview || Silian_isUploading) {
      return
    }

    if (Silian_autoSaveTimeoutRef.current !== null) {
      window.clearTimeout(Silian_autoSaveTimeoutRef.current)
    }

    Silian_autoSaveTimeoutRef.current = window.setTimeout(() => {
      Silian_autoSaveTimeoutRef.current = null
      void Silian_saveDraftWithFeedback("auto")
    }, 1500)

    return () => {
      if (Silian_autoSaveTimeoutRef.current !== null) {
        window.clearTimeout(Silian_autoSaveTimeoutRef.current)
        Silian_autoSaveTimeoutRef.current = null
      }
    }
  }, [
    Silian_draftCollection,
    Silian_hasUnsavedChanges,
    Silian_isReadOnly,
    Silian_isSaving,
    Silian_isSubmittingReview,
    Silian_isUploading,
    Silian_saveDraftWithFeedback,
    Silian_title,
  ])

  Silian_React.useEffect(() => {
    if (Silian_isReadOnly) {
      return
    }

    const Silian_handleKeyDown = (Silian_event: KeyboardEvent) => {
      if (
        !(Silian_event.ctrlKey || Silian_event.metaKey) ||
        Silian_event.key.toLowerCase() !== "s"
      ) {
        return
      }

      Silian_event.preventDefault()

      if (Silian_isSubmittingReview || Silian_isUploading || !Silian_title.trim()) {
        return
      }

      void Silian_saveDraftWithFeedback("manual")
    }

    window.addEventListener("keydown", Silian_handleKeyDown)

    return () => window.removeEventListener("keydown", Silian_handleKeyDown)
  }, [
    Silian_isReadOnly,
    Silian_isSubmittingReview,
    Silian_isUploading,
    Silian_saveDraftWithFeedback,
    Silian_title,
  ])

  const Silian_handleUploadWithAutoSave = async (Silian_file: File) => {
    if (!Silian_revisionId) {
      Silian_showBadge(Silian_t("badgeSavingBeforeUpload"), "progress")
      Silian_setIsSaving(true)
      Silian_updateSaveProgressState("running")
      try {
        const Silian_result = await Silian_persistDraft()
        if (Silian_result.revisionId) {
          Silian_updateSaveProgressState("success")
          Silian_clearBadge()
        } else {
          Silian_updateSaveProgressState("error")
          Silian_showBadge(Silian_t("badgeSaveFailedUpload"), "error")
          return
        }
      } catch {
        Silian_updateSaveProgressState("error")
        Silian_showBadge(Silian_t("badgeSaveFailedUpload"), "error")
        return
      } finally {
        Silian_setIsSaving(false)
      }
    }
    Silian_uploadFile(Silian_file)
  }

  const Silian_handlePaste = (Silian_e: Silian_React.ClipboardEvent) => {
    if (Silian_isReadOnly || Silian_isUploading) return
    const Silian_items = Silian_e.clipboardData.items
    for (const Silian_item of Array.from(Silian_items)) {
      if (Silian_item.type.indexOf("image") !== -1) {
        Silian_e.preventDefault()
        const Silian_file = Silian_item.getAsFile()
        if (Silian_file) {
          Silian_handleUploadWithAutoSave(Silian_file)
        }
        break
      }
    }
  }

  const Silian_handleDrop = (Silian_e: Silian_React.DragEvent) => {
    if (Silian_isReadOnly || Silian_isUploading) return
    Silian_e.preventDefault()
    if (Silian_e.dataTransfer.files && Silian_e.dataTransfer.files.length > 0) {
      const Silian_file = Silian_e.dataTransfer.files[0]
      Silian_handleUploadWithAutoSave(Silian_file)
    }
  }

  const Silian_handleSaveDraft = async (Silian_e: Silian_React.FormEvent) => {
    Silian_e.preventDefault()
    await Silian_saveDraftWithFeedback("manual")
  }

  const Silian_handleSubmitReview = async () => {
    if (Silian_hasMissingFilePath) {
      Silian_showBadge(Silian_t("badgeAllFilesNeedPath"), "error", 4000)
      return
    }

    if (Silian_duplicateFilePaths.length > 0) {
      Silian_showBadge(
        Silian_t("duplicatePathsError", { paths: Silian_duplicateFilePaths.join(", ") }),
        "error",
        4000
      )
      return
    }

    Silian_setIsSubmittingReview(true)
    Silian_updateSubmitProgressState("running")
    try {
      const Silian_persistedDraft = await Silian_persistDraft()
      const Silian_result = await Silian_submitForReviewAction(Silian_persistedDraft.revisionId)
      Silian_setDraftStatus(Silian_result.status)
      Silian_updateSubmitProgressState("success")
      Silian_showBadge(
        Silian_result.status === "SYNC_CONFLICT"
          ? Silian_t("badgeSyncConflict")
          : Silian_t("badgePrOpened"),
        "info",
        4000
      )
      Silian_router.push(`/draft/${Silian_persistedDraft.revisionId}`)
      Silian_router.refresh()
    } catch (Silian_error) {
      console.error(Silian_error)
      Silian_updateSubmitProgressState("error")
      Silian_showBadge(Silian_t("badgeSubmitFailed"), "error")
    } finally {
      Silian_setIsSubmittingReview(false)
    }
  }

  const Silian_openFileDialog = Silian_React.useCallback(
    (Silian_kind: DraftFileDialogIntent["kind"], Silian_initialMode: SourceMode) => {
      if (Silian_isReadOnly) {
        return
      }

      Silian_setFileDialogIntent({ kind: Silian_kind, initialMode: Silian_initialMode })
    },
    [Silian_isReadOnly]
  )

  const Silian_handleAddFile = () => {
    Silian_openFileDialog("add", "repo")
  }

  const Silian_handleRemoveFile = (Silian_fileId: string) => {
    if (Silian_isReadOnly || Silian_draftCollection.files.length <= 1) {
      return
    }

    Silian_updateDraftCollection((Silian_current) => {
      const Silian_currentIndex = Silian_current.files.findIndex((Silian_file) => Silian_file.id === Silian_fileId)
      const Silian_remainingFiles = Silian_current.files.filter((Silian_file) => Silian_file.id !== Silian_fileId)
      const Silian_nextActiveFile =
        Silian_current.activeFileId === Silian_fileId
          ? Silian_remainingFiles[Math.max(0, Silian_currentIndex - 1)]?.id ||
            Silian_remainingFiles[0]?.id
          : Silian_current.activeFileId

      return {
        activeFileId: Silian_nextActiveFile,
        folders: Silian_current.folders || [],
        files: Silian_remainingFiles,
      }
    })
  }

  const Silian_handleApplyDraftFileSource = ({
    content: Silian_content,
    filePath: Silian_filePath,
  }: {
    content: string
    filePath: string
  }) => {
    const Silian_normalizedPath = Silian_normalizeDraftFilePath(Silian_filePath)
    const Silian_hasDuplicate = Silian_draftCollection.files.some(
      (Silian_file) =>
        Silian_normalizeDraftFilePath(Silian_file.filePath) === Silian_normalizedPath &&
        (Silian_fileDialogIntent?.kind !== "replace" || Silian_file.id !== Silian_activeFile.id)
    )

    if (Silian_hasDuplicate) {
      Silian_showBadge(Silian_t("badgeFileAlreadyExists"), "error", 3000)
      return false
    }

    if (Silian_fileDialogIntent?.kind === "replace") {
      Silian_updateDraftCollection((Silian_current) => ({
        ...Silian_current,
        files: Silian_current.files.map((Silian_file) =>
          Silian_file.id === Silian_current.activeFileId
            ? {
                ...Silian_file,
                content: Silian_content,
                filePath: Silian_normalizedPath,
              }
            : Silian_file
        ),
      }))
      Silian_setActiveTab("write")
      Silian_setFileDialogIntent(null)
      return true
    }

    const Silian_nextFile = Silian_createDraftFile({
      content: Silian_content,
      filePath: Silian_normalizedPath,
    })

    Silian_updateDraftCollection((Silian_current) => ({
      activeFileId: Silian_nextFile.id,
      folders: Silian_current.folders || [],
      files: [...Silian_current.files, Silian_nextFile],
    }))
    Silian_setActiveTab("write")
    Silian_setFileDialogIntent(null)
    return true
  }

  Silian_React.useEffect(() => {
    const Silian_pendingFiles = Silian_draftCollection.files.filter((Silian_file) => {
      const Silian_normalizedPath = Silian_normalizeDraftFilePath(Silian_file.filePath)
      if (!Silian_normalizedPath) {
        return false
      }

      const Silian_snapshot = Silian_repoSnapshots[Silian_file.id]
      return !Silian_snapshot || Silian_snapshot.filePath !== Silian_normalizedPath
    })

    for (const Silian_file of Silian_pendingFiles) {
      const Silian_normalizedPath = Silian_normalizeDraftFilePath(Silian_file.filePath)
      if (!Silian_normalizedPath) {
        continue
      }

      Silian_setRepoSnapshots((Silian_current) => ({
        ...Silian_current,
        [Silian_file.id]: {
          content: null,
          filePath: Silian_normalizedPath,
          status: "loading",
        },
      }))

      void fetch(
        `/api/draft/repo-file?path=${encodeURIComponent(Silian_normalizedPath)}`,
        {
          cache: "no-store",
        }
      )
        .then(async (Silian_response) => {
          if (Silian_response.status === 404) {
            Silian_setRepoSnapshots((Silian_current) => ({
              ...Silian_current,
              [Silian_file.id]: {
                content: null,
                filePath: Silian_normalizedPath,
                status: "missing",
              },
            }))
            return
          }

          const Silian_data = (await Silian_response.json()) as {
            content?: string
            error?: string
          }

          if (!Silian_response.ok || typeof Silian_data.content !== "string") {
            throw new Error(Silian_data.error || "Failed to load repository file")
          }

          Silian_setRepoSnapshots((Silian_current) => ({
            ...Silian_current,
            [Silian_file.id]: {
              content: Silian_data.content ?? "",
              filePath: Silian_normalizedPath,
              status: "loaded",
            },
          }))
        })
        .catch(() => {
          Silian_setRepoSnapshots((Silian_current) => ({
            ...Silian_current,
            [Silian_file.id]: {
              content: null,
              filePath: Silian_normalizedPath,
              status: "error",
            },
          }))
        })
    }
  }, [Silian_draftCollection.files, Silian_repoSnapshots])

  const Silian_changeEntries = Silian_React.useMemo(
    () =>
      Silian_draftCollection.files
        .map((Silian_file) => {
          const Silian_normalizedPath = Silian_normalizeDraftFilePath(Silian_file.filePath)
          const Silian_snapshot = Silian_repoSnapshots[Silian_file.id]

          if (!Silian_normalizedPath) {
            return {
              changeType: "pending" as const,
              file: Silian_file,
              rows: Silian_buildDiffRows("", Silian_file.content),
            }
          }

          if (!Silian_snapshot || Silian_snapshot.status === "loading") {
            return {
              changeType: "pending" as const,
              file: Silian_file,
              rows: Silian_buildDiffRows("", Silian_file.content),
            }
          }

          if (Silian_snapshot.status === "missing") {
            return {
              changeType: "new" as const,
              file: Silian_file,
              rows: Silian_buildDiffRows("", Silian_file.content),
            }
          }

          if (Silian_snapshot.status === "error" || Silian_snapshot.content === null) {
            return null
          }

          if (Silian_snapshot.content === Silian_file.content) {
            return null
          }

          return {
            changeType: "modified" as const,
            file: Silian_file,
            rows: Silian_buildDiffRows(Silian_snapshot.content, Silian_file.content),
          }
        })
        .filter(Boolean),
    [Silian_draftCollection.files, Silian_repoSnapshots]
  )

  const Silian_newFolderPaths = Silian_React.useMemo(
    () => Silian_draftCollection.folders || [],
    [Silian_draftCollection.folders]
  )

  const Silian_handleInsertSelectedFile = ({
    filePath: Silian_filePath,
  }: {
    content: string
    filePath: string
  }) => {
    const Silian_normalizedTargetPath = Silian_normalizeDraftFilePath(Silian_filePath)

    if (!Silian_normalizedTargetPath) {
      return false
    }

    const Silian_linkLabel = Silian_normalizedTargetPath
      .split("/")
      .filter(Boolean)
      .slice(-1)[0]
      ?.replace(/\.md$/i, "")

    Silian_insertTextAtCursor(
      `[${Silian_linkLabel || "linked-file"}](${Silian_normalizedTargetPath})`
    )
    Silian_setInsertDialogIntent(false)
    return true
  }

  const Silian_handleCreateFolder = (Silian_folderPath: string) => {
    const Silian_normalizedFolderPath = Silian_normalizeDraftFolderPath(Silian_folderPath)

    if (!Silian_normalizedFolderPath) {
      Silian_showBadge("INVALID_FOLDER_NAME_", "error", 2800)
      return false
    }

    Silian_updateDraftCollection((Silian_current) => ({
      ...Silian_current,
      folders: [...(Silian_current.folders || []), Silian_normalizedFolderPath],
    }))
    Silian_showBadge("FOLDER_READY_", "info", 2000)
    Silian_setFileDialogIntent(null)
    return true
  }

  const Silian_saveDisabled = Silian_isSaving || !Silian_title.trim()
  const Silian_activeFileHistory =
    Silian_contentHistoryRef.current[Silian_draftCollection.activeFileId]
  const Silian_submitDisabled =
    Silian_isSubmittingReview ||
    Silian_isSaving ||
    Silian_isUploading ||
    !Silian_title.trim() ||
    Silian_hasMissingFilePath ||
    Silian_duplicateFilePaths.length > 0

  return (
    <form
      onSubmit={Silian_handleSaveDraft}
      className="
        group relative flex w-full flex-col space-y-6 border border-tech-main/60
        bg-[#fbfbfd] p-4 shadow-[inset_0_0_100px_rgba(96,112,143,0.03)]
        before:absolute
        before:inset-0 before:z-[-1] before:bg-[url('/bg-grid.svg')] before:bg-size-[24px_24px]
        before:opacity-[0.04] sm:p-6
      ">
      <div className="absolute -top-px -left-px size-3 border-t-2 border-l-2 border-tech-main" />
      <div className="absolute -top-px -right-px size-3 border-t-2 border-r-2 border-tech-main" />
      <div className="absolute -bottom-px -left-px size-3 border-b-2 border-l-2 border-tech-main" />
      <div className="absolute -right-px -bottom-px size-3 border-r-2 border-b-2 border-tech-main" />

      <div className="relative z-10 flex flex-col space-y-4">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="draft-title"
              className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-tech-main uppercase">
              <span className="inline-block size-2 bg-tech-main/40" />
              {Silian_t("titleLabel")}
            </label>
          </div>
          <Silian_InputBox
            id="draft-title"
            required
            placeholder={Silian_t("titlePlaceholder")}
            className={`
              border-tech-main/40 bg-white/50 py-3 font-mono text-lg backdrop-blur-sm
              transition-all duration-300 focus:border-tech-main focus:bg-white
              focus:ring-1 focus:ring-tech-main/20
              ${
                Silian_isReadOnly
                  ? `cursor-not-allowed bg-tech-main/5 opacity-70`
                  : `hover:bg-white/80`
              }
            `}
            value={Silian_title}
            onChange={(Silian_e) => Silian_setTitle(Silian_e.target.value)}
            readOnly={Silian_isReadOnly}
            aria-busy={Silian_isSaving}
          />
        </div>
      </div>

      {Silian_githubPrUrl ? (
        <div
          className="
            flex items-center justify-between gap-3 border guide-line
            bg-tech-main/5 px-4 py-3 font-mono text-xs text-tech-main
          ">
          <span>{Silian_t("prStreamActive")}</span>
          <a
            href={Silian_githubPrUrl}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4">
            {Silian_t("openGithubPr")}
          </a>
        </div>
      ) : null}

      {Silian_isSyncConflict ? (
        <div
          className="
            border-l-4 border-amber-500 bg-amber-500/10 p-4 text-amber-700
          ">
          <p className="font-bold tracking-widest uppercase">
            {Silian_t("conflictTitle")}
          </p>
          <p className="text-sm">{Silian_t("conflictMessage")}</p>
        </div>
      ) : null}

      <div
        className="
          grid gap-4
          lg:grid-cols-[18rem_minmax(0,1fr)]
        ">
        <Silian_DraftFileList
          files={Silian_draftCollection.files}
          activeFileId={Silian_draftCollection.activeFileId}
          unsavedFileIds={Silian_unsavedFileIds}
          onSelectFile={(Silian_fileId) =>
            Silian_setDraftCollection((Silian_current) => ({
              ...Silian_current,
              activeFileId: Silian_fileId,
            }))
          }
          onAddFile={Silian_handleAddFile}
          onRemoveFile={Silian_handleRemoveFile}
          isReadOnly={Silian_isReadOnly}
        />

        <div className="space-y-4">
          <div
            className="
              border border-tech-main/40 bg-white/80 p-4 backdrop-blur-sm
            ">
            <div
              className="
                mb-4 flex flex-col gap-2
                sm:flex-row sm:items-end sm:justify-between
              ">
              <div>
                <p className="section-label">{Silian_t("activeFileLabel")}</p>
                <p
                  className="
                    font-mono text-xs tracking-widest text-tech-main/70
                    uppercase
                  ">
                  {`${Silian_t("slotLabel")}_${Silian_activeFileIndex}/${Silian_draftCollection.files.length}`}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Silian_TechButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={Silian_isReadOnly}
                  onClick={() => Silian_openFileDialog("replace", "repo")}>
                  {Silian_t("chooseExistingFile")}
                </Silian_TechButton>
                <Silian_TechButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={Silian_isReadOnly}
                  onClick={() => Silian_openFileDialog("replace", "new")}>
                  {Silian_t("createTargetFile")}
                </Silian_TechButton>
                <Silian_TechButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={Silian_isReadOnly}
                  onClick={() => Silian_openFileDialog("replace", "upload")}>
                  {Silian_t("importTargetFile")}
                </Silian_TechButton>
                <Silian_TechButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={Silian_isReadOnly}
                  onClick={() => Silian_openFileDialog("add", "folder")}>
                  NEW FOLDER
                </Silian_TechButton>
                <Silian_TechButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={Silian_isReadOnly}
                  onClick={() => Silian_setInsertDialogIntent(true)}>
                  INSERT FILE LINK
                </Silian_TechButton>
              </div>
            </div>

            <div className="space-y-3 border guide-line bg-tech-main/5 p-4">
              <div>
                <p className="font-mono text-[0.6875rem] tracking-widest text-tech-main/45 uppercase">
                  {Silian_t("targetFileLabel")}
                </p>
                <p className="mt-1 font-mono text-sm tracking-widest break-all text-tech-main uppercase">
                  {Silian_activeFile.filePath || Silian_t("targetFileUnset")}
                </p>
              </div>
              <p className="font-mono text-xs/relaxed text-tech-main/65">
                {Silian_t("targetFileDescription")}
              </p>
            </div>

            {Silian_activeFileHasDuplicatePath ? (
              <p className="mt-3 font-mono text-xs text-red-500">
                {Silian_t("duplicatePathError")}
              </p>
            ) : null}

            {!Silian_activeFile.filePath && !Silian_isReadOnly ? (
              <p className="mt-3 font-mono text-xs text-amber-700">
                {Silian_t("filePathBlankHint")}
              </p>
            ) : null}

            {Silian_duplicateFilePaths.length > 0 ? (
              <p className="mt-2 font-mono text-xs text-red-500">
                {Silian_t("duplicatePathsError", {
                  paths: Silian_duplicateFilePaths.join(", "),
                })}
              </p>
            ) : null}
          </div>

          <div
            className="
              relative editor-grow flex min-h-125 grow flex-col border
              border-tech-main/40 bg-white/80 backdrop-blur-sm
            ">
            <Silian_EditorTabStrip
              activeTab={Silian_activeTab}
              onTabChange={Silian_setActiveTab}
              writeId="draft-editor-write-panel"
              previewId="draft-editor-preview-panel"
              rightSlot={
                Silian_activeFile.filePath || `UNTITLED_FILE_${Silian_activeFileIndex}`
              }
            />

            {Silian_activeTab === "write" && (
              <>
                <Silian_EditorToolbar
                  onInsert={Silian_insertSyntax}
                  disabled={Silian_isReadOnly || Silian_isUploading}
                  lineWrap={Silian_lineWrap}
                  onWrapToggle={() => Silian_setLineWrap((Silian_v) => !Silian_v)}
                  fileUploadSlot={
                    !Silian_isReadOnly ? (
                      <Silian_EditorFileUploadInput
                        fileInputRef={Silian_fileInputRef}
                        onFileSelect={Silian_handleUploadWithAutoSave}
                        isUploading={Silian_isUploading}
                        isCompressing={Silian_isCompressing}
                      />
                    ) : undefined
                  }
                />
                <div
                  className="
                    relative flex h-12 items-center
                    gap-2 overflow-x-auto scroll-smooth border-b
                    guide-line bg-tech-main/4 px-4 shadow-[inset_0_1px_4px_rgba(96,112,143,0.05)]
                  ">
                  <div className="absolute inset-y-0 left-0 w-1 bg-tech-main/30" />
                  <span className="mr-2 font-mono text-[9px] tracking-widest text-tech-main/50 uppercase opacity-70">
                    MACROS
                  </span>

                  <Silian_TechButton
                    type="button"
                    variant="ghost"
                    className="h-7 border border-transparent px-3 text-[10px] tracking-widest text-tech-main transition-all hover:guide-line hover:bg-white hover:text-tech-main hover:shadow-sm"
                    disabled={Silian_isReadOnly}
                    onClick={() =>
                      Silian_insertTextAtCursor("\n## Section Title\n\n")
                    }>
                    <span className="flex items-center gap-1.5">
                      <span className="font-bold text-tech-main/40">#</span>{" "}
                      SECTION
                    </span>
                  </Silian_TechButton>
                  <Silian_TechButton
                    type="button"
                    variant="ghost"
                    className="h-7 border border-transparent px-3 text-[10px] tracking-widest text-tech-main transition-all hover:guide-line hover:bg-white hover:text-tech-main hover:shadow-sm"
                    disabled={Silian_isReadOnly}
                    onClick={() =>
                      Silian_insertTextAtCursor(
                        "\n> [!TIP]\n> Add contributor guidance here.\n\n"
                      )
                    }>
                    <span className="flex items-center gap-1.5">
                      <span className="font-bold text-tech-main/40">{">"}</span>{" "}
                      CALLOUT
                    </span>
                  </Silian_TechButton>
                  <Silian_TechButton
                    type="button"
                    variant="ghost"
                    className="h-7 border border-transparent px-3 text-[10px] tracking-widest text-tech-main transition-all hover:guide-line hover:bg-white hover:text-tech-main hover:shadow-sm"
                    disabled={Silian_isReadOnly}
                    onClick={() =>
                      Silian_insertTextAtCursor(
                        "\n| Parameter | Value | Notes |\n| --- | --- | --- |\n| Example | Value | Detail |\n\n"
                      )
                    }>
                    <span className="flex items-center gap-1.5">
                      <span className="font-bold text-tech-main/40">||</span>{" "}
                      TABLE
                    </span>
                  </Silian_TechButton>

                  <div className="mx-2 h-4 w-px bg-tech-main/20" />

                  <Silian_TechButton
                    type="button"
                    variant="secondary"
                    className="group h-7 guide-line bg-white/50 px-3 text-[10px] font-bold tracking-widest text-tech-main-dark/80 transition-all hover:border-tech-main/50 hover:bg-white"
                    disabled={
                      Silian_isReadOnly || !Silian_activeFileHistory?.undoStack.length
                    }
                    onClick={Silian_handleUndoDraftEdit}>
                    <span className="flex items-center gap-1">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="square">
                        <path d="M3 7v6h6M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3z" />
                      </svg>
                      UNDO
                    </span>
                  </Silian_TechButton>
                  <Silian_TechButton
                    type="button"
                    variant="secondary"
                    className="group h-7 guide-line bg-white/50 px-3 text-[10px] font-bold tracking-widest text-tech-main-dark/80 transition-all hover:border-tech-main/50 hover:bg-white"
                    disabled={
                      Silian_isReadOnly || !Silian_activeFileHistory?.redoStack.length
                    }
                    onClick={Silian_handleRedoDraftEdit}>
                    <span className="flex items-center gap-1">
                      REDO
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="square"
                        className="scale-x-[-1]">
                        <path d="M3 7v6h6M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3z" />
                      </svg>
                    </span>
                  </Silian_TechButton>
                </div>
              </>
            )}

            <Silian_EditorBadge badge={Silian_badge} onDismiss={Silian_clearBadge} />

            <section
              id="draft-editor-write-panel"
              role="tabpanel"
              className="editor-grow"
              hidden={Silian_activeTab !== "write"}>
              <div className="editor-surface">
                <Silian_EditorTextarea
                  ref={Silian_textareaRef}
                  value={Silian_activeFileContent}
                  onChange={(Silian_value) => Silian_updateActiveFile({ content: Silian_value })}
                  onUndo={Silian_handleUndoDraftEdit}
                  onRedo={Silian_handleRedoDraftEdit}
                  onPaste={Silian_handlePaste}
                  onDrop={Silian_handleDrop}
                  onDragOver={(Silian_e) => {
                    if (!Silian_isReadOnly) Silian_e.preventDefault()
                  }}
                  onDragEnter={(Silian_e) => {
                    if (!Silian_isReadOnly) Silian_e.preventDefault()
                  }}
                  isReadOnly={Silian_isReadOnly}
                  isSaving={Silian_isSaving}
                  placeholder={Silian_t("contentPlaceholder")}
                  lineWrap={Silian_lineWrap}
                  canUndo={Boolean(Silian_activeFileHistory?.undoStack.length)}
                  canRedo={Boolean(Silian_activeFileHistory?.redoStack.length)}
                  enableSyntaxHints
                />
              </div>
            </section>

            <section
              id="draft-editor-preview-panel"
              role="tabpanel"
              hidden={Silian_activeTab !== "preview"}
              className="editor-grow">
              {Silian_activeFileContent.trim() ? (
                <div
                  className="
                    w-full max-w-none overflow-hidden p-6 wrap-break-word
                    selection:bg-tech-main/20 selection:text-slate-900
                    sm:p-8
                  ">
                  <Silian_LazyMarkdownPreview
                    content={Silian_activeFileContent}
                    rawPath={Silian_activeFile.filePath || ""}
                  />
                </div>
              ) : (
                <p className="editor-panel">NOTHING_TO_PREVIEW_</p>
              )}
            </section>
          </div>
        </div>
      </div>

      <section
        className="
          grid gap-4
          xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]
        ">
        <div className="border border-tech-main/35 bg-white/80 backdrop-blur-sm">
          <div className="flex border-b guide-line">
            <button
              type="button"
              onClick={() => Silian_setActiveInfoTab("changes")}
              className={`flex-1 px-4 py-3 font-mono text-xs tracking-widest uppercase ${
                Silian_activeInfoTab === "changes"
                  ? "bg-tech-main text-white"
                  : "text-tech-main hover:bg-tech-main/5"
              }`}>
              CHANGE MAP
            </button>
            <button
              type="button"
              onClick={() => Silian_setActiveInfoTab("guide")}
              className={`flex-1 border-l guide-line px-4 py-3 font-mono text-xs tracking-widest uppercase ${
                Silian_activeInfoTab === "guide"
                  ? "bg-tech-main text-white"
                  : "text-tech-main hover:bg-tech-main/5"
              }`}>
              CONTRIBUTING
            </button>
          </div>

          {Silian_activeInfoTab === "changes" ? (
            <div className="space-y-4 p-4">
              <div
                className="
                  grid gap-3
                  sm:grid-cols-3
                ">
                <Silian_InfoStat
                  label="MODIFIED FILES"
                  value={String(
                    Silian_changeEntries.filter(
                      (Silian_entry) => Silian_entry && Silian_entry.changeType === "modified"
                    ).length
                  )}
                />
                <Silian_InfoStat
                  label="NEW FILES"
                  value={String(
                    Silian_changeEntries.filter(
                      (Silian_entry) => Silian_entry && Silian_entry.changeType === "new"
                    ).length
                  )}
                />
                <Silian_InfoStat
                  label="NEW FOLDERS"
                  value={String((Silian_draftCollection.folders || []).length)}
                />
              </div>

              {Silian_changeEntries.length === 0 ? (
                <p
                  className="
                    border guide-line bg-tech-main/5 p-4 font-mono text-xs
                    text-tech-main/60 uppercase
                  ">
                  NO_LOCAL_DIFF_
                </p>
              ) : (
                <div className="space-y-4">
                  {Silian_changeEntries.map((Silian_entry) =>
                    Silian_entry ? (
                      <Silian_ChangePreviewCard
                        key={Silian_entry.file.id}
                        filePath={Silian_entry.file.filePath || "PATH_NOT_SET"}
                        changeType={Silian_entry.changeType}
                        rows={Silian_entry.rows}
                      />
                    ) : null
                  )}
                </div>
              )}

              {Silian_newFolderPaths.length > 0 ? (
                <div className="border guide-line bg-tech-main/5 p-4">
                  <p className="section-label">NEW FOLDERS</p>
                  <div className="space-y-1 font-mono text-xs text-emerald-700">
                    {Silian_newFolderPaths.map((Silian_folderPath) => (
                      <p key={Silian_folderPath}>+ {Silian_folderPath}</p>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="p-4">
              {Silian_contributingGuides.length === 0 ? (
                <p className="font-mono text-xs text-tech-main/60 uppercase">
                  NO_GUIDE_AVAILABLE_
                </p>
              ) : (
                <>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {Silian_contributingGuides.map((Silian_guide) => (
                      <Silian_TechButton
                        key={Silian_guide.id}
                        type="button"
                        variant={
                          Silian_activeGuideId === Silian_guide.id ? "primary" : "secondary"
                        }
                        size="sm"
                        onClick={() => Silian_setActiveGuideId(Silian_guide.id)}>
                        {Silian_guide.title}
                      </Silian_TechButton>
                    ))}
                  </div>
                  <div className="max-h-136 overflow-y-auto pr-2">
                    <Silian_LazyMarkdownPreview
                      content={
                        Silian_contributingGuides.find(
                          (Silian_guide) => Silian_guide.id === Silian_activeGuideId
                        )?.content || Silian_contributingGuides[0].content
                      }
                      rawPath="CONTRIBUTING.md"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="border border-tech-main/35 bg-white/80 p-4 backdrop-blur-sm">
          <p className="section-label">WORKSPACE OVERVIEW</p>
          <div className="space-y-3 font-mono text-xs uppercase">
            <Silian_InfoLine
              label="OPEN FILES"
              value={String(Silian_draftCollection.files.length)}
            />
            <Silian_InfoLine
              label="FOLDERS"
              value={String((Silian_draftCollection.folders || []).length)}
            />
            <Silian_InfoLine
              label="UNSAVED FILES"
              value={String(Silian_unsavedFileIds.size)}
            />
            <Silian_InfoLine
              label="ACTIVE FILE"
              value={Silian_activeFile.filePath || "PATH_NOT_SET"}
            />
            <Silian_InfoLine
              label="GITHUB BASE"
              value={Silian_describeSnapshotStatus(Silian_repoSnapshots[Silian_activeFile.id])}
            />
          </div>
        </div>
      </section>

      {!Silian_isReadOnly && (
        <>
          <Silian_OperationProgress
            state={Silian_saveProgressState}
            title={Silian_progressT("saveDraftTitle")}
            stages={Silian_saveProgressStages}
            successLabel={Silian_progressT("saveDraftSuccess")}
            errorLabel={Silian_progressT("saveDraftError")}
          />

          <Silian_OperationProgress
            state={Silian_submitProgressState}
            title={Silian_progressT("submitTitle")}
            stages={Silian_submitProgressStages}
            successLabel={Silian_progressT("submitSuccess")}
            errorLabel={Silian_progressT("submitError")}
          />

          <div
            className="
              relative mt-6 flex justify-end gap-4 border-t border-tech-main/10
              pt-4
            ">
            <div className="corner-tick" />

            <Silian_TechButton
              type="submit"
              variant="primary"
              disabled={Silian_saveDisabled}
              aria-busy={Silian_isSaving}>
              {Silian_isSaving
                ? Silian_t("savingLabel")
                : Silian_hasUnsavedChanges
                  ? `${Silian_t("saveButton")}_*`
                  : Silian_t("saveButton")}
            </Silian_TechButton>

            <Silian_TechButton
              type="button"
              variant="ghost"
              onClick={Silian_handleSubmitReview}
              disabled={Silian_submitDisabled}
              aria-busy={Silian_isSubmittingReview}>
              {Silian_isSubmittingReview ? Silian_progressT("submitBusy") : Silian_t("openPr")}
            </Silian_TechButton>
          </div>

          <section
            aria-label={Silian_t("submissionLicenseAria")}
            className="mt-4 border guide-line bg-tech-main/5 p-4 font-mono text-[0.6875rem] leading-relaxed text-tech-main/80">
            <div className="mb-3 border-b border-tech-main/15 pb-3">
              <p className="section-label">{Silian_t("syntaxHintsTitle")}</p>
              <p className="mt-2 text-tech-main/70">
                {Silian_t("syntaxHintsDescription")}
              </p>
              <p className="mt-1 text-tech-main/55">
                {Silian_t("syntaxHintsShortcut")}
              </p>
            </div>
            <p className="section-label">{Silian_t("submissionLicenseTitle")}</p>
            <div className="mt-2 space-y-2">
              <p>{Silian_t("submissionLicenseIntro")}</p>
              <p>
                {Silian_t("submissionLicenseReusePrefix")}{" "}
                <a
                  href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-tech-main/30 underline-offset-4 transition-colors hover:text-tech-main-dark hover:decoration-tech-main-dark">
                  CC BY-NC-SA 4.0
                </a>
                {Silian_t("submissionLicenseReuseSuffix")}
              </p>
              <p>{Silian_t("submissionLicenseAttribution")}</p>
            </div>
          </section>
        </>
      )}

      <Silian_DraftFileSourceDialog
        isOpen={Silian_fileDialogIntent !== null}
        initialFolderPath={Silian_getParentFolderPath(Silian_activeFile.filePath)}
        initialMode={Silian_fileDialogIntent?.initialMode}
        onClose={() => Silian_setFileDialogIntent(null)}
        onCreate={Silian_handleApplyDraftFileSource}
        onCreateFolder={Silian_handleCreateFolder}
      />

      <Silian_DraftFileSourceDialog
        isOpen={Silian_insertDialogIntent}
        initialFolderPath={Silian_getParentFolderPath(Silian_activeFile.filePath)}
        initialMode="repo"
        onClose={() => Silian_setInsertDialogIntent(false)}
        onCreate={Silian_handleInsertSelectedFile}
      />
    </form>
  )
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface UploadResponse {
  error?: string
  fileSize?: number
  filename?: string
  mimeType?: string
  url?: string
}

function Silian_getParentFolderPath(Silian_filePath: string) {
  const Silian_normalized = Silian_normalizeDraftFilePath(Silian_filePath)
  const Silian_lastSlashIndex = Silian_normalized.lastIndexOf("/")
  return Silian_lastSlashIndex >= 0 ? Silian_normalized.slice(0, Silian_lastSlashIndex) : ""
}

function Silian_buildDiffRows(Silian_previousContent: string, Silian_nextContent: string) {
  const Silian_rows: DraftDiffRow[] = []
  let Silian_oldLine = 1
  let Silian_newLine = 1

  for (const Silian_part of Silian_diffLines(Silian_previousContent, Silian_nextContent)) {
    const Silian_values = Silian_part.value.replace(/\n$/, "").split("\n")

    if (!Silian_part.added && !Silian_part.removed && Silian_values.length > 6) {
      for (const Silian_line of Silian_values.slice(0, 2)) {
        Silian_rows.push({ newLine: Silian_newLine, oldLine: Silian_oldLine, type: "context", value: Silian_line })
        Silian_oldLine += 1
        Silian_newLine += 1
      }

      Silian_rows.push({
        newLine: null,
        oldLine: null,
        type: "skipped",
        value: `${Silian_values.length - 4} unchanged lines`,
      })

      for (const Silian_line of Silian_values.slice(-2)) {
        Silian_rows.push({ newLine: Silian_newLine, oldLine: Silian_oldLine, type: "context", value: Silian_line })
        Silian_oldLine += 1
        Silian_newLine += 1
      }
      continue
    }

    for (const Silian_line of Silian_values) {
      Silian_rows.push({
        newLine: Silian_part.removed ? null : Silian_newLine,
        oldLine: Silian_part.added ? null : Silian_oldLine,
        type: Silian_part.added ? "add" : Silian_part.removed ? "remove" : "context",
        value: Silian_line,
      })

      if (!Silian_part.added) {
        Silian_oldLine += 1
      }

      if (!Silian_part.removed) {
        Silian_newLine += 1
      }
    }
  }

  return Silian_rows
}

function Silian_describeSnapshotStatus(Silian_snapshot?: RepoFileSnapshot) {
  if (!Silian_snapshot) return "CHECKING"
  if (Silian_snapshot.status === "missing") return "NEW_FILE"
  if (Silian_snapshot.status === "loading") return "LOADING"
  if (Silian_snapshot.status === "error") return "UNKNOWN"
  return "TRACKED"
}

function Silian_InfoStat({ label: Silian_label, value: Silian_value }: { label: string; value: string }) {
  return (
    <div className="border guide-line bg-tech-main/5 p-3">
      <p className="font-mono text-[0.6875rem] tracking-widest text-tech-main/55 uppercase">
        {Silian_label}
      </p>
      <p className="mt-2 font-mono text-lg text-tech-main uppercase">{Silian_value}</p>
    </div>
  )
}

function Silian_InfoLine({ label: Silian_label, value: Silian_value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-tech-main/10 pb-2">
      <span className="text-tech-main/55">{Silian_label}</span>
      <span className="text-right break-all text-tech-main">{Silian_value}</span>
    </div>
  )
}

function Silian_ChangePreviewCard({
  filePath: Silian_filePath,
  changeType: Silian_changeType,
  rows: Silian_rows,
}: {
  filePath: string
  changeType: "modified" | "new" | "pending"
  rows: DraftDiffRow[]
}) {
  return (
    <section className="border guide-line bg-white/70">
      <div className="flex items-center justify-between border-b guide-line bg-tech-main/5 px-4 py-3">
        <p className="font-mono text-xs tracking-widest break-all text-tech-main uppercase">
          {Silian_filePath}
        </p>
        <span
          className={`
            border px-2 py-1 font-mono text-[0.625rem] tracking-widest uppercase
            ${
              Silian_changeType === "new"
                ? `border-emerald-500/30 text-emerald-700`
                : Silian_changeType === "modified"
                  ? `border-amber-500/30 text-amber-700`
                  : `guide-line text-tech-main/55`
            }
          `}>
          {Silian_changeType}
        </span>
      </div>

      <div className="max-h-72 overflow-auto bg-slate-950/95 font-mono text-[0.6875rem] text-slate-100">
        {Silian_rows.map((Silian_row, Silian_index) => (
          <div
            key={`${Silian_filePath}-${Silian_index}`}
            className={`
              grid grid-cols-[3rem_3rem_minmax(0,1fr)] px-2 py-1
              ${
                Silian_row.type === "add"
                  ? `bg-emerald-500/10 text-emerald-200`
                  : Silian_row.type === "remove"
                    ? `bg-red-500/10 text-red-200`
                    : Silian_row.type === "skipped"
                      ? `bg-slate-800/70 text-slate-400`
                      : `text-slate-300`
              }
            `}>
            <span className="text-slate-500">{Silian_row.oldLine ?? ""}</span>
            <span className="text-slate-500">{Silian_row.newLine ?? ""}</span>
            <span className="break-all whitespace-pre-wrap">
              {Silian_row.type === "skipped" ? `… ${Silian_row.value}` : Silian_row.value || " "}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
