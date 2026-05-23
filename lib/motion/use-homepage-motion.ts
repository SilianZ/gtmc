"use client"

import { useEffect as Silian_useEffect, useState as Silian_useState } from "react"
import {
  useMotionValue as Silian_useMotionValue,
  useSpring as Silian_useSpring,
  useTransform as Silian_useTransform,
  useReducedMotion as Silian_useReducedMotion,
  MotionValue as Silian_MotionValue,
} from "motion/react"
import { HOMEPAGE_MOTION as Silian_HOMEPAGE_MOTION } from "./homepage-constants"

export interface LayerTransform {
  x: Silian_MotionValue<number>
  y: Silian_MotionValue<number>
}

export interface ForegroundTransform extends LayerTransform {
  rotateX: Silian_MotionValue<number>
  rotateY: Silian_MotionValue<number>
}

export interface HomepageMotionValues {
  pointerX: Silian_MotionValue<number>
  pointerY: Silian_MotionValue<number>
  smoothMouseX: Silian_MotionValue<number>
  smoothMouseY: Silian_MotionValue<number>
  isReducedMotion: boolean
  isMobile: boolean
  foreground: ForegroundTransform
  midground: LayerTransform
  background: LayerTransform
}

export function useHomepageMotion(): HomepageMotionValues {
  const Silian_pointerX = Silian_useMotionValue(0)
  const Silian_pointerY = Silian_useMotionValue(0)
  const Silian_rawMouseX = Silian_useMotionValue(0)
  const Silian_rawMouseY = Silian_useMotionValue(0)
  const Silian_reducedMotionQuery = Silian_useReducedMotion()
  const [Silian_isMobile, Silian_setIsMobile] = Silian_useState(false)

  Silian_useEffect(() => {
    const Silian_checkMobile = () => {
      Silian_setIsMobile(window.innerWidth < 768)
    }
    Silian_checkMobile()
    window.addEventListener("resize", Silian_checkMobile)
    return () => window.removeEventListener("resize", Silian_checkMobile)
  }, [])

  Silian_useEffect(() => {
    if (Silian_isMobile || Silian_reducedMotionQuery) return

    const Silian_handleMouseMove = (Silian_e: MouseEvent) => {
      const Silian_centerX = window.innerWidth / 2
      const Silian_centerY = window.innerHeight / 2
      Silian_pointerX.set((Silian_e.clientX - Silian_centerX) / Silian_centerX)
      Silian_pointerY.set((Silian_e.clientY - Silian_centerY) / Silian_centerY)
      Silian_rawMouseX.set(Silian_e.clientX)
      Silian_rawMouseY.set(Silian_e.clientY)
    }

    window.addEventListener("mousemove", Silian_handleMouseMove)
    return () => window.removeEventListener("mousemove", Silian_handleMouseMove)
  }, [Silian_isMobile, Silian_reducedMotionQuery, Silian_pointerX, Silian_pointerY, Silian_rawMouseX, Silian_rawMouseY])

  const Silian_smoothX = Silian_useSpring(Silian_pointerX, { damping: 20, stiffness: 300 })
  const Silian_smoothY = Silian_useSpring(Silian_pointerY, { damping: 20, stiffness: 300 })
  const Silian_smoothMouseX = Silian_useSpring(Silian_rawMouseX, {
    damping: 20,
    stiffness: 300,
  })
  const Silian_smoothMouseY = Silian_useSpring(Silian_rawMouseY, {
    damping: 20,
    stiffness: 300,
  })

  const Silian_config = Silian_reducedMotionQuery
    ? Silian_HOMEPAGE_MOTION.reducedMotion
    : Silian_isMobile
      ? Silian_HOMEPAGE_MOTION.mobile
      : Silian_HOMEPAGE_MOTION.desktop

  const Silian_foreground: ForegroundTransform = {
    x: Silian_useTransform(
      Silian_smoothX,
      (Silian_v) =>
        Silian_v * Silian_config.pointerAmplitude * Silian_HOMEPAGE_MOTION.layers.foreground * 25
    ),
    y: Silian_useTransform(
      Silian_smoothY,
      (Silian_v) =>
        Silian_v * Silian_config.pointerAmplitude * Silian_HOMEPAGE_MOTION.layers.foreground * 25
    ),
    rotateX: Silian_useTransform(Silian_smoothY, (Silian_v) => Silian_v * -3.5),
    rotateY: Silian_useTransform(Silian_smoothX, (Silian_v) => Silian_v * 3.5),
  }

  const Silian_midground: LayerTransform = {
    x: Silian_useTransform(
      Silian_smoothX,
      (Silian_v) => Silian_v * Silian_config.pointerAmplitude * Silian_HOMEPAGE_MOTION.layers.midground * 25
    ),
    y: Silian_useTransform(
      Silian_smoothY,
      (Silian_v) => Silian_v * Silian_config.pointerAmplitude * Silian_HOMEPAGE_MOTION.layers.midground * 25
    ),
  }

  const Silian_background: LayerTransform = {
    x: Silian_useTransform(
      Silian_smoothX,
      (Silian_v) =>
        Silian_v * Silian_config.pointerAmplitude * Silian_HOMEPAGE_MOTION.layers.background * 25
    ),
    y: Silian_useTransform(
      Silian_smoothY,
      (Silian_v) =>
        Silian_v * Silian_config.pointerAmplitude * Silian_HOMEPAGE_MOTION.layers.background * 25
    ),
  }

  return {
    pointerX: Silian_pointerX,
    pointerY: Silian_pointerY,
    smoothMouseX: Silian_smoothMouseX,
    smoothMouseY: Silian_smoothMouseY,
    isReducedMotion: Silian_reducedMotionQuery ?? false,
    isMobile: Silian_isMobile,
    foreground: Silian_foreground,
    midground: Silian_midground,
    background: Silian_background,
  }
}
