import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { ChevronDown, FileSpreadsheet, RefreshCw, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { exportRowsToExcel } from "@/lib/exportExcel"

/** Columna de exportación: encabezado en español y cómo obtener el valor. */
export type ExportSpec<TData> = {
  label: string
  value: (record: TData) => unknown
}

/** Formato de exportación alternativo (p. ej. "Lista de precios"). */
export type ExportPreset<TData> = {
  key: string
  label: string
  /** Sufijo del archivo, p. ej. "lista-precios". */
  filenameSuffix?: string
  /** Sin columnas propias usa las columnas de la tabla. */
  specs?: ExportSpec<TData>[]
}

type Props<TData> = {
  columns: ColumnDef<TData, unknown>[]
  /** Registros de la página actual (respaldo si no hay `fetchAll`). */
  data: TData[]
  filename: string
  disabled?: boolean
  /** Descarga todos los registros con los filtros aplicados (todas las páginas). */
  fetchAll?: () => Promise<TData[]>
  /** Si hay registros seleccionados, se exportan solo esos. */
  selected?: TData[]
  /** Formatos alternativos; si se indican, el botón abre un menú. */
  presets?: ExportPreset<TData>[]
  /** Muestra "Quitar selección" cuando hay registros seleccionados. */
  onClearSelection?: () => void
}

function humanize(value: string) {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ")
}

/** Convierte las columnas de la tabla en columnas de Excel. */
function specsFromColumns<TData>(columns: ColumnDef<TData, unknown>[]): ExportSpec<TData>[] {
  return columns
    .flatMap((column): (ExportSpec<TData> | null)[] => {
      if (column.meta?.exportable !== false && column.meta?.exportColumns?.length) {
        return column.meta.exportColumns
      }
      return [specFromColumn(column)]
    })
    .filter((spec): spec is ExportSpec<TData> => spec !== null)
}

function specFromColumn<TData>(column: ColumnDef<TData, unknown>): ExportSpec<TData> | null {
  return [column]
    .map((column) => {
      const accessor = column as ColumnDef<TData, unknown> & {
        accessorKey?: string
        accessorFn?: (record: TData, index: number) => unknown
      }
      const id = accessor.id ?? accessor.accessorKey
      const meta = column.meta
      if (!id || id === "actions" || id === "select" || meta?.exportable === false) return null
      if (!meta?.exportValue && !accessor.accessorKey && !accessor.accessorFn) return null

      const label = meta?.exportLabel
        ?? (typeof column.header === "string" ? column.header : humanize(id))

      const value = (record: TData) => {
        if (meta?.exportValue) return meta.exportValue(record)
        if (accessor.accessorFn) return accessor.accessorFn(record, 0)
        // Soporta claves anidadas como "totals.total".
        return String(accessor.accessorKey).split(".").reduce<unknown>(
          (current, key) => (current && typeof current === "object" ? (current as Record<string, unknown>)[key] : undefined),
          record,
        )
      }

      return { label, value }
    })[0]
}

function downloadExcel<TData>(filename: string, specs: ExportSpec<TData>[], records: TData[]) {
  const columns = specs.map((spec, index) => ({ id: String(index), label: spec.label }))
  exportRowsToExcel({
    filename,
    columns,
    rows: records.map((record) => ({
      getValue: (columnId: string) => specs[Number(columnId)]?.value(record),
    })),
  })
}

/**
 * Exporta a Excel respetando filtros (todas las páginas vía `fetchAll`) y la
 * selección: si hay registros seleccionados, solo esos.
 */
export function ExcelExportButton<TData>({
  columns,
  data,
  filename,
  disabled,
  fetchAll,
  selected,
  presets,
  onClearSelection,
}: Props<TData>) {
  const [busy, setBusy] = React.useState(false)
  const tableSpecs = React.useMemo(() => specsFromColumns(columns), [columns])
  const selectedCount = selected?.length ?? 0

  const run = async (preset?: ExportPreset<TData>) => {
    const specs = preset?.specs ?? tableSpecs
    const name = preset?.filenameSuffix ? `${filename}-${preset.filenameSuffix}` : filename
    setBusy(true)
    try {
      const records = selectedCount > 0
        ? selected!
        : fetchAll
          ? await fetchAll()
          : data
      if (records.length === 0) {
        toast.info("No hay registros para exportar con los filtros actuales.")
        return
      }
      downloadExcel(name, specs, records)
    } catch (error) {
      toast.error("No fue posible exportar.", {
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
      })
    } finally {
      setBusy(false)
    }
  }

  const label = selectedCount > 0 ? `Exportar (${selectedCount} seleccionados)` : "Exportar"
  const title = selectedCount > 0
    ? "Exporta solo los registros seleccionados"
    : "Exporta todos los registros con los filtros aplicados"
  const isDisabled = disabled || busy || tableSpecs.length === 0 || (!fetchAll && data.length === 0 && selectedCount === 0)
  const icon = busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />
  const buttonClass = "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm hover:bg-emerald-100 hover:text-emerald-800"

  const clearButton = selectedCount > 0 && onClearSelection ? (
    <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" onClick={onClearSelection}>
      <X className="h-4 w-4" />
      Quitar selección
    </Button>
  ) : null

  if (presets?.length) {
    return (
      <div className="flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" className={buttonClass} disabled={isDisabled} title={title}>
            {icon}
            {label}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            {selectedCount > 0 ? `${selectedCount} seleccionados` : "Todos con los filtros aplicados"}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {presets.map((preset) => (
            <DropdownMenuItem key={preset.key} onClick={() => void run(preset)}>
              {preset.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {clearButton}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <Button type="button" variant="outline" className={buttonClass} onClick={() => void run()} disabled={isDisabled} title={title}>
        {icon}
        {label}
      </Button>
      {clearButton}
    </div>
  )
}
