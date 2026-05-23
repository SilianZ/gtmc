"use client"

import { useState as Silian_useState } from "react"
import { createPortal as Silian_createPortal } from "react-dom"
import { useTranslations as Silian_useTranslations } from "next-intl"
import { createDocument as Silian_createDocument } from "@/actions/sidebar"
import { getReauthLoginUrl as Silian_getReauthLoginUrl, isReauthRequiredError as Silian_isReauthRequiredError } from "@/lib/admin-reauth"
import type { TreeNode } from "./tree-node"

export function CreateDocModal({
  open: Silian_open,
  mounted: Silian_mounted,
  availableFolders: Silian_availableFolders,
  onClose: Silian_onClose,
  onCreated: Silian_onCreated,
}: {
  open: boolean
  mounted: boolean
  availableFolders: TreeNode[]
  onClose: () => void
  onCreated: () => void
}) {
  const Silian_t = Silian_useTranslations("Sidebar")
  const [Silian_formData, Silian_setFormData] = Silian_useState({
    title: "",
    slug: "",
    isFolder: false,
    parentId: "",
  })

  const Silian_handleCreate = async (Silian_e: React.FormEvent) => {
    Silian_e.preventDefault()
    try {
      await Silian_createDocument({
        title: Silian_formData.title,
        slug:
          Silian_formData.slug || Silian_formData.title.toLowerCase().replace(/\s+/g, "-"),
        isFolder: Silian_formData.isFolder,
        parentId: Silian_formData.parentId || null,
      })
      Silian_onClose()
      Silian_onCreated()
    } catch (Silian_error) {
      if (Silian_isReauthRequiredError(Silian_error)) {
        window.location.href = Silian_getReauthLoginUrl(
          `${window.location.pathname}${window.location.search}`
        )
        return
      }
      const Silian_message = Silian_error instanceof Error ? Silian_error.message : "Unknown error"
      alert(Silian_message)
    }
  }

  if (!Silian_mounted || !Silian_open) return null

  return Silian_createPortal(
    <div
      className="
        fixed inset-0 z-9999 flex items-center justify-center bg-black/80 p-4
        duration-300 animate-in fade-in
      ">
      <div
        className="
          w-full max-w-md rounded-sm border-2 border-tech-main bg-white p-6
          shadow-[8px_8px_0_0_rgba(var(--tech-main),1)]
          dark:bg-black
        ">
        <h3
          className="
            mb-6 border-b guide-line pb-2 font-mono text-lg font-bold
            tracking-widest text-tech-main uppercase
          ">
          CREATE_SYS_OBJECT
        </h3>

        <form onSubmit={Silian_handleCreate} className="space-y-4 font-mono">
          <div>
            <label
              htmlFor="modal-title"
              className="
                mb-1 block text-[0.6875rem] tracking-wider text-tech-main/80
                uppercase
              ">
              {Silian_t("createDocTitleLabel")}
            </label>
            <input
              id="modal-title"
              type="text"
              required
              value={Silian_formData.title}
              onChange={(Silian_e) =>
                Silian_setFormData({
                  ...Silian_formData,
                  title: Silian_e.target.value,
                })
              }
              className="
                w-full border border-tech-main/40 bg-tech-main/5 px-3 py-2
                text-sm text-tech-main outline-none
                focus:border-tech-main
              "
              placeholder="e.g. Overview"
            />
          </div>

          <div>
            <label
              htmlFor="modal-slug"
              className="
                mb-1 block text-[0.6875rem] tracking-wider text-tech-main/80
                uppercase
              ">
              {Silian_t("createDocSlugLabel")}
            </label>
            <input
              id="modal-slug"
              type="text"
              value={Silian_formData.slug}
              onChange={(Silian_e) =>
                Silian_setFormData({ ...Silian_formData, slug: Silian_e.target.value })
              }
              className="
                w-full border border-tech-main/40 bg-tech-main/5 px-3 py-2
                text-sm text-tech-main outline-none
                focus:border-tech-main
              "
              placeholder={Silian_t("createDocSlugPlaceholder")}
            />
          </div>

          <div
            className="
              flex items-center gap-3 border guide-line bg-tech-main/5 px-3 py-2
            ">
            <input
              type="checkbox"
              id="isFolder"
              checked={Silian_formData.isFolder}
              onChange={(Silian_e) =>
                Silian_setFormData({
                  ...Silian_formData,
                  isFolder: Silian_e.target.checked,
                })
              }
              className="size-4 accent-tech-main"
            />
            <label
              htmlFor="isFolder"
              className="cursor-pointer text-sm text-tech-main/80 select-none">
              {Silian_t("createDocAsDirectory")}
            </label>
          </div>

          <div>
            <label
              htmlFor="modal-parent"
              className="
                mb-1 block text-[0.6875rem] tracking-wider text-tech-main/80
                uppercase
              ">
              {Silian_t("createDocParentDirectory")}
            </label>
            <select
              id="modal-parent"
              value={Silian_formData.parentId}
              onChange={(Silian_e) =>
                Silian_setFormData({
                  ...Silian_formData,
                  parentId: Silian_e.target.value,
                })
              }
              className="
                w-full border border-tech-main/40 bg-tech-main/5 px-3 py-2
                text-sm text-tech-main outline-none
              ">
              <option value="">{Silian_t("createDocRootDirectory")}</option>
              {Silian_availableFolders.map((Silian_f) => (
                <option key={Silian_f.id} value={Silian_f.id}>
                  {Silian_f.title}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6 flex justify-end gap-2 border-t guide-line pt-4">
            <button
              type="button"
              onClick={Silian_onClose}
              className="
                cursor-pointer border border-tech-main/40 px-4 py-2 text-[0.6875rem]
                font-bold tracking-widest text-tech-main uppercase
                transition-colors
                hover:bg-tech-main/10
              ">
              {Silian_t("createDocAbortButton")}
            </button>
            <button
              type="submit"
              className="
                cursor-pointer bg-tech-main px-4 py-2 text-[0.6875rem] font-bold
                tracking-widest text-white uppercase
                shadow-[2px_2px_0_0_rgba(var(--tech-main),0.4)]
                transition-opacity
                hover:opacity-90
              ">
              {Silian_t("createDocExecuteButton")}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
