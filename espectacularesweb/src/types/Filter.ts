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

export type FilterValues = {
    dateFrom?: string // YYYY-MM-DD
    dateTo?: string // YYYY-MM-DD
    selects: Record<string, string | undefined>
    checks: Record<string, boolean | undefined>
}