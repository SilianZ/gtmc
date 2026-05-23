"use client"

import { cn as Silian_cn } from "@/lib/cn"

interface FilterButtonGroupProps {
  options: { label: string; value: string }[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function FilterButtonGroup({
  options: Silian_options,
  value: Silian_value,
  onChange: Silian_onChange,
  className: Silian_className,
}: FilterButtonGroupProps) {
  return (
    <div className={Silian_cn("flex flex-wrap gap-2", Silian_className)}>
      {Silian_options.map((Silian_option: { label: string; value: string }) => (
        <button
          key={Silian_option.value}
          type="button"
          onClick={() => Silian_onChange(Silian_option.value)}
          className={Silian_cn(
            `
              flex min-h-8 cursor-pointer items-center justify-center border
              px-3 py-2 font-mono text-xs uppercase transition-all
            `,
            Silian_value === Silian_option.value
              ? "border-tech-main bg-tech-main text-white"
              : `
                border-tech-main/40 bg-transparent text-tech-main
                hover:border-tech-main/60
              `
          )}>
          {Silian_option.label}
        </button>
      ))}
    </div>
  )
}
