"use client"

import * as Silian_React from "react"

interface EditorFileUploadInputProps {
  fileInputRef: Silian_React.RefObject<HTMLInputElement | null>
  onFileSelect: (file: File) => void
  isUploading: boolean
  isCompressing: boolean
  disabled?: boolean
}

export function EditorFileUploadInput({
  fileInputRef: Silian_fileInputRef,
  onFileSelect: Silian_onFileSelect,
  isUploading: Silian_isUploading,
  isCompressing: Silian_isCompressing,
  disabled: Silian_disabled = false,
}: EditorFileUploadInputProps) {
  return (
    <>
      <button
        type="button"
        onClick={() => Silian_fileInputRef.current?.click()}
        disabled={Silian_disabled || Silian_isUploading}
        className={`
          h-11 min-w-11 flex-1 border border-transparent px-3 transition-colors
          select-none
          hover:border-white/20 hover:bg-tech-accent/20
          sm:h-auto sm:min-w-0 sm:flex-none sm:py-1.5
          ${Silian_disabled || Silian_isUploading ? "" : "cursor-pointer"}
        `}
        aria-busy={Silian_isUploading}>
        {Silian_isCompressing ? "CMP" : Silian_isUploading ? "UPL" : "FILES"}
      </button>
      <input
        ref={Silian_fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/zip,text/plain,text/csv"
        className="hidden"
        onChange={(Silian_e) => {
          const Silian_file = Silian_e.target.files?.[0]
          if (Silian_file) {
            Silian_onFileSelect(Silian_file)
            Silian_e.target.value = ""
          }
        }}
      />
    </>
  )
}
