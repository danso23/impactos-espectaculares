import type { ColumnDef } from "@tanstack/react-table"
import { FileSpreadsheet } from "lucide-react"

import { Button } from "@/components/ui/button"
import { exportRowsToExcel } from "@/lib/exportExcel"

type Props<TData> = {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  filename: string
  disabled?: boolean
}

function labelForColumn<TData>(column: ColumnDef<TData, unknown>, fallback: string) {
  return typeof column.header === "string"
    ? column.header
    : fallback.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ")
}

/** Botón reutilizable para exportar exactamente los registros ya filtrados del módulo. */
export function ExcelExportButton<TData>({ columns, data, filename, disabled }: Props<TData>) {
  const exportColumns = columns
    .map((column) => {
      const accessor = column as ColumnDef<TData, unknown> & {
        accessorKey?: string
        accessorFn?: (record: TData, index: number) => unknown
      }
      const id = accessor.id ?? accessor.accessorKey
      if (!id || id === "actions" || (!accessor.accessorKey && !accessor.accessorFn)) return null

      return {
        id,
        label: labelForColumn(column, id),
        getValue: (record: TData, index: number) => {
          if (accessor.accessorFn) return accessor.accessorFn(record, index)
          return record && typeof record === "object"
            ? (record as Record<string, unknown>)[accessor.accessorKey as string]
            : undefined
        },
      }
    })
    .filter((column): column is NonNullable<typeof column> => column !== null)

  const download = () => exportRowsToExcel({
    filename,
    columns: exportColumns,
    rows: data.map((record, index) => ({
      getValue: (columnId: string) => exportColumns.find((column) => column.id === columnId)?.getValue(record, index),
    })),
  })

  return (
    <Button
      type="button"
      variant="outline"
      className="border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm hover:bg-emerald-100 hover:text-emerald-800"
      onClick={download}
      disabled={disabled || data.length === 0 || exportColumns.length === 0}
      title="Exporta los resultados visibles con los filtros aplicados"
    >
      <FileSpreadsheet className="h-4 w-4" />
      Exportar
    </Button>
  )
}
