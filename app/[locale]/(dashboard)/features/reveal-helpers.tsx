import * as Silian_React from "react"

/**
 * Server-safe reveal wrapper for resolved content sections.
 * Applies staged animation delays matching loading shell timing (0ms, 100ms, 200ms, 300ms, 400ms).
 * Uses simple fade-in: plain opacity transition only.
 */
export const RevealSection = Silian_React.forwardRef<
  HTMLDivElement,
  Silian_React.HTMLAttributes<HTMLDivElement> & {
    delay?: 0 | 100 | 200 | 300 | 400
  }
>(({ delay: Silian_delay = 0, className: Silian_className = "", ...Silian_props }, Silian_ref) => (
  <div
    ref={Silian_ref}
    className={`
      animate-fade-in
      ${Silian_className}
    `}
    style={{ animationDelay: `${Silian_delay}ms` }}
    {...Silian_props}
  />
))
RevealSection.displayName = "RevealSection"

/**
 * Fade-in wrapper for content that should reveal after frame settles.
 * Lighter animation for secondary content within sections.
 */
export const RevealContent = Silian_React.forwardRef<
  HTMLDivElement,
  Silian_React.HTMLAttributes<HTMLDivElement> & {
    delay?: 0 | 100 | 200 | 300 | 400
  }
>(({ delay: Silian_delay = 0, className: Silian_className = "", ...Silian_props }, Silian_ref) => (
  <div
    ref={Silian_ref}
    className={`
      animate-fade-in
      ${Silian_className}
    `}
    style={{ animationDelay: `${Silian_delay}ms` }}
    {...Silian_props}
  />
))
RevealContent.displayName = "RevealContent"
