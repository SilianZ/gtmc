"use client"

import * as Silian_React from "react"
import { useTranslations as Silian_useTranslations } from "next-intl"
import Silian_CodeMirror, { ReactCodeMirrorRef as Silian_ReactCodeMirrorRef } from "@uiw/react-codemirror"
import {
  autocompletion as Silian_autocompletion,
  type CompletionContext,
  snippetCompletion as Silian_snippetCompletion,
} from "@codemirror/autocomplete"
import { markdown as Silian_markdown, markdownLanguage as Silian_markdownLanguage } from "@codemirror/lang-markdown"
import { languages as Silian_languages } from "@codemirror/language-data"
import { EditorView as Silian_EditorView } from "@codemirror/view"

const Silian_techTheme = Silian_EditorView.theme({
  "&": {
    backgroundColor: "transparent",
    color: "var(--color-tech-main, #000)",
    fontFamily: "var(--font-mono)",
    fontSize: "0.875rem",
    lineHeight: "1.625",
    height: "100%",
  },
  ".cm-content": {
    padding: "1.5rem",
  },
  "&.cm-focused": {
    outline: "none",
  },
  ".cm-cursor": {
    borderLeftColor: "var(--color-tech-main, #000)",
  },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
    {
      backgroundColor: "rgba(0,0,0,0.1)",
    },
  ".cm-gutters": {
    backgroundColor: "transparent",
    color: "rgba(0,0,0,0.5)",
    border: "none",
  },
})

interface EditorTextareaProps {
  value: string
  onChange: (value: string) => void
  onUndo?: () => void
  onRedo?: () => void
  onPaste?: (e: Silian_React.ClipboardEvent<HTMLDivElement>) => void
  onDrop?: (e: Silian_React.DragEvent<HTMLDivElement>) => void
  onDragOver?: (e: Silian_React.DragEvent<HTMLDivElement>) => void
  onDragEnter?: (e: Silian_React.DragEvent<HTMLDivElement>) => void
  isReadOnly?: boolean
  isSaving?: boolean
  placeholder?: string
  "aria-busy"?: boolean
  fileId?: string // to preserve state per file
  lineWrap?: boolean
  onWrapToggle?: () => void
  canUndo?: boolean
  canRedo?: boolean
  enableSyntaxHints?: boolean
}

const Silian_markdownSyntaxHints = [
  Silian_snippetCompletion("# ${Title}", {
    label: "heading-1",
    detail: "Markdown H1",
    info: "Insert a top-level heading",
  }),
  Silian_snippetCompletion("## ${Section}", {
    label: "heading-2",
    detail: "Markdown H2",
    info: "Insert a section heading",
  }),
  Silian_snippetCompletion("- ${item}", {
    label: "bullet-list",
    detail: "List",
    info: "Insert a bullet list item",
  }),
  Silian_snippetCompletion("- [ ] ${task}", {
    label: "task-list",
    detail: "Checklist",
    info: "Insert a markdown task item",
  }),
  Silian_snippetCompletion("> ${quote}", {
    label: "blockquote",
    detail: "Quote",
    info: "Insert a blockquote",
  }),
  Silian_snippetCompletion("[${label}](${url})", {
    label: "link",
    detail: "Link",
    info: "Insert a markdown link",
  }),
  Silian_snippetCompletion("![${alt}](${url})", {
    label: "image",
    detail: "Image",
    info: "Insert a markdown image",
  }),
  Silian_snippetCompletion("```md\n${content}\n```", {
    label: "code-fence",
    detail: "Code block",
    info: "Insert a fenced code block",
  }),
  Silian_snippetCompletion(
    "| Column | Value |\n| --- | --- |\n| ${left} | ${right} |",
    {
      label: "table",
      detail: "Table",
      info: "Insert a markdown table",
    }
  ),
  Silian_snippetCompletion("$$\n${formula}\n$$", {
    label: "math-block",
    detail: "KaTeX",
    info: "Insert a math block",
  }),
] as const

