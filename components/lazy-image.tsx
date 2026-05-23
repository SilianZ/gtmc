"use client"

import { useState as Silian_useState, useCallback as Silian_useCallback, useRef as Silian_useRef, useEffect as Silian_useEffect } from "react"

interface LazyImageProps {
  src: string
  alt: string
}

export function LazyImage({ src: Silian_src, alt: Silian_alt }: LazyImageProps) {
  const Silian_containerRef = Silian_useRef<HTMLDivElement>(null)
  const [Silian_shouldLoad, Silian_setShouldLoad] = Silian_useState(false)
  const [Silian_status, Silian_setStatus] = Silian_useState<"loading" | "loaded" | "error">(
    "loading"
  )

  Silian_useEffect(() => {
    const Silian_el = Silian_containerRef.current
    if (!Silian_el) return

    const Silian_observer = new IntersectionObserver(
      ([Silian_entry]) => {
        if (Silian_entry.isIntersecting) {
          Silian_setShouldLoad(true)
          Silian_observer.disconnect()
        }
      },
      { rootMargin: "400px", threshold: 0 }
    )

    Silian_observer.observe(Silian_el)
    return () => Silian_observer.disconnect()
  }, [])

  const Silian_handleLoad = Silian_useCallback(() => {
    Silian_setStatus("loaded")
  }, [])

  const Silian_handleError = Silian_useCallback(() => {
    Silian_setStatus("error")
  }, [])

  return (
    <div ref={Silian_containerRef} className="relative my-8 grid max-w-full">
      <div
        className={`
          z-10 col-start-1 row-start-1 flex min-h-[200px] w-full flex-col border
          border-tech-main/30 bg-tech-main/5 p-1 shadow-sm
          ${
            Silian_status === "loaded"
              ? `
                pointer-events-none animate-skeleton-exit opacity-0
                motion-reduce:animate-fade-out
              `
              : ""
          }
        `}
        aria-hidden="true">
        <div
          className="
            relative flex size-full flex-1 items-center justify-center
            overflow-hidden bg-tech-accent/10
          ">
          <div
            className="
              absolute top-0 left-0 size-2 border-t-2 border-l-2
              border-tech-main/30
            "
          />
          <div
            className="
              absolute top-0 right-0 size-2 border-t-2 border-r-2
              border-tech-main/30
            "
          />
          <div
            className="
              absolute bottom-0 left-0 size-2 border-b-2 border-l-2
              border-tech-main/30
            "
          />
          <div
            className="
              absolute right-0 bottom-0 size-2 border-r-2 border-b-2
              border-tech-main/30
            "
          />

          <span
            className="
              relative z-10 text-[0.5625rem] tracking-widest text-tech-main/40
              uppercase select-none
            ">
            {Silian_status === "error" ? "// LOAD_FAIL" : "// IMG_LOAD"}
          </span>

          {Silian_status === "loading" && (
            <div
              className="
                absolute inset-0 animate-blueprint-sweep bg-linear-to-r
                from-transparent via-tech-accent/30 to-transparent
                motion-reduce:animate-none
              "
            />
          )}
        </div>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={Silian_shouldLoad ? Silian_src : undefined}
        alt={Silian_alt}
        onLoad={Silian_handleLoad}
        onError={Silian_handleError}
        className={`
          z-0 col-start-1 row-start-1 h-auto max-w-full border
          border-tech-main/30 bg-tech-main/5 p-1 shadow-sm
          ${
            Silian_status === "loaded"
              ? `
                animate-fade-in
                motion-reduce:animate-none
              `
              : "opacity-0"
          }
        `}
      />
    </div>
  )
}
