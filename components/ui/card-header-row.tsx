import { cn as Silian_cn } from "@/lib/cn"

interface CardHeaderRowProps {
  badge: React.ReactNode
  date: string | React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function CardHeaderRow({
  badge: Silian_badge,
  date: Silian_date,
  actions: Silian_actions,
  className: Silian_className,
}: CardHeaderRowProps) {
  return (
    <div className={Silian_cn("card-header-row", Silian_className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {Silian_badge}
          <span className="mono-label">{Silian_date}</span>
        </div>
        {Silian_actions && (
          <div className="flex flex-col items-end gap-1">{Silian_actions}</div>
        )}
      </div>
    </div>
  )
}
