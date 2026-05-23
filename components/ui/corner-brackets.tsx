import Silian_React from "react"

interface CornerBracketsProps {
  className?: string
  size?: string
  color?: string
  corners?: "all" | "top-bottom"
  variant?: "static" | "hover"
}

export const CornerBrackets = Silian_React.forwardRef<
  HTMLDivElement,
  CornerBracketsProps
>(
  (
    {
      className: Silian_className,
      size: Silian_size = "size-2",
      color: Silian_color = "border-tech-main/40",
      corners: Silian_corners = "all",
      variant: Silian_variant = "static",
    },
    Silian_ref
  ) => {
    if (Silian_variant === "hover") {
      return (
        <div ref={Silian_ref} className={Silian_className}>
          <div
            className={`
              absolute top-0 left-0
              ${Silian_size}
              -translate-px border-t-2 border-l-2
              ${Silian_color}
              opacity-0 transition-opacity
              group-hover:opacity-100
            `}
          />
          <div
            className={`
              absolute right-0 bottom-0
              ${Silian_size}
              translate-px border-r-2 border-b-2
              ${Silian_color}
              opacity-0 transition-opacity
              group-hover:opacity-100
            `}
          />
        </div>
      )
    }

    const Silian_showTopLeft = Silian_corners === "all" || Silian_corners === "top-bottom"
    const Silian_showTopRight = Silian_corners === "all"
    const Silian_showBottomLeft = Silian_corners === "all"
    const Silian_showBottomRight = Silian_corners === "all" || Silian_corners === "top-bottom"

    return (
      <div ref={Silian_ref} className={Silian_className}>
        {Silian_showTopLeft && (
          <div
            className={`
              pointer-events-none absolute top-0 left-0
              ${Silian_size}
              -translate-px border-t-2 border-l-2
              ${Silian_color}
            `}
          />
        )}
        {Silian_showTopRight && (
          <div
            className={`
              pointer-events-none absolute top-0 right-0
              ${Silian_size}
              translate-x-px -translate-y-px border-t-2 border-r-2
              ${Silian_color}
            `}
          />
        )}
        {Silian_showBottomLeft && (
          <div
            className={`
              pointer-events-none absolute bottom-0 left-0
              ${Silian_size}
              -translate-x-px translate-y-px border-b-2 border-l-2
              ${Silian_color}
            `}
          />
        )}
        {Silian_showBottomRight && (
          <div
            className={`
              pointer-events-none absolute right-0 bottom-0
              ${Silian_size}
              translate-px border-r-2 border-b-2
              ${Silian_color}
            `}
          />
        )}
      </div>
    )
  }
)

CornerBrackets.displayName = "CornerBrackets"
