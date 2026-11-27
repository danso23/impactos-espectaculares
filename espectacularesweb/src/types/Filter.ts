export type FilterOption = {
    label: string
    value: string
}

export type FilterDropdownConfig = {
    key: string
    label: string
    placeholder?: string
    options: FilterOption[]
    disabled?: boolean
}

export type FilterCheckboxConfig = {
    key: string
    label: string
    disabled?: boolean
}

export type FilterDateFieldConfig = {
    key: string
    label: string
}

/** Un rango de fechas en un solo selector; guarda sus extremos en `values.dates[fromKey|toKey]`. */
export type FilterDateRangeConfig = {
    label: string
    fromKey: string
    toKey: string
}

/** Campo de texto libre; guarda su valor en `values.texts[key]`. */
export type FilterTextFieldConfig = {
    key: string
    label: string
    placeholder?: string
}

export type FilterValues = {
    dateFrom?: string // YYYY-MM-DD
    dateTo?: string // YYYY-MM-DD
    /** Fechas adicionales configuradas con `dateFields` (YYYY-MM-DD). */
    dates?: Record<string, string | undefined>
    selects: Record<string, string | undefined>
    checks: Record<string, boolean | undefined>
    /** Valores de los campos configurados con `textFields`. */
    texts?: Record<string, string | undefined>
}