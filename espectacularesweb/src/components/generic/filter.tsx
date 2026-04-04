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
import { ChevronDown } from "lucide-react"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"

import type {
    FilterCheckboxConfig,
    FilterDropdownConfig,
    FilterValues,
} from "@/types/Filter"

type Props = {
    title?: string
    enableDateRange?: boolean
    dropdowns?: FilterDropdownConfig[]
    checkboxes?: FilterCheckboxConfig[]
    initialValues?: Partial<FilterValues>
    onApply: (values: FilterValues) => void
    onReset?: () => void
    applyText?: string
    resetText?: string
    className?: string
    applyOnReset?: boolean
    defaultOpen?: boolean
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
    dropdowns = [],
    checkboxes = [],
    initialValues,
    onApply,
    onReset,
    applyText = "Filtrar",
    resetText = "Limpiar",
    className,
    applyOnReset = true,
    defaultOpen = false,
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
        })
    }, [enableDateRange, initialValues, dropdowns, checkboxes])

    React.useEffect(() => {
        setValues(buildInitialState({ dropdowns, checkboxes, initialValues }))
    }, [depsKey, dropdowns, checkboxes, initialValues])

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
        Object.values(values.selects).filter(Boolean).length +
        Object.values(values.checks).filter((v) => v !== undefined).length

    const [open, setOpen] = React.useState(defaultOpen)

    return (
        <Card className={className}>
            <Collapsible open={open} onOpenChange={setOpen}>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-3">
                        <CardTitle className="text-base">{title}</CardTitle>

                        <div className="flex items-center gap-2">
                            {activeCount > 0 && (
                                <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                                    {activeCount} activo{activeCount === 1 ? "" : "s"}
                                </span>
                            )}

                            <CollapsibleTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2">
                                    {open ? "Ocultar" : "Mostrar"}
                                    <ChevronDown
                                        className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
                                    />
                                </Button>
                            </CollapsibleTrigger>
                        </div>
                    </div>
                </CardHeader>

                <CollapsibleContent>
                    <CardContent className="space-y-3">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {/* Dropdowns */}
                            {dropdowns.map((d) => (
                                <div key={d.key} className="space-y-2">
                                    <Label>{d.label}</Label>

                                    <Select
                                        value={values.selects[d.key] ?? ALL_VALUE}
                                        onValueChange={(v) =>
                                            setSelect(d.key, v === ALL_VALUE ? undefined : v)
                                        }
                                        disabled={d.disabled}
                                    >
                                        <SelectTrigger>
                                            <SelectValue
                                                placeholder={d.placeholder ?? "Selecciona una opción"}
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
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
                                <>
                                    <div className="space-y-2">
                                        <Label>Fecha inicial</Label>
                                        <Input
                                            type="date"
                                            value={values.dateFrom ?? ""}
                                            onChange={(e) => setDateFrom(e.target.value || undefined)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Fecha final</Label>
                                        <Input
                                            type="date"
                                            value={values.dateTo ?? ""}
                                            onChange={(e) => setDateTo(e.target.value || undefined)}
                                        />
                                    </div>
                                </>
                            )}

                            {/* Tri-state checks */}
                            {checkboxes.map((c) => {
                                const v = values.checks[c.key]
                                return (
                                    <div key={c.key} className="space-y-2">
                                        <Label>{c.label}</Label>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="w-full justify-between"
                                                    disabled={c.disabled}
                                                >
                                                    <span>{triLabel(v)}</span>
                                                    <span className="text-xs opacity-60">▼</span>
                                                </Button>
                                            </DropdownMenuTrigger>

                                            <DropdownMenuContent align="start" className="w-40">
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
                            <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-4">
                                <Button onClick={handleApply}>{applyText}</Button>
                                <Button variant="outline" onClick={handleReset}>
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