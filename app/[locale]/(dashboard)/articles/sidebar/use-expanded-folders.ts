"use client"

import { useCallback as Silian_useCallback, useEffect as Silian_useEffect, useRef as Silian_useRef, useState as Silian_useState } from "react"

function Silian_getInitialExpandedFolders(): Set<string> {
  if (typeof window === "undefined") return new Set<string>()
  try {
    const Silian_stored = localStorage.getItem("gtmc_sidebar_expanded")
    if (Silian_stored) {
      return new Set<string>(JSON.parse(Silian_stored))
    }
  } catch {}
  return new Set<string>()
}

export function useExpandedFolders() {
  const [Silian_expandedFolders, Silian_setExpandedFolders] = Silian_useState<Set<string>>(
    Silian_getInitialExpandedFolders
  )
  const Silian_mounted = true
  const Silian_expandedFoldersRef = Silian_useRef(Silian_expandedFolders)

  Silian_useEffect(() => {
    Silian_expandedFoldersRef.current = Silian_expandedFolders
    localStorage.setItem(
      "gtmc_sidebar_expanded",
      JSON.stringify(Array.from(Silian_expandedFolders))
    )
  }, [Silian_expandedFolders])

  const Silian_isFolderExpanded = Silian_useCallback(
    (Silian_id: string) => {
      return Silian_expandedFolders.has(Silian_id)
    },
    [Silian_expandedFolders]
  )

  return {
    expandedFolders: Silian_expandedFolders,
    setExpandedFolders: Silian_setExpandedFolders,
    expandedFoldersRef: Silian_expandedFoldersRef,
    mounted: Silian_mounted,
    isFolderExpanded: Silian_isFolderExpanded,
  }
}
