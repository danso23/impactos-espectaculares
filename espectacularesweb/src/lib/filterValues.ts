import type { FilterValues } from "@/types/Filter"

export const EMPTY_FILTER_VALUES: FilterValues = { selects: {}, checks: {} }

/** Filtros aplicados para el contador del botón Filtros; un rango de fechas cuenta como 1. */
export function countFilterValues(values: FilterValues) {
  return (
    Object.values(values.selects).filter(Boolean).length +
    Object.values(values.checks).filter((v) => v !== undefined).length +
    Object.values(values.texts ?? {}).filter((v) => v?.trim()).length +
    (values.dateFrom || values.dateTo ? 1 : 0)
  )
}

/** Valor de texto limpio o `undefined` para no mandarlo a la API. */
export function filterText(values: FilterValues, key: string) {
  return values.texts?.[key]?.trim() || undefined
}
