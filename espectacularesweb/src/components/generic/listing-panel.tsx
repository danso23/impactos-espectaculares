import * as React from "react"
import type { ReactNode } from "react"
import { Search, SlidersHorizontal, SquareCheck, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type ListingPanelProps = {
  title: string
  description: string
  /** Buscador estándar. */
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder: string
  /** Acciones de la primera fila, a la derecha de Filtros (por ejemplo, + Cotización). */
  actions?: ReactNode
  /**
   * Panel de filtros (normalmente `<Filter hideHeader defaultOpen … />`). Se monta
   * solo mientras está abierto con el botón Filtros.
   */
  filters?: ReactNode
  /** Número de filtros aplicados, mostrado en el botón Filtros. */
  activeFilters?: number
  /** Selección de filas: si se omite, la barra no muestra el contador. */
  selectedCount?: number
  /** Nombre del registro en singular y plural: ["espacio", "espacios"]. */
  itemLabel?: [string, string]
  /** El nombre es femenino ("cotización", "renta"): ajusta "Ninguna … seleccionada". */
  feminine?: boolean
  onClearSelection?: () => void
  /** Botones de exportar (XLS, PDF…) a la derecha de la barra de selección. */
  exports?: ReactNode
  /** Acciones sobre la selección después de exportar (por ejemplo, Compartir). */
  selectionActions?: ReactNode
  children: ReactNode
}

/**
 * Estructura común de listado:
 * 1. Título, buscador, botón Filtros y acciones.
 * 2. Barra de selección con el contador y los botones de exportar.
 * 3. Panel de filtros (al abrirlo) y la tabla.
 */
export function ListingPanel({
  title,
  description,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  actions,
  filters,
  activeFilters = 0,
  selectedCount,
  itemLabel = ["registro", "registros"],
  feminine = false,
  onClearSelection,
  exports,
  selectionActions,
  children,
}: ListingPanelProps) {
  const [filtersOpen, setFiltersOpen] = React.useState(false)
  const hasSelection = selectedCount !== undefined
  const showBar = hasSelection || exports || selectionActions
  const none = feminine ? "Ninguna" : "Ningún"
  const one = feminine ? "seleccionada" : "seleccionado"
  const many = feminine ? "seleccionadas" : "seleccionados"

  return (
    <Card className="gap-0 overflow-hidden border-gray-200 py-0 shadow-lg">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-4 sm:px-6 sm:py-5">
        <div className="min-w-0 max-w-full shrink-0 sm:max-w-sm">
          <h2 className="text-xl font-bold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="relative min-w-0 flex-1 basis-40 sm:basis-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="h-11 rounded-xl border-gray-300 bg-white pl-10 shadow-sm focus:border-purple-500 focus:ring-purple-500"
          />
        </div>

        {filters || actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {filters ? (
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "h-11 gap-2 rounded-lg shadow-sm",
                  filtersOpen ? "border-purple-300 bg-purple-50 text-purple-700" : "border-gray-300"
                )}
                onClick={() => setFiltersOpen((open) => !open)}
                aria-expanded={filtersOpen}
                title={filtersOpen ? "Ocultar filtros" : "Mostrar filtros"}
                aria-label={filtersOpen ? "Ocultar filtros" : "Mostrar filtros"}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span className="hidden sm:inline">Filtros</span>
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-purple-100 px-1.5 text-xs font-bold text-purple-700">
                  {activeFilters}
                </span>
              </Button>
            ) : null}
            {actions}
          </div>
        ) : null}
      </div>

      {showBar ? (
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-y border-violet-100 bg-violet-50/70 px-4 py-2 sm:px-6 sm:py-3">
          <div className="flex min-h-9 min-w-0 items-center gap-2 sm:gap-3">
            {hasSelection ? (
              <>
                <span className="inline-flex min-w-0 items-center gap-2 text-sm font-semibold text-violet-900">
                  <SquareCheck className="h-4 w-4 shrink-0 text-violet-600" />
                  <span className="whitespace-nowrap sm:hidden">
                    {selectedCount === 0 ? `${none} ${one}` : `${selectedCount} ${selectedCount === 1 ? one : many}`}
                  </span>
                  <span className="hidden truncate sm:inline">
                    {selectedCount === 0
                      ? `${none} ${itemLabel[0]} ${one}`
                      : `${selectedCount} ${selectedCount === 1 ? `${itemLabel[0]} ${one}` : `${itemLabel[1]} ${many}`}`}
                  </span>
                </span>
                {selectedCount > 0 && onClearSelection ? (
                  <>
                    <span aria-hidden="true" className="h-4 w-px bg-violet-200" />
                    <Button type="button" variant="ghost" size="sm" className="shrink-0 px-2 text-muted-foreground sm:px-3" onClick={onClearSelection} aria-label="Quitar selección" title="Quitar selección">
                      <X className="h-4 w-4" />
                      <span className="hidden sm:inline">Quitar selección</span>
                    </Button>
                  </>
                ) : null}
              </>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {exports ? (
              <>
                <span className="mr-1 hidden text-xs text-muted-foreground sm:inline">Exportar</span>
                {exports}
              </>
            ) : null}
            {exports && selectionActions ? <span aria-hidden="true" className="mx-1 h-6 w-px bg-violet-200" /> : null}
            {selectionActions}
          </div>
        </div>
      ) : null}

      <CardContent className="space-y-4 px-2 py-3 sm:space-y-6 sm:px-6 sm:py-6">
        {filtersOpen ? filters : null}
        {children}
      </CardContent>
    </Card>
  )
}
