import * as React from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, SlidersHorizontal } from "lucide-react"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { DateRangePicker } from "@/components/generic/date-range-picker"
import type {
    FilterCheckboxConfig,
    FilterDateFieldConfig,
    FilterDateRangeConfig,
    FilterTextFieldConfig,
    FilterDropdownConfig,
    FilterValues,
} from "@/types/Filter"

type Props = {
    title?: string
    enableDateRange?: boolean
    /** Etiqueta del rango general (dateFrom/dateTo). */
    dateRangeLabel?: string
    /** Rangos adicionales en un solo selector cada uno (p. ej. Inicio y Fin de una renta). */
    dateRanges?: FilterDateRangeConfig[]
    /** Campos de texto libre (p. ej. RFC). */
    textFields?: FilterTextFieldConfig[]
    dropdowns?: FilterDropdownConfig[]
    checkboxes?: FilterCheckboxConfig[]
    /** Campos de fecha adicionales (p. ej. inicio desde/hasta, fin desde/hasta). */
    dateFields?: FilterDateFieldConfig[]
    initialValues?: Partial<FilterValues>
    onApply: (values: FilterValues) => void
    onReset?: () => void
    applyText?: string
    resetText?: string
    className?: string
    applyOnReset?: boolean
    defaultOpen?: boolean
    /** Abierto/cerrado controlado desde fuera (por ejemplo, un botón Filtros propio). */
    open?: boolean
    onOpenChange?: (open: boolean) => void
    /** Oculta el encabezado con título y botón; el panel solo se muestra abierto. */
    hideHeader?: boolean
    actions?: React.ReactNode
}

const ALL_VALUE = "__FILTER_ALL__"

function buildInitialState(params: {
    dropdowns: FilterDropdownConfig[]
    checkboxes: FilterCheckboxConfig[]
    initialValues?: Partial<FilterValues>
}): FilterValues {
    const selects: Record<string, string | undefined> = {}
    const checks: Record<string, boolean | undefined> = {}

    for (const d of params.dropdowns) selects[d.key] = undefined
    for (const c of params.checkboxes) checks[c.key] = undefined

    return {
        dateFrom: params.initialValues?.dateFrom,
        dateTo: params.initialValues?.dateTo,
        dates: { ...(params.initialValues?.dates ?? {}) },
        texts: { ...(params.initialValues?.texts ?? {}) },
        selects: { ...selects, ...(params.initialValues?.selects ?? {}) },
        checks: { ...checks, ...(params.initialValues?.checks ?? {}) },
    }
}

function triLabel(v: boolean | undefined) {
    if (v === true) return "Sí"
    if (v === false) return "No"
    return "Todos"
}

