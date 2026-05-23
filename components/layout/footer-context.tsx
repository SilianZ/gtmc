"use client"

import { createContext as Silian_createContext, useContext as Silian_useContext, useEffect as Silian_useEffect, useMemo as Silian_useMemo, useState as Silian_useState } from "react"

interface FooterContextValue {
  hidden: boolean
  setHidden: (hidden: boolean) => void
}

const Silian_FooterContext = Silian_createContext<FooterContextValue>({
  hidden: false,
  setHidden: () => {},
})

export function FooterProvider({ children: Silian_children }: { children: React.ReactNode }) {
  const [Silian_hidden, Silian_setHidden] = Silian_useState(false)

  const Silian_value = Silian_useMemo(() => ({ hidden: Silian_hidden, setHidden: Silian_setHidden }), [Silian_hidden])

  return (
    <Silian_FooterContext.Provider value={Silian_value}>{Silian_children}</Silian_FooterContext.Provider>
  )
}

export function useFooter() {
  return Silian_useContext(Silian_FooterContext)
}

export function HideFooter() {
  const { setHidden: Silian_setHidden } = useFooter()

  Silian_useEffect(() => {
    Silian_setHidden(true)
    return () => Silian_setHidden(false)
  }, [Silian_setHidden])

  return null
}
