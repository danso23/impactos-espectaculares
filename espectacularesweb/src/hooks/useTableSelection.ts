import * as React from "react"
import type { RowSelectionState } from "@tanstack/react-table"

/**
 * Selección de filas que se conserva al cambiar de página o de filtros.
 * Guarda los registros ya vistos para poder exportar los seleccionados
 * aunque no estén en la página actual.
 */
export function useTableSelection<T extends { id: number | string }>(data: T[]) {
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [seen, setSeen] = React.useState<Record<string, T>>({})

  React.useEffect(() => {
    if (!data.length) return
    setSeen((current) => {
      // Sin cambios no se actualiza el estado (evita renders en bucle).
      if (data.every((record) => current[String(record.id)] === record)) return current
      const next = { ...current }
      for (const record of data) next[String(record.id)] = record
      return next
    })
  }, [data])

  const selected = React.useMemo(
    () => Object.entries(rowSelection)
      .filter(([, isSelected]) => isSelected)
      .map(([id]) => seen[id])
      .filter((record): record is T => Boolean(record)),
    [rowSelection, seen],
  )

  const clear = React.useCallback(() => setRowSelection({}), [])
  const getRowId = React.useCallback((record: T) => String(record.id), [])

  return { rowSelection, setRowSelection, selected, clear, getRowId }
}