export function Filter({
    title = "Filtros",
    enableDateRange = true,
    dateRangeLabel = "Rango de fechas",
    dateRanges = [],
    textFields = [],
    dropdowns = [],
    checkboxes = [],
    dateFields = [],
    initialValues,
    onApply,
    onReset,
    applyText = "Filtrar",
    resetText = "Limpiar",
    className,
    applyOnReset = true,
    defaultOpen = false,
    open: openProp,
    onOpenChange,
    hideHeader = false,
    actions,
}: Props) {
    const [values, setValues] = React.useState<FilterValues>(() =>
        buildInitialState({ dropdowns, checkboxes, initialValues }),
    )

    const depsKey = React.useMemo(() => {
        return JSON.stringify({
        enableDateRange,
        initialValues,
        dropdowns,
        checkboxes,
        dateFields,
        dateRanges,
        textFields,
        })
    }, [enableDateRange, initialValues, dropdowns, checkboxes, dateFields, dateRanges, textFields])

    React.useEffect(() => {
        setValues(buildInitialState({ dropdowns, checkboxes, initialValues }))
    // Los consumidores suelen construir estos arreglos/objetos en JSX. Sus
    // referencias cambian en cada render aunque sus valores no cambien; usar
    // esas referencias aquí provocaba un setState continuo.
    // depsKey representa sus valores serializados, por lo que es la dependencia
    // intencional para reinicializar el estado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [depsKey])

    const setSelect = (key: string, val?: string) => {
        setValues((prev) => ({
            ...prev,
            selects: { ...prev.selects, [key]: val },
        }))
    }

    const setCheck = (key: string, val: boolean | undefined) => {
        setValues((prev) => ({
            ...prev,
            checks: { ...prev.checks, [key]: val },
        }))
    }

    const setDateFrom = (val?: string) =>
        setValues((p) => ({ ...p, dateFrom: val }))

    const setDateTo = (val?: string) =>
        setValues((p) => ({ ...p, dateTo: val }))

    const setDateField = (key: string, val?: string) =>
        setValues((p) => ({ ...p, dates: { ...(p.dates ?? {}), [key]: val } }))

    const handleApply = () => {
        if (values.dateFrom && values.dateTo && values.dateFrom > values.dateTo) {
            alert("La fecha inicial no puede ser mayor a la fecha final.")
            return
        }
        onApply(values)
    }

    const handleReset = () => {
        const resetState: FilterValues = buildInitialState({
            dropdowns,
            checkboxes,
            initialValues: {},
        })

        setValues(resetState)
        onReset?.()
        if (applyOnReset) onApply(resetState)
    }

    const activeCount =
        (values.dateFrom ? 1 : 0) +
        (values.dateTo ? 1 : 0) +
        Object.values(values.dates ?? {}).filter(Boolean).length +
        Object.values(values.texts ?? {}).filter((v) => v?.trim()).length +
        Object.values(values.selects).filter(Boolean).length +
        Object.values(values.checks).filter((v) => v !== undefined).length

    const [openState, setOpenState] = React.useState(defaultOpen)
    const open = openProp ?? openState
    const setOpen = (next: boolean) => {
        setOpenState(next)
        onOpenChange?.(next)
    }

    if (hideHeader && !open) return null

    return (
        <Card className={cn("rounded-xl shadow-md border-gray-200 overflow-hidden bg-white/80 backdrop-blur-sm", className)}>
            <Collapsible open={open} onOpenChange={setOpen}>
                {hideHeader ? null : <CardHeader className="px-5 py-3">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-3">
                            <CardTitle className="text-xl font-bold text-gray-800">{title}</CardTitle>

                            {activeCount > 0 && (
                                <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
                                    {activeCount} activo{activeCount === 1 ? "" : "s"}
                                </span>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2">
                                {actions}
                            </div>

                            <CollapsibleTrigger asChild>
                                <Button
                                    variant={open ? "secondary" : "outline"}
                                    size="icon"
                                    className={cn(
                                        "relative rounded-lg",
                                        open ? "bg-purple-100 text-purple-700" : "border-gray-300"
                                    )}
                                    aria-label={open ? "Ocultar filtros" : "Mostrar filtros"}
                                    title={open ? "Ocultar filtros" : "Mostrar filtros"}
                                >
                                    <SlidersHorizontal className="h-4 w-4" />
                                    <ChevronDown
                                        className={`absolute h-3 w-3 translate-x-2 translate-y-2 rounded-full bg-background p-[1px] text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
                                    />
                                </Button>
                            </CollapsibleTrigger>
                        </div>
                    </div>
                </CardHeader>}

                <CollapsibleContent>
                    <CardContent className={cn("space-y-6 px-6 pb-6 animate-in", hideHeader ? "pt-6" : "pt-2", "slide-in-from-top-2 duration-200")}>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {/* Dropdowns */}
                            {textFields.map((field) => (
                                <div key={field.key} className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700">{field.label}</Label>
                                    <Input
                                        className="rounded-lg border-gray-300 bg-white shadow-sm"
                                        placeholder={field.placeholder}
                                        value={values.texts?.[field.key] ?? ""}
                                        onChange={(e) => {
                                            const next = e.target.value
                                            setValues((p) => ({ ...p, texts: { ...(p.texts ?? {}), [field.key]: next || undefined } }))
                                        }}
                                        onKeyDown={(e) => { if (e.key === "Enter") handleApply() }}
                                    />
                                </div>
                            ))}

                            {dropdowns.map((d) => (
                                <div key={d.key} className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700">{d.label}</Label>

                                    <Select
                                        value={values.selects[d.key] ?? ALL_VALUE}
                                        onValueChange={(v) =>
                                            setSelect(d.key, v === ALL_VALUE ? undefined : v)
                                        }
                                        disabled={d.disabled}
                                    >
                                        <SelectTrigger className="rounded-lg border-gray-300 bg-white shadow-sm focus:ring-purple-500">
                                            <SelectValue
                                                placeholder={d.placeholder ?? "Selecciona una opción"}
                                            />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl shadow-xl border-gray-200">
                                            <SelectItem value={ALL_VALUE}>(Todos)</SelectItem>
                                            {d.options.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}

                            {/* Date range */}
                            {enableDateRange && (
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700">{dateRangeLabel}</Label>
                                    <DateRangePicker
                                        value={{ from: values.dateFrom, to: values.dateTo }}
                                        onChange={(range) => {
                                            setDateFrom(range.from)
                                            setDateTo(range.to)
                                        }}
                                    />
                                </div>
                            )}

                            {dateRanges.map((range) => (
                                <div key={range.fromKey} className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700">{range.label}</Label>
                                    <DateRangePicker
                                        value={{ from: values.dates?.[range.fromKey], to: values.dates?.[range.toKey] }}
                                        onChange={(next) => setValues((p) => ({
                                            ...p,
                                            dates: { ...(p.dates ?? {}), [range.fromKey]: next.from, [range.toKey]: next.to },
                                        }))}
                                    />
                                </div>
                            ))}

                            {dateFields.map((field) => (
                                <div key={field.key} className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700">{field.label}</Label>
                                    <Input
                                        type="date"
                                        className="rounded-lg border-gray-300 bg-white shadow-sm"
                                        value={values.dates?.[field.key] ?? ""}
                                        onChange={(e) => setDateField(field.key, e.target.value || undefined)}
                                    />
                                </div>
                            ))}

                            {/* Tri-state checks */}
                            {checkboxes.map((c) => {
                                const v = values.checks[c.key]
                                return (
                                    <div key={c.key} className="space-y-2">
                                        <Label className="text-sm font-semibold text-gray-700">{c.label}</Label>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="w-full justify-between rounded-lg border-gray-300 bg-white shadow-sm"
                                                    disabled={c.disabled}
                                                >
                                                    <span>{triLabel(v)}</span>
                                                    <span className="text-xs opacity-60">▼</span>
                                                </Button>
                                            </DropdownMenuTrigger>

                                            <DropdownMenuContent align="start" className="w-40 rounded-xl shadow-xl border-gray-200">
                                                <DropdownMenuItem
                                                    onClick={() => setCheck(c.key, undefined)}
                                                >
                                                    Todos
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setCheck(c.key, true)}>
                                                    Sí
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setCheck(c.key, false)}>
                                                    No
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                )
                            })}

                            {/* Actions */}
                            <div className="flex flex-wrap gap-3 sm:col-span-2 lg:col-span-4 pt-2">
                                <Button 
                                    onClick={handleApply}
                                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-lg px-8 shadow-md"
                                >
                                    {applyText}
                                </Button>
                                <Button 
                                    variant="outline" 
                                    onClick={handleReset}
                                    className="rounded-lg px-8 border-gray-300 hover:bg-purple-50 hover:text-purple-600"
                                >
                                    {resetText}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    )
}