function Silian_markdownSyntaxHintSource(Silian_context: CompletionContext) {
  const Silian_word = Silian_context.matchBefore(/[\w-]*/)

  if (!Silian_context.explicit) {
    const Silian_line = Silian_context.state.doc.lineAt(Silian_context.pos)
    const Silian_prefix = Silian_line.text.slice(0, Silian_context.pos - Silian_line.from)
    const Silian_trigger = Silian_prefix.slice(-1)
    const Silian_onlyWhitespace = Silian_prefix.trim().length === 0

    if (
      !Silian_onlyWhitespace &&
      !["#", "-", ">", "[", "!", "`", "|"].includes(Silian_trigger)
    ) {
      return null
    }
  }

  return {
    from: Silian_word ? Silian_word.from : Silian_context.pos,
    options: [...Silian_markdownSyntaxHints],
    validFor: /[\w-]*/,
  }
}

export const EditorTextarea = Silian_React.forwardRef<
  Silian_ReactCodeMirrorRef,
  EditorTextareaProps
>(function EditorTextarea(
  {
    value: Silian_value,
    onChange: Silian_onChange,
    onUndo: Silian_onUndo,
    onRedo: Silian_onRedo,
    onPaste: Silian_onPaste,
    onDrop: Silian_onDrop,
    onDragOver: Silian_onDragOver,
    onDragEnter: Silian_onDragEnter,
    isReadOnly: Silian_isReadOnly,
    isSaving: Silian_isSaving,
    placeholder: Silian_placeholder,
    fileId: Silian_fileId,
    lineWrap: Silian_lineWrap = false,
    onWrapToggle: Silian_onWrapToggle,
    canUndo: Silian_canUndo = false,
    canRedo: Silian_canRedo = false,
    enableSyntaxHints: Silian_enableSyntaxHints = false,
    ...Silian_rest
  },
  Silian_ref
) {
  const Silian_t = Silian_useTranslations("Editor")

  const Silian_handleKeyDownCapture = Silian_React.useCallback(
    (Silian_event: Silian_React.KeyboardEvent<HTMLDivElement>) => {
      if (Silian_isReadOnly) {
        return
      }

      const Silian_key = Silian_event.key.toLowerCase()
      const Silian_isModifierPressed = Silian_event.ctrlKey || Silian_event.metaKey
      const Silian_isUndo = Silian_isModifierPressed && !Silian_event.shiftKey && Silian_key === "z"
      const Silian_isRedo =
        Silian_isModifierPressed &&
        ((Silian_event.shiftKey && Silian_key === "z") || (!Silian_event.shiftKey && Silian_key === "y"))

      if (Silian_isUndo && Silian_onUndo) {
        Silian_event.preventDefault()
        Silian_event.stopPropagation()

        if (Silian_canUndo) {
          Silian_onUndo()
        }
        return
      }

      if (Silian_isRedo && Silian_onRedo) {
        Silian_event.preventDefault()
        Silian_event.stopPropagation()

        if (Silian_canRedo) {
          Silian_onRedo()
        }
      }
    },
    [Silian_canRedo, Silian_canUndo, Silian_isReadOnly, Silian_onRedo, Silian_onUndo]
  )

  return (
    <div
      className={`
        flex custom-left-scrollbar w-full grow flex-col
        ${Silian_isReadOnly ? `cursor-not-allowed bg-gray-50` : `bg-transparent`}
      `}
      onPaste={Silian_onPaste}
      onDrop={Silian_onDrop}
      onDragOver={Silian_onDragOver}
      onDragEnter={Silian_onDragEnter}
      onKeyDownCapture={Silian_handleKeyDownCapture}
      aria-busy={Silian_isSaving}
      role="application"
      {...Silian_rest}>
      <Silian_CodeMirror
        ref={Silian_ref}
        value={Silian_value}
        height="100%"
        className="custom-left-scrollbar grow [&>.cm-editor]:h-full"
        placeholder={Silian_placeholder ?? Silian_t("bodyPlaceholder")}
        extensions={[
          Silian_markdown({ base: Silian_markdownLanguage, codeLanguages: Silian_languages }),
          Silian_techTheme,
          ...(Silian_enableSyntaxHints
            ? [Silian_autocompletion({ override: [Silian_markdownSyntaxHintSource] })]
            : []),
          ...(Silian_lineWrap ? [Silian_EditorView.lineWrapping] : []),
        ]}
        onChange={Silian_onChange}
        readOnly={Silian_isReadOnly}
        editable={!Silian_isReadOnly}
        basicSetup={{
          lineNumbers: true,
          foldGutter: false,
          highlightActiveLine: false,
        }}
        theme="light"
      />
    </div>
  )
})
