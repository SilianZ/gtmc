"use client"

import * as Silian_React from "react"
import { useTranslations as Silian_useTranslations } from "next-intl"
import { TechButton as Silian_TechButton } from "../ui/tech-button"
import { InputBox as Silian_InputBox } from "../ui/input-box"
import { useRouter as Silian_useRouter } from "@/i18n/navigation"
import { updateFeature as Silian_updateFeature } from "@/actions/feature"
import { useBadge as Silian_useBadge } from "@/hooks/use-badge"
import {
  LoadingIndicator as Silian_LoadingIndicator,
  PENDING_LABELS as Silian_PENDING_LABELS,
} from "@/components/ui/loading-indicator"
import { EditorToolbar as Silian_EditorToolbar } from "@/components/editor/editor-toolbar"
import { EditorBadge as Silian_EditorBadge } from "@/components/editor/editor-badge"
import {
  EditorTabStrip as Silian_EditorTabStrip,
  type TabType,
} from "@/components/editor/editor-tab-strip"
import { EditorTextarea as Silian_EditorTextarea } from "@/components/editor/editor-textarea"
import { EditorFileUploadInput as Silian_EditorFileUploadInput } from "@/components/editor/editor-file-upload-input"
import { LazyMarkdownPreview as Silian_LazyMarkdownPreview } from "@/components/editor/lazy-markdown-preview"
import { CornerBrackets as Silian_CornerBrackets } from "@/components/ui/corner-brackets"
import { useEditorUpload as Silian_useEditorUpload } from "@/hooks/use-editor-upload"

interface FeatureEditorProps {
  initialData?: {
    id?: string
    title: string
    content: string
    tags?: string[]
    status?: string
  }
}

