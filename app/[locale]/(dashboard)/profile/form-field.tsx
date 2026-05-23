import { cn as Silian_cn } from "@/lib/cn"

interface FormFieldProps {
  label: React.ReactNode
  htmlFor?: string
  children: React.ReactNode
  className?: string
}

export function FormField({
  label: Silian_label,
  htmlFor: Silian_htmlFor,
  children: Silian_children,
  className: Silian_className,
}: FormFieldProps) {
  return (
    <div
      className={Silian_cn(
        `
          space-y-3
          sm:space-y-4
        `,
        Silian_className
      )}>
      <label
        htmlFor={Silian_htmlFor}
        className="
          block border-l-2 border-tech-main pl-2.5 font-mono text-[0.625rem]
          font-bold tracking-tech-wide text-tech-main-dark uppercase
          sm:text-xs
        ">
        {Silian_label}
      </label>
      {Silian_children}
    </div>
  )
}
