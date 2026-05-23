"use client"

import { useEffect as Silian_useEffect, useRef as Silian_useRef, useState as Silian_useState, type MouseEvent } from "react"
import { CornerBrackets as Silian_CornerBrackets } from "@/components/ui/corner-brackets"

// Interfaces for schematic-renderer library
interface SchematicManager {
  getFirstSchematic?: () => { id: string }
  getSchematic?: (id: string) => unknown
  getMaxSchematicDimensions?: () => { x: number; y: number; z: number }
  loadSchematic?: (name: string, buffer: ArrayBuffer) => Promise<void>
}

interface UIManager {
  showFPVOverlay?: () => void
  fpvOverlay?: HTMLElement
}

interface CanvasWithPatch extends HTMLCanvasElement {
  __gtmcPointerCapturePatched?: boolean
}

interface FlyControls {
  setOverlayVisible?: () => void
  overlayElement?: HTMLElement
  __gtmcSafeLockPatched?: boolean
  lock?: () => void
  enabled?: boolean
  isLocked?: boolean
  getPointerLockControls?: () => { domElement?: HTMLElement }
}

interface CameraManager {
  flyControls?: FlyControls
  isFlyControlsLocked?: () => boolean
  isFlyControlsEnabled?: () => boolean
  disableFlyControls?: () => void
  enableFlyControls?: () => void
  stopAnimation?: () => void
  stopAutoOrbit?: () => void
  setAutoOrbitAfterZoom?: (value: boolean) => void
  setZoomInOnLoad?: (value: boolean) => void
  setFlyControlsSettings?: (settings: unknown) => void
  focusOnSchematic?: (opts: { animationDuration: number; skipPathFitting: boolean }) => Promise<void>
}

interface LitematicaRenderer {
  getLoadedSchematics?: () => string[]
  schematicManager?: SchematicManager
  uiManager?: UIManager
  cameraManager?: CameraManager
  dispose?: () => void
  enabled?: boolean
  isLocked?: boolean
  flyControls?: FlyControls
  isFlyControlsLocked?: () => boolean
  resetRenderingBounds?: (schematicId: string, all: boolean) => void
  setRenderingBounds?: (
    schematicId: string,
    min: [number, number, number],
    max: [number, number, number],
    all: boolean
  ) => void
  renderManager?: { render?: () => void }
  targetFPS?: number
  idleFPS?: number
  enableAdaptiveFPS?: boolean
}

export interface LitematicaViewerProps {
  url: string
  height?: string | number
}

