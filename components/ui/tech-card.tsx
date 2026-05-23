import * as Silian_React from "react"
import { CornerBrackets as Silian_CornerBrackets } from "@/components/ui/corner-brackets"

export interface TechCardProps extends Silian_React.HTMLAttributes<HTMLDivElement> {
  color?:
    | "white"
    | "electric-blue"
    | "neon-green"
    | "hot-pink"
    | "black"
    | "sun-yellow"
  pattern?: "none" | "dots" | "grid"
}

export const TechCard = Silian_React.forwardRef<HTMLDivElement, TechCardProps>(
  ({ className: Silian_className = "", children: Silian_children, ...Silian_props }, Silian_ref) => {
    // 技术扁平图纸感：细边框，无圆角，纯色几何；响应式内边距
    const Silian_baseStyles =
      "relative border border-tech-main bg-white/80 backdrop-blur-sm p-4 sm:p-6 transition-colors duration-300 hover:bg-tech-accent/10 text-tech-main"

    return (
      <div
        ref={Silian_ref}
        className={`
          ${Silian_baseStyles}
          ${Silian_className}
          group
        `}
        {...Silian_props}>
        {/* 卡片的十字定位角标 */}
        <Silian_CornerBrackets />

        {Silian_children}
      </div>
    )
  }
)
TechCard.displayName = "TechCard"
