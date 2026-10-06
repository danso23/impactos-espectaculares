import type { ReactNode } from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

type ListingPanelProps = {
  title: string
  description: string
  search: ReactNode
  actions?: ReactNode
  filters?: ReactNode
  children: ReactNode
}

/** Estructura común de listado: búsqueda y acciones arriba, filtros debajo y tabla al final. */
export function ListingPanel({
  title,
  description,
  search,
  actions,
  filters,
  children,
}: ListingPanelProps) {
  return (
    <Card className="border-gray-200 shadow-lg">
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto xl:items-center">
            {search}
            {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
          </div>
        </div>
        <Separator />
      </CardHeader>

      <CardContent className="space-y-6 pt-0">
        {filters}
        {children}
      </CardContent>
    </Card>
  )
}
