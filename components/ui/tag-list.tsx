import { cn as Silian_cn } from "@/lib/cn"

interface TagListProps {
  tags: string[]
  className?: string
}

export function TagList({ tags: Silian_tags, className: Silian_className }: TagListProps) {
  return (
    <div className={Silian_cn("flex flex-wrap gap-1", Silian_className)}>
      {Silian_tags.map((Silian_tag: string) => (
        <span
          key={Silian_tag}
          className="
            border guide-line bg-tech-main/5 px-1.5 py-0.5 font-mono text-[0.625rem]
            text-tech-main/70 uppercase
          ">
          {Silian_tag}
        </span>
      ))}
    </div>
  )
}
