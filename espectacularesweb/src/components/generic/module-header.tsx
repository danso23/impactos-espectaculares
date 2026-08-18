import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

type ModuleHeaderProps = {
  title: string
  badge: string
  description: string
  icon: LucideIcon
  actions?: ReactNode
}

export function ModuleHeader({
  title,
  badge,
  description,
  icon: Icon,
  actions,
}: ModuleHeaderProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
          <div className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
            <Icon className="h-3.5 w-3.5" />
            {badge}
          </div>
        </div>
        <p className="mt-2 max-w-2xl text-gray-600">{description}</p>
      </div>

      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  )
}