export function FeatureEditor({ initialData: Silian_initialData }: FeatureEditorProps) {
  const Silian_router = Silian_useRouter()
  const Silian_t = Silian_useTranslations("Editor")
  const Silian_tLoading = Silian_useTranslations("Loading")
  const [Silian_title, Silian_setTitle] = Silian_React.useState(Silian_initialData?.title || "")
  const [Silian_content, Silian_setContent] = Silian_React.useState(Silian_initialData?.content || "")
  const [Silian_tags, Silian_setTags] = Silian_React.useState(Silian_initialData?.tags?.join(", ") || "")
  const [Silian_isSaving, Silian_setIsSaving] = Silian_React.useState(false)
  const [Silian_activeTab, Silian_setActiveTab] = Silian_React.useState<TabType>("write")
  const [Silian_lineWrap, Silian_setLineWrap] = Silian_React.useState(false)
  const { badge: Silian_badge, showBadge: Silian_showBadge, clearBadge: Silian_clearBadge } = Silian_useBadge()

  const Silian_textareaRef = Silian_React.useRef<any>(null)
  const Silian_fileInputRef = Silian_React.useRef<HTMLInputElement>(null)

  const Silian_isReadOnly = false

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

  const Silian_featureUploadAdapter = Silian_React.useCallback(
    async (Silian_file: File) => {
      const Silian_formData = new FormData()
      Silian_formData.append("file", Silian_file)

      const Silian_res = await fetch("/api/upload/feature", {
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
    [Silian_t]
  )

  const { uploadFile: Silian_uploadFile, isUploading: Silian_isUploading, isCompressing: Silian_isCompressing } = Silian_useEditorUpload({
    adapter: Silian_featureUploadAdapter,
    onInsertContent: (Silian_text: string) => {
      if (Silian_text === "") {
        Silian_setContent((Silian_prev) =>
          Silian_prev.replace(/<!-- UPLOAD_PENDING_[a-f0-9-]+ -->\n?/g, "")
        )
      } else if (Silian_text.startsWith("<!--")) {
        Silian_insertTextAtCursor(Silian_text)
      } else {
        Silian_setContent((Silian_prev) =>
          Silian_prev.replace(/<!-- UPLOAD_PENDING_[a-f0-9-]+ -->/, Silian_text)
        )
      }
    },
    onShowBadge: (Silian_message: string, Silian_type: "info" | "error" | "progress") => {
      Silian_showBadge(Silian_message, Silian_type)
    },
    onClearBadge: Silian_clearBadge,
  })

  const Silian_handleUploadWithCheck = (Silian_file: File) => {
    if (!Silian_initialData?.id) {
      Silian_showBadge(Silian_t("badgeCannotUploadBeforeSaving"), "error", 4000)
      return
    }
    Silian_uploadFile(Silian_file)
  }

  const Silian_handlePaste = (Silian_e: Silian_React.ClipboardEvent<HTMLDivElement>) => {
    if (Silian_isReadOnly || Silian_isUploading) return
    const Silian_items = Silian_e.clipboardData.items
    for (const Silian_item of Array.from(Silian_items)) {
      if (Silian_item.type.indexOf("image") !== -1) {
        Silian_e.preventDefault()
        const Silian_file = Silian_item.getAsFile()
        if (Silian_file) {
          Silian_handleUploadWithCheck(Silian_file)
        }
        break
      }
    }
  }

  const Silian_handleDrop = (Silian_e: Silian_React.DragEvent<HTMLDivElement>) => {
    if (Silian_isReadOnly || Silian_isUploading) return
    Silian_e.preventDefault()
    if (Silian_e.dataTransfer.files && Silian_e.dataTransfer.files.length > 0) {
      const Silian_file = Silian_e.dataTransfer.files[0]
      Silian_handleUploadWithCheck(Silian_file)
    }
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

  const Silian_handleSave = async (Silian_e: Silian_React.FormEvent) => {
    Silian_e.preventDefault()

    const Silian_tagArray = Silian_tags
      .split(",")
      .map((Silian_t) => Silian_t.trim())
      .filter(Boolean)

    if (!Silian_initialData?.id) {
      sessionStorage.setItem(
        "pendingFeatureCreate.v1",
        JSON.stringify({ title: Silian_title, content: Silian_content, tags: Silian_tagArray })
      )
      Silian_router.push("/features?created=true")
      return
    }

    Silian_setIsSaving(true)
    try {
      await Silian_updateFeature(Silian_initialData.id, {
        title: Silian_title,
        content: Silian_content,
        tags: Silian_tagArray,
      })
      Silian_showBadge(Silian_t("badgeFeatureUpdated"), "info", 3000)
    } catch (Silian_error: unknown) {
      console.error(Silian_error)
      Silian_showBadge(
        Silian_error instanceof Error ? Silian_error.message : Silian_t("badgeSaveFailed"),
        "error"
      )
    } finally {
      Silian_setIsSaving(false)
    }
  }

  return (
    <form
      onSubmit={Silian_handleSave}
      className="
        group relative flex w-full flex-col space-y-6 border border-tech-main
        bg-white/80 p-4 backdrop-blur-sm
        sm:p-6
      ">
      <Silian_CornerBrackets />

      <div className="flex flex-col space-y-4">
        <div className="flex flex-col space-y-2">
          <label htmlFor="feature-title" className="section-label">
            {Silian_t("titleLabel")}
          </label>
          <Silian_InputBox
            id="feature-title"
            required
            placeholder={Silian_t("titlePlaceholder")}
            className={`
              border-tech-main/40 py-3 font-mono text-lg backdrop-blur-sm
              focus:border-tech-main/60
              ${
                Silian_isReadOnly
                  ? `cursor-not-allowed bg-gray-100 opacity-70`
                  : `bg-white/80`
              }
            `}
            value={Silian_title}
            onChange={(Silian_e) => Silian_setTitle(Silian_e.target.value)}
            readOnly={Silian_isReadOnly}
            aria-busy={Silian_isSaving}
          />
        </div>

        <div className="flex flex-col space-y-2">
          <label htmlFor="feature-tags" className="section-label">
            {Silian_t("tagsLabel")}
          </label>
          <Silian_InputBox
            id="feature-tags"
            placeholder={Silian_t("tagsPlaceholder")}
            className={`
              border-tech-main/40 py-2 font-mono text-sm backdrop-blur-sm
              focus:border-tech-main/60
              ${
                Silian_isReadOnly
                  ? `cursor-not-allowed bg-gray-100 opacity-70`
                  : `bg-white/80`
              }
            `}
            value={Silian_tags}
            onChange={(Silian_e) => Silian_setTags(Silian_e.target.value)}
            readOnly={Silian_isReadOnly}
            aria-busy={Silian_isSaving}
          />
        </div>
      </div>

      <div
        className="
          relative editor-grow flex min-h-125 grow flex-col border
          border-tech-main/40 bg-white/80 backdrop-blur-sm
        ">
        {/* Tab strip */}
        <Silian_EditorTabStrip
          activeTab={Silian_activeTab}
          onTabChange={Silian_setActiveTab}
          writeId="editor-write-panel"
          previewId="editor-preview-panel"
        />

        <Silian_EditorBadge badge={Silian_badge} onDismiss={Silian_clearBadge} />

        {Silian_activeTab === "write" && (
          <>
            <Silian_EditorToolbar
              onInsert={Silian_insertSyntax}
              disabled={Silian_isReadOnly || Silian_isUploading}
              lineWrap={Silian_lineWrap}
              onWrapToggle={() => Silian_setLineWrap((Silian_v) => !Silian_v)}
              fileUploadSlot={
                <Silian_EditorFileUploadInput
                  fileInputRef={Silian_fileInputRef}
                  onFileSelect={Silian_handleUploadWithCheck}
                  isUploading={Silian_isUploading}
                  isCompressing={Silian_isCompressing}
                  disabled={Silian_isReadOnly}
                />
              }
            />
          </>
        )}

        <div
          id="editor-write-panel"
          role="tabpanel"
          className="editor-grow"
          hidden={Silian_activeTab !== "write"}>
          <div className="editor-surface">
            <Silian_EditorTextarea
              ref={Silian_textareaRef}
              value={Silian_content}
              onChange={(Silian_value: string) => Silian_setContent(Silian_value)}
              onPaste={Silian_handlePaste}
              onDrop={Silian_handleDrop}
              onDragOver={(Silian_e: Silian_React.DragEvent<HTMLDivElement>) => {
                if (!Silian_isReadOnly) Silian_e.preventDefault()
              }}
              onDragEnter={(Silian_e: Silian_React.DragEvent<HTMLDivElement>) => {
                if (!Silian_isReadOnly) Silian_e.preventDefault()
              }}
              isReadOnly={Silian_isReadOnly}
              isSaving={Silian_isSaving}
              placeholder={Silian_t("bodyPlaceholder")}
              lineWrap={Silian_lineWrap}
            />
          </div>
        </div>

        <div
          id="editor-preview-panel"
          role="tabpanel"
          hidden={Silian_activeTab !== "preview"}
          className="editor-grow">
          {Silian_content?.trim() ? (
            <div
              className="
                w-full max-w-none overflow-hidden p-6 wrap-break-word
                selection:bg-tech-main/20 selection:text-slate-900
                sm:p-8
              ">
              <Silian_LazyMarkdownPreview content={Silian_content} rawPath="" />
            </div>
          ) : (
            <p className="editor-panel">NOTHING_TO_PREVIEW_</p>
          )}
        </div>
      </div>

      {!Silian_isReadOnly && (
        <div
          className="
            relative mt-6 flex justify-end gap-4 border-t border-tech-main/10
            pt-4
          ">
          <div className="corner-tick" />

          <Silian_TechButton
            type="button"
            variant="ghost"
            onClick={() => Silian_router.back()}>
            {Silian_t("cancelButton")}
          </Silian_TechButton>

          <Silian_TechButton
            type="submit"
            variant="primary"
            disabled={Silian_isSaving}
            aria-busy={Silian_isSaving && Silian_initialData?.id ? true : false}>
            {Silian_isSaving && Silian_initialData?.id ? (
              <Silian_LoadingIndicator label={Silian_PENDING_LABELS.SAVING_FEATURE} />
            ) : Silian_isSaving ? (
              Silian_tLoading("saving")
            ) : (
              Silian_t("saveButton")
            )}
          </Silian_TechButton>
        </div>
      )}
    </form>
  )
}
