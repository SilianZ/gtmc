import { cn as Silian_cn } from "@/lib/cn"

interface SectionTitleProps {
  children: React.ReactNode
  className?: string
}

export function SectionTitle({ children: Silian_children, className: Silian_className }: SectionTitleProps) {
  return (
    <h2
      className={Silian_cn(
        `
          mb-6 border-b guide-line pb-2 text-lg font-bold tracking-widest
          text-tech-main-dark uppercase
          md:text-xl
        `,
        Silian_className
      )}>
      {Silian_children}
    </h2>
  )
}