export default function LitematicaViewer({
  url: Silian_url,
  height: Silian_height = 400,
}: LitematicaViewerProps) {
  const Silian_ACTIVE_TARGET_FPS = 60
  const Silian_IDLE_TARGET_FPS = 24
  const Silian_canvasRef = Silian_useRef<CanvasWithPatch | null>(null)
  const Silian_rendererRef = Silian_useRef<LitematicaRenderer | null>(null)
  const Silian_schematicIdRef = Silian_useRef<string | null>(null)
  const Silian_loadTokenRef = Silian_useRef(0)
  const Silian_lastPointerUnlockAtRef = Silian_useRef(Number.NEGATIVE_INFINITY)

  const [Silian_maxLayer, Silian_setMaxLayer] = Silian_useState(0)
  const [Silian_sliderLayer, Silian_setSliderLayer] = Silian_useState(0)
  const [Silian_targetLayer, Silian_setTargetLayer] = Silian_useState<number | "all">("all")
  const [Silian_layerMode, Silian_setLayerMode] = Silian_useState<"single" | "below">("below")
  const [Silian_schematicReady, Silian_setSchematicReady] = Silian_useState(false)
  const [Silian_isFlyMode, Silian_setIsFlyMode] = Silian_useState(false)
  const [Silian_isFlyEnabled, Silian_setIsFlyEnabled] = Silian_useState(false)

  const Silian_POINTER_LOCK_COOLDOWN_MS = 350

  const Silian_resolveLoadedSchematicId = (Silian_renderer: LitematicaRenderer) => {
    const Silian_loadedSchematics = Silian_renderer?.getLoadedSchematics?.()

    if (Array.isArray(Silian_loadedSchematics) && Silian_loadedSchematics.length > 0) {
      if (
        Silian_schematicIdRef.current &&
        Silian_loadedSchematics.includes(Silian_schematicIdRef.current)
      ) {
        return Silian_schematicIdRef.current
      }

      return Silian_loadedSchematics[0]
    }

    return Silian_renderer?.schematicManager?.getFirstSchematic?.()?.id ?? null
  }

  const Silian_normalizeUrlInput = (Silian_input: string) => {
    let Silian_value = Silian_input
      .replace(/\r?\n/g, "")
      .trim()
      .replace(/^['"]|['"]$/g, "")

    // Some markdown pipelines may hand us pre-encoded strings.
    for (let Silian_i = 0; Silian_i < 2; Silian_i++) {
      try {
        const Silian_decoded = decodeURIComponent(Silian_value)
        if (Silian_decoded === Silian_value) break
        Silian_value = Silian_decoded
      } catch {
        break
      }
    }

    return Silian_value
  }

  const Silian_suppressNativeFpOverlays = (Silian_instance: LitematicaRenderer) => {
    const Silian_ui = Silian_instance?.uiManager
    const Silian_cm = Silian_instance?.cameraManager

    try {
      if (Silian_ui) {
        Silian_ui.showFPVOverlay = () => {}
        if (Silian_ui.fpvOverlay) {
          Silian_ui.fpvOverlay.style.setProperty("display", "none", "important")
          Silian_ui.fpvOverlay.style.setProperty("pointer-events", "none", "important")
          Silian_ui.fpvOverlay.style.setProperty("opacity", "0", "important")
        }
      }

      if (Silian_cm?.flyControls) {
        Silian_cm.flyControls.setOverlayVisible = () => {}
        if (Silian_cm.flyControls.overlayElement) {
          Silian_cm.flyControls.overlayElement.style.setProperty(
            "display",
            "none",
            "important"
          )
          Silian_cm.flyControls.overlayElement.style.setProperty(
            "pointer-events",
            "none",
            "important"
          )
          Silian_cm.flyControls.overlayElement.style.setProperty("opacity", "0", "important")
        }
      }
    } catch {
      // Keep rendering resilient even if internals change.
    }
  }

  const Silian_patchFlyLockWithCooldown = (Silian_cameraManager: CameraManager) => {
    const Silian_flyControls = Silian_cameraManager?.flyControls
    if (!Silian_flyControls) return
    if (Silian_flyControls.__gtmcSafeLockPatched) return

    const Silian_originalLock =
      typeof Silian_flyControls.lock === "function" ? Silian_flyControls.lock.bind(Silian_flyControls) : null
    if (!Silian_originalLock) return

    const Silian_pointerLockControls = Silian_flyControls.getPointerLockControls?.()
    const Silian_pointerLockElement = Silian_pointerLockControls?.domElement || Silian_canvasRef.current

    Silian_flyControls.lock = () => {
      if (!Silian_flyControls.enabled || Silian_flyControls.isLocked) return

      if (document.pointerLockElement === Silian_canvasRef.current) return

      const Silian_elapsedSinceUnlock = performance.now() - Silian_lastPointerUnlockAtRef.current
      if (Silian_elapsedSinceUnlock < Silian_POINTER_LOCK_COOLDOWN_MS) {
        return
      }

      try {
        if (
          Silian_pointerLockElement &&
          typeof Silian_pointerLockElement.requestPointerLock === "function"
        ) {
          const Silian_lockResult = Silian_pointerLockElement.requestPointerLock()

          if (Silian_lockResult && typeof Silian_lockResult.catch === "function") {
            Silian_lockResult.catch(() => {
              // Swallow rejected pointer lock promises; state is handled by events.
            })
          }

          return
        }

        Silian_originalLock()
      } catch {
        // Ignore lock failures; pointerlockerror handler updates UI state.
      }
    }

    Silian_flyControls.__gtmcSafeLockPatched = true
  }

  const Silian_patchCanvasPointerCapture = (Silian_canvas: CanvasWithPatch) => {
    if (Silian_canvas.__gtmcPointerCapturePatched) return

    const Silian_canvasAny = Silian_canvas as unknown as CanvasWithPatch & Record<string, unknown>
    const Silian_originalSetPointerCapture =
      typeof Silian_canvas.setPointerCapture === "function"
        ? Silian_canvas.setPointerCapture.bind(Silian_canvas)
        : null
    const Silian_originalReleasePointerCapture =
      typeof Silian_canvas.releasePointerCapture === "function"
        ? Silian_canvas.releasePointerCapture.bind(Silian_canvas)
        : null

    if (Silian_originalSetPointerCapture) {
      Silian_canvasAny.setPointerCapture = (Silian_pointerId: number) => {
        try {
          Silian_originalSetPointerCapture(Silian_pointerId)
        } catch {
          // Ignore invalid pointer capture states from transient pointer lifecycle races.
        }
      }
    }

    if (Silian_originalReleasePointerCapture) {
      Silian_canvasAny.releasePointerCapture = (Silian_pointerId: number) => {
        try {
          Silian_originalReleasePointerCapture(Silian_pointerId)
        } catch {
          // Ignore invalid pointer release states for symmetry with setPointerCapture.
        }
      }
    }

    Silian_canvasAny.__gtmcOriginalSetPointerCapture = Silian_originalSetPointerCapture
    Silian_canvasAny.__gtmcOriginalReleasePointerCapture = Silian_originalReleasePointerCapture
    Silian_canvasAny.__gtmcPointerCapturePatched = true
  }

  const Silian_restoreCanvasPointerCapture = (Silian_canvas: CanvasWithPatch | null) => {
    if (!Silian_canvas) return
    if (!Silian_canvas.__gtmcPointerCapturePatched) return

    const Silian_canvasAny = Silian_canvas as unknown as CanvasWithPatch & Record<string, unknown>
    if ((Silian_canvas as CanvasWithPatch & { __gtmcOriginalSetPointerCapture?: unknown })
      .__gtmcOriginalSetPointerCapture) {
      Silian_canvas.setPointerCapture = (Silian_canvas as CanvasWithPatch & { __gtmcOriginalSetPointerCapture?: typeof Silian_canvas.setPointerCapture })
        .__gtmcOriginalSetPointerCapture!
    }
    if (Silian_canvasAny.__gtmcOriginalReleasePointerCapture) {
      Silian_canvas.releasePointerCapture = Silian_canvasAny.__gtmcOriginalReleasePointerCapture as typeof Silian_canvas.releasePointerCapture
    }

    delete Silian_canvasAny.__gtmcOriginalSetPointerCapture
    delete Silian_canvasAny.__gtmcOriginalReleasePointerCapture
    delete Silian_canvasAny.__gtmcPointerCapturePatched
  }

  Silian_useEffect(() => {
    const Silian_canvas = Silian_canvasRef.current
    if (!Silian_canvas) return
    Silian_patchCanvasPointerCapture(Silian_canvas)

    const Silian_loadToken = ++Silian_loadTokenRef.current
    let Silian_isActive = true
    const Silian_schematicRequestController = new AbortController()

    Silian_setSchematicReady(false)
    Silian_schematicIdRef.current = null
    Silian_setTargetLayer("all")
    Silian_setIsFlyMode(false)
    Silian_setIsFlyEnabled(false)

    const Silian_isCurrentLoad = () => Silian_isActive && Silian_loadToken === Silian_loadTokenRef.current

    const Silian_cleanUrl = Silian_normalizeUrlInput(Silian_url)
    let Silian_renderer: LitematicaRenderer | null = null

    const Silian_proxyUrl = `/api/litematica-download?${new URLSearchParams({
      url: Silian_cleanUrl,
      ts: String(Date.now()),
    }).toString()}`

    const Silian_initRenderer = async () => {
      try {
        const Silian_mod = await import("schematic-renderer") as unknown as {
          SchematicRenderer?: new (canvas: HTMLCanvasElement, opts: unknown, fetchFn: unknown, config: unknown) => LitematicaRenderer
          default?: { SchematicRenderer?: new (canvas: HTMLCanvasElement, opts: unknown, fetchFn: unknown, config: unknown) => LitematicaRenderer }
        }
        const Silian_SR =
          typeof Silian_mod.SchematicRenderer === "function"
            ? Silian_mod.SchematicRenderer
            : typeof Silian_mod.default === "function"
              ? Silian_mod.default
              : Silian_mod.default?.SchematicRenderer

        if (!Silian_SR) {
          throw new Error("SchematicRenderer constructor not found in module exports")
        }

        Silian_renderer = new Silian_SR(
          Silian_canvas,
          {},
          {
            default: async () => {
              const Silian_res = await fetch("/pack.zip")
              return await Silian_res.blob()
            },
          },
          {
            showGrid: true,
            backgroundColor: 0xf8f9fc,
            enableInteraction: false,
            enableDragAndDrop: false,
            enableGizmos: false,
            meshBuildingMode: "incremental",
            targetFPS: 120,
            idleFPS: 120,
            enableAdaptiveFPS: false,
            postProcessingOptions: {
              enabled: true,
              enableSSAO: false,
              enableSMAA: true,
              enableGamma: true,
            },
            ffmpeg: { terminate: () => {} },
            cameraOptions: {
              position: [10, 10, 10],
              autoOrbitAfterZoom: false,
              enableZoomInOnLoad: false,
            },
            callbacks: {
              onRendererInitialized: async (Silian_r: LitematicaRenderer) => {
                if (!Silian_isCurrentLoad()) {
                  Silian_r.dispose?.()
                  return
                }

                try {
                  Silian_suppressNativeFpOverlays(Silian_r)

                  const Silian_res = await fetch(Silian_proxyUrl, {
                    cache: "no-store",
                    signal: Silian_schematicRequestController.signal,
                  })
                  if (!Silian_res.ok) {
                    throw new Error("Failed to fetch proxy: " + Silian_res.status)
                  }
                  let Silian_arrayBuffer = await Silian_res.arrayBuffer()

                  const Silian_fileName = Silian_cleanUrl.split("/").pop() || "schem.litematic"
                  await Silian_r.schematicManager?.loadSchematic?.(Silian_fileName, Silian_arrayBuffer)
                  Silian_arrayBuffer = new ArrayBuffer(0)

                  if (!Silian_isCurrentLoad()) {
                    Silian_r.dispose?.()
                    return
                  }

                  const Silian_resolvedSchematicId = Silian_resolveLoadedSchematicId(Silian_r)
                  if (!Silian_resolvedSchematicId) {
                    throw new Error("No loaded schematic ID found after loadSchematic")
                  }
                  Silian_schematicIdRef.current = Silian_resolvedSchematicId

                  const Silian_dim = Silian_r.schematicManager?.getMaxSchematicDimensions?.()
                  if (Silian_dim) {
                    const Silian_topLayer = Math.max(0, Math.ceil(Silian_dim.y) - 1)
                    Silian_setMaxLayer(Silian_topLayer)
                    Silian_setSliderLayer(Silian_topLayer)
                  }

                  // Avoid camera animation/auto orbit fighting with first-person controls.
                  await Silian_r.cameraManager?.focusOnSchematic?.({
                    animationDuration: 0,
                    skipPathFitting: true,
                  })
                  Silian_r.cameraManager?.stopAnimation?.()
                  Silian_r.cameraManager?.stopAutoOrbit?.()
                  Silian_r.cameraManager?.setAutoOrbitAfterZoom?.(false)

                  Silian_suppressNativeFpOverlays(Silian_r)
                  if (!Silian_isCurrentLoad()) return

                  Silian_r.targetFPS = Silian_ACTIVE_TARGET_FPS
                  Silian_r.idleFPS = Silian_IDLE_TARGET_FPS
                  Silian_r.enableAdaptiveFPS = true

                  Silian_setSchematicReady(true)
                } catch (Silian_err) {
                  if (Silian_err instanceof Error && Silian_err.name === "AbortError") {
                    return
                  }

                  console.error("Error loading schematic:", Silian_err)
                }
              },
              onSchematicFileLoadFailure: (Silian_err: Error) => {
                console.error("Failed to load schematic file:", Silian_err)
              },
            },
          }
        )

        if (!Silian_isCurrentLoad()) {
          Silian_renderer?.dispose?.()
          return
        }

        Silian_rendererRef.current = Silian_renderer
      } catch (Silian_e) {
        console.error("Error setting up schematic-renderer:", Silian_e)
      }
    }

    const Silian_handlePointerLockChange = () => {
      const Silian_current = Silian_rendererRef.current
      if (!Silian_current) return

      Silian_suppressNativeFpOverlays(Silian_current)

      const Silian_cm = Silian_current.cameraManager
      const Silian_locked = Silian_cm?.isFlyControlsLocked?.() ?? document.pointerLockElement === Silian_canvas
      const Silian_flyEnabled = Boolean(Silian_cm?.isFlyControlsEnabled?.())

      if (!Silian_locked) {
        Silian_lastPointerUnlockAtRef.current = performance.now()
      }

      Silian_setIsFlyEnabled(Silian_flyEnabled)
      Silian_setIsFlyMode(Boolean(Silian_locked && Silian_flyEnabled))
    }

    const Silian_handlePointerLockError = (Silian_event: Event) => {
      const Silian_current = Silian_rendererRef.current
      const Silian_cm = Silian_current?.cameraManager
      if (!Silian_cm?.isFlyControlsEnabled?.()) {
        return
      }

      Silian_lastPointerUnlockAtRef.current = performance.now()

      Silian_cm.disableFlyControls?.()
      Silian_setIsFlyMode(false)
      Silian_setIsFlyEnabled(false)

      // Prevent PointerLockControls' internal error listener from logging noisy errors.
      Silian_event.stopImmediatePropagation()
    }

    const Silian_handleEscapeKeyDown = (Silian_event: KeyboardEvent) => {
      if (Silian_event.code !== "Escape") return

      const Silian_current = Silian_rendererRef.current
      const Silian_cm = Silian_current?.cameraManager
      if (Silian_cm?.isFlyControlsEnabled?.()) {
        // ESC acts as explicit exit from first-person mode.
        Silian_lastPointerUnlockAtRef.current = performance.now()
        Silian_cm.disableFlyControls?.()
        Silian_setIsFlyMode(false)
        Silian_setIsFlyEnabled(false)
      }
    }

    document.addEventListener("pointerlockchange", Silian_handlePointerLockChange)
    document.addEventListener("pointerlockerror", Silian_handlePointerLockError, true)
    document.addEventListener("keydown", Silian_handleEscapeKeyDown, true)
    Silian_initRenderer()

    return () => {
      Silian_isActive = false
      Silian_schematicRequestController.abort()
      document.removeEventListener("pointerlockchange", Silian_handlePointerLockChange)
      document.removeEventListener("pointerlockerror", Silian_handlePointerLockError, true)
      document.removeEventListener("keydown", Silian_handleEscapeKeyDown, true)
      Silian_setSchematicReady(false)
      Silian_schematicIdRef.current = null
      Silian_setIsFlyMode(false)
      Silian_setIsFlyEnabled(false)

      if (
        Silian_rendererRef.current?.cameraManager?.isFlyControlsEnabled?.() &&
        typeof Silian_rendererRef.current.cameraManager.disableFlyControls === "function"
      ) {
        Silian_rendererRef.current.cameraManager.disableFlyControls()
      }

      if (Silian_rendererRef.current && typeof Silian_rendererRef.current.dispose === "function") {
        Silian_rendererRef.current.dispose()
      }

      Silian_restoreCanvasPointerCapture(Silian_canvas)

      Silian_rendererRef.current = null
    }
  }, [Silian_url])

  Silian_useEffect(() => {
    if (!Silian_schematicReady || !Silian_rendererRef.current) {
      return
    }

    const Silian_renderer = Silian_rendererRef.current
    if (!Silian_renderer) return

    const Silian_sm = Silian_renderer.schematicManager
    if (!Silian_sm) return

    const Silian_schematicId = Silian_resolveLoadedSchematicId(Silian_renderer)
    if (!Silian_schematicId) return

    Silian_schematicIdRef.current = Silian_schematicId
    if (!Silian_sm.getSchematic?.(Silian_schematicId)) return

    const Silian_dim = Silian_sm.getMaxSchematicDimensions?.()
    if (!Silian_dim) return

    const Silian_maxX = Math.max(1, Math.ceil(Silian_dim.x))
    const Silian_maxY = Math.max(1, Math.ceil(Silian_dim.y))
    const Silian_maxZ = Math.max(1, Math.ceil(Silian_dim.z))

    try {
      if (Silian_targetLayer === "all") {
        Silian_renderer?.resetRenderingBounds?.(Silian_schematicId, true)
      } else {
        const Silian_y = Math.max(0, Math.min(Silian_targetLayer, Silian_maxY - 1))

        if (Silian_layerMode === "single") {
          Silian_renderer?.setRenderingBounds?.(
            Silian_schematicId,
            [0, Silian_y, 0],
            [Silian_maxX, Silian_y + 1, Silian_maxZ],
            false
          )
        } else {
          Silian_renderer?.setRenderingBounds?.(
            Silian_schematicId,
            [0, 0, 0],
            [Silian_maxX, Silian_y + 1, Silian_maxZ],
            false
          )
        }
      }

      Silian_renderer?.renderManager?.render?.()
    } catch (Silian_error) {
      console.error("Failed to update rendering bounds:", Silian_error)
    }
  }, [Silian_schematicReady, Silian_targetLayer, Silian_layerMode])

  const Silian_commitLayerSelection = () => {
    if (!Silian_schematicReady) return
    Silian_setTargetLayer(Silian_sliderLayer)
  }

  const Silian_toggleFlyMode = (Silian_event: MouseEvent<HTMLButtonElement>) => {
    Silian_event.stopPropagation()

    const Silian_current = Silian_rendererRef.current
    if (!Silian_current?.cameraManager) return

    const Silian_cm = Silian_current.cameraManager
    Silian_suppressNativeFpOverlays(Silian_current)

    Silian_cm.stopAnimation?.()
    Silian_cm.stopAutoOrbit?.()
    Silian_cm.setAutoOrbitAfterZoom?.(false)
    Silian_cm.setZoomInOnLoad?.(false)

    const Silian_flyEnabled = Boolean(Silian_cm.isFlyControlsEnabled?.())

    if (Silian_flyEnabled) {
      Silian_lastPointerUnlockAtRef.current = performance.now()
      Silian_cm.disableFlyControls?.()
      Silian_setIsFlyMode(false)
      Silian_setIsFlyEnabled(false)
      return
    }

    Silian_cm.enableFlyControls?.()
    Silian_cm.setFlyControlsSettings?.({
      moveSpeed: 16,
      sprintMultiplier: 2.4,
      keybinds: {
        up: "Space",
        down: "KeyC",
        sprint: "ShiftLeft",
      },
    })

    Silian_patchFlyLockWithCooldown(Silian_cm)
    // If already enabled but unlocked, this acts as a reliable re-lock action.
    Silian_cm.flyControls?.lock?.()

    Silian_setIsFlyEnabled(true)
    Silian_setIsFlyMode(Boolean(Silian_cm.isFlyControlsLocked?.()))
  }

  return (
    <div
      className="
      group relative my-8 w-full rounded-sm border-2 guide-line bg-tech-bg
      font-mono
    "
    >
      <Silian_CornerBrackets size="size-4" color="border-tech-main/40" />

      <canvas
        ref={Silian_canvasRef}
        className="block w-full outline-none"
        style={{
          cursor: Silian_isFlyMode ? "crosshair" : "pointer",
          height: typeof Silian_height === "number" ? Silian_height + "px" : Silian_height,
        }}
      />

      <button
        type="button"
        onClick={Silian_toggleFlyMode}
        className={`absolute top-4 right-4 z-20 border px-3 py-1 text-[11px] font-bold tracking-widest uppercase transition-colors ${
          Silian_isFlyEnabled
            ? "border-tech-main bg-tech-main text-white"
            : "border-tech-main/60 bg-white/90 text-tech-main hover:bg-tech-main hover:text-white"
        }`}
      >
        {Silian_isFlyEnabled ? "SYS.EXIT_FLY" : "SYS.FIRST_PERSON"}
      </button>

      <div
        className="
        pointer-events-none absolute top-4 left-4 flex items-center gap-3
      "
      >
        <span
          className="
          shrink-0 border border-tech-main/40 bg-white/70 px-2 py-0.5 text-xs
          font-bold tracking-wider text-tech-main shadow-sm backdrop-blur-sm
        "
        >
          [LITEMATICA]
        </span>
        <span
          className="
          hidden text-[10px] tracking-widest text-tech-main/80 uppercase
          md:inline-block
        "
        >
          INTERACTIVE BLUEPRINT
        </span>
      </div>

      {Silian_maxLayer > 0 && (
        <div
          className={`absolute right-4 bottom-16 z-10 w-[250px] border border-tech-main/60 bg-white/90 p-3 text-tech-main shadow-sm backdrop-blur-md transition-all ${
            Silian_isFlyEnabled ? "pointer-events-none translate-x-2 opacity-0" : "opacity-100"
          }`}
        >
          <div className="mb-2 flex items-center justify-between border-b guide-line pb-1">
            <span className="text-[10px] font-bold tracking-widest uppercase">
              SYS.LAYER_FILTER
            </span>

            <button
              type="button"
              onClick={() => {
                Silian_setTargetLayer("all")
                Silian_setSliderLayer(Silian_maxLayer)
              }}
              className="border border-tech-main/30 px-1.5 py-0.5 text-[10px] font-bold uppercase transition-colors hover:bg-tech-main hover:text-white"
            >
              RESET
            </button>
          </div>

          <div className="mb-2 flex items-center justify-between text-xs font-bold">
            <span>LAYER {Silian_targetLayer === "all" ? "ALL" : Silian_targetLayer}</span>
            {Silian_targetLayer !== "all" && Silian_targetLayer !== Silian_sliderLayer && (
              <span className="text-[10px] opacity-70">PENDING {Silian_sliderLayer}</span>
            )}
          </div>

          <div className="mb-3 flex border border-tech-main/40 text-[10px] font-bold uppercase">
            <button
              type="button"
              onClick={() => Silian_setLayerMode("single")}
              className={`flex-1 py-1 transition-colors ${
                Silian_layerMode === "single"
                  ? "bg-tech-main text-white"
                  : "bg-white text-tech-main hover:bg-tech-main/10"
              }`}
            >
              SINGLE
            </button>

            <button
              type="button"
              onClick={() => Silian_setLayerMode("below")}
              className={`flex-1 border-l border-tech-main/40 py-1 transition-colors ${
                Silian_layerMode === "below"
                  ? "bg-tech-main text-white"
                  : "bg-white text-tech-main hover:bg-tech-main/10"
              }`}
            >
              BELOW
            </button>
          </div>

          <input
            type="range"
            min={0}
            max={Silian_maxLayer}
            value={Silian_sliderLayer}
            onChange={(Silian_e) => Silian_setSliderLayer(Number(Silian_e.target.value))}
            onPointerUp={Silian_commitLayerSelection}
            onMouseUp={Silian_commitLayerSelection}
            onTouchEnd={Silian_commitLayerSelection}
            onKeyUp={Silian_commitLayerSelection}
            data-litematica-layer-slider className="w-full cursor-ew-resize"
          />

          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={Silian_commitLayerSelection}
              className="border border-tech-main px-2 py-0.5 text-[10px] font-bold uppercase transition-colors hover:bg-tech-main hover:text-white"
            >
              APPLY
            </button>
          </div>

          <style
            dangerouslySetInnerHTML={{
              __html: `
              .style-litematica-layer-slider {
                -webkit-appearance: none;
                appearance: none;
                height: 2px;
                background: rgba(71, 85, 105, 0.28);
                outline: none;
              }
              .style-litematica-layer-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 8px;
                height: 16px;
                background: var(--color-tech-main);
                cursor: ew-resize;
                border-radius: 0;
              }
              .style-litematica-layer-slider::-moz-range-thumb {
                width: 8px;
                height: 16px;
                background: var(--color-tech-main);
                cursor: ew-resize;
                border-radius: 0;
                border: none;
              }
            `,
            }}
          />
        </div>
      )}

      <div
        className="
        pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2
        opacity-80 transition-opacity duration-300
        group-hover:opacity-100
      "
      >
        <div
          className="
          flex items-center gap-4 rounded-sm border guide-line bg-white/80 px-3
          py-1.5 text-xs whitespace-nowrap text-tech-main/80 shadow-sm
          backdrop-blur-md
        "
        >
          {Silian_isFlyEnabled ? (
            <>
              <span className="flex items-center gap-1.5">
                <kbd className="rounded-[2px] border border-tech-main/30 bg-white px-1.5 py-0.5 font-sans text-[10px] font-semibold text-tech-main shadow-sm">
                  WASD
                </kbd>{" "}
                Move
              </span>
              <span className="flex items-center gap-1.5 opacity-60">|</span>
              <span className="flex items-center gap-1.5">
                <kbd className="rounded-[2px] border border-tech-main/30 bg-white px-1.5 py-0.5 font-sans text-[10px] font-semibold text-tech-main shadow-sm">
                  SPACE
                </kbd>{" "}
                Up
              </span>
              <span className="flex items-center gap-1.5 opacity-60">|</span>
              <span className="flex items-center gap-1.5">
                <kbd className="rounded-[2px] border border-tech-main/30 bg-white px-1.5 py-0.5 font-sans text-[10px] font-semibold text-tech-main shadow-sm">
                  C
                </kbd>{" "}
                Down
              </span>
              <span className="flex items-center gap-1.5 opacity-60">|</span>
              <span className="flex items-center gap-1.5">
                <kbd className="rounded-[2px] border border-tech-main/30 bg-white px-1.5 py-0.5 font-sans text-[10px] font-semibold text-tech-main shadow-sm">
                  ESC
                </kbd>{" "}
                Unlock
              </span>
              {!Silian_isFlyMode && (
                <>
                  <span className="flex items-center gap-1.5 opacity-60">|</span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="rounded-[2px] border border-tech-main/30 bg-white px-1.5 py-0.5 font-sans text-[10px] font-semibold text-tech-main shadow-sm">
                      Click
                    </kbd>{" "}
                    Lock
                  </span>
                </>
              )}
            </>
          ) : (
            <>
              <span className="flex items-center gap-1.5">
                <kbd className="rounded-[2px] border border-tech-main/30 bg-white px-1.5 py-0.5 font-sans text-[10px] font-semibold text-tech-main shadow-sm">
                  Left
                </kbd>{" "}
                Rotate
              </span>
              <span className="flex items-center gap-1.5 opacity-60">|</span>
              <span className="flex items-center gap-1.5">
                <kbd className="rounded-[2px] border border-tech-main/30 bg-white px-1.5 py-0.5 font-sans text-[10px] font-semibold text-tech-main shadow-sm">
                  Right
                </kbd>{" "}
                Pan
              </span>
              <span className="flex items-center gap-1.5 opacity-60">|</span>
              <span className="flex items-center gap-1.5">
                <kbd className="rounded-[2px] border border-tech-main/30 bg-white px-1.5 py-0.5 font-sans text-[10px] font-semibold text-tech-main shadow-sm">
                  Wheel
                </kbd>{" "}
                Zoom
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
