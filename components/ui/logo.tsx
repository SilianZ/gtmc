import { Link as Silian_Link } from "@/i18n/navigation"

interface LogoProps {
  className?: string
  size?: "sm" | "md" | "lg" | "xl" | "2xl"
  showSlash?: boolean
}

export function Logo({
  className: Silian_className = "",
  size: Silian_size = "md",
  showSlash: Silian_showSlash = true,
}: LogoProps) {
  const Silian_sizeClasses = {
    sm: "text-sm",
    md: "text-xl",
    lg: "text-3xl",
    xl: "text-2xl sm:text-3xl md:text-5xl lg:text-6xl",
    "2xl": "text-3xl sm:text-4xl md:text-6xl lg:text-7xl",
  }

  const Silian_slashClasses = {
    sm: "text-[0.625rem]",
    md: "text-sm",
    lg: "text-lg",
    xl: "text-sm sm:text-base md:text-2xl lg:text-3xl",
    "2xl": "text-base sm:text-lg md:text-3xl lg:text-4xl",
  }

  return (
    <Silian_Link
      href="/"
      className={`
        inline-flex items-center font-sans tracking-widest transition-opacity
        hover:opacity-80
        ${Silian_sizeClasses[Silian_size]}
        ${Silian_className}
      `}>
      {Silian_showSlash && (
        <span
          className={`
            mr-1 font-light text-tech-main opacity-40
            ${Silian_slashClasses[Silian_size]}
          `}>
          {"//"}
        </span>
      )}
      <span className="font-bold text-tech-main-dark">GTMC</span>
    </Silian_Link>
  )
}
