import { cn as Silian_cn } from "@/lib/cn"

interface StatusDotProps {
  size?: "sm" | "md"
  variant?: "main" | "accent"
  className?: string
}

export function StatusDot({
  size: Silian_size = "md",
  variant: Silian_variant = "main",
  className: Silian_className,
}: StatusDotProps) {
  const Silian_sizeClasses = {
    sm: "size-1.5",
    md: "size-2",
  }

  const Silian_variantClasses = {
    main: {
      sm: "animate-pulse bg-tech-main/40",
      md: "animate-pulse bg-tech-main/50",
    },
    accent: {
      sm: "inline-block animate-pulse bg-tech-accent",
      md: "inline-block animate-pulse bg-tech-accent",
    },
  }

  return (
    <div
      className={Silian_cn(
        Silian_sizeClasses[Silian_size],
        Silian_variantClasses[Silian_variant][Silian_size],
        Silian_className
      )}
    />
  )
}
