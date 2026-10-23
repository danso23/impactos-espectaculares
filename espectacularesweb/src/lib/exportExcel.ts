import * as XLSX from "xlsx"

type ExportColumn = {
  label: string
  id: string
}

function excelValue(value: unknown): string | number | boolean {
  if (value === null || value === undefined) return ""
  if (typeof value === "boolean") return value ? "Sí" : "No"
  if (value instanceof Date) return value.toLocaleDateString("es-MX")
  if (typeof value === "object") return JSON.stringify(value)
  return value as string | number
}

/** Descarga las columnas visibles de un listado en formato XLSX. */
export function exportRowsToExcel<T extends { getValue: (columnId: string) => unknown }>(params: {
  filename: string
  columns: ExportColumn[]
  rows: T[]
}) {
  const worksheet = XLSX.utils.aoa_to_sheet([
    params.columns.map((column) => column.label),
    ...params.rows.map((row) => params.columns.map((column) => excelValue(row.getValue(column.id)))),
  ])

  worksheet["!cols"] = params.columns.map((column, index) => {
    const widestValue = Math.max(
      column.label.length,
      ...params.rows.map((row) => String(excelValue(row.getValue(column.id))).length),
    )
    return { wch: Math.min(Math.max(widestValue + 2, 12), index === 0 ? 20 : 40) }
  })

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Registros")
  XLSX.writeFile(workbook, `${params.filename}.xlsx`, { compression: true })
}
