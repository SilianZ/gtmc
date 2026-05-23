import { cn as Silian_cn } from "@/lib/cn"

interface MetadataRowProps {
  label: string
  value: React.ReactNode
  className?: string
}

export function MetadataRow({ label: Silian_label, value: Silian_value, className: Silian_className }: MetadataRowProps) {
  return (
    <div
      className={Silian_cn(
        `
          flex flex-col gap-2
          sm:flex-row sm:items-center
        `,
        Silian_className
      )}>
      <span
        className="
          mono-label font-bold text-zinc-500
          sm:w-24
        ">
        {Silian_label}
      </span>
      <span className="wrap-break-word">{Silian_value}</span>
    </div>
  )
}
