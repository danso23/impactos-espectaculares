import * as React from "react"
import type {
    ColumnDef,
} from "@tanstack/react-table"
import type { FilterValues } from "@/types/Filter"
import type { TableAction } from "@/types/TableAction"

import { useNavigate } from "react-router-dom"
import { DataTable } from "@/components/generic/data-table"

import { Filter } from "@/components/generic/filter"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SpaceCreateDialog } from "./space-create-dialog"
import { Pencil, Eye, Trash2, FileText } from "lucide-react"
import { createActionsColumn } from "@/components/generic/create-actions-column"


type Space = {
    id: string
    nombre: string
    ubicacion: string
    tipo: "espectacular" | "muro" | "parabus"
    activo: boolean
    pagado: boolean
    createdAt: string // YYYY-MM-DD
}

const DUMMY_SPACES: Space[] = [
    { id: "1", nombre: "Espacio Norte 1", ubicacion: "Mérida - Norte", tipo: "espectacular", activo: true, pagado: true, createdAt: "2026-01-02" },
    { id: "2", nombre: "Muro Centro 3", ubicacion: "Mérida - Centro", tipo: "muro", activo: true, pagado: false, createdAt: "2026-01-05" },
    { id: "3", nombre: "Parabús 12", ubicacion: "Mérida - Oriente", tipo: "parabus", activo: false, pagado: false, createdAt: "2025-12-20" },
    { id: "4", nombre: "Espacio Periférico 7", ubicacion: "Periférico", tipo: "espectacular", activo: true, pagado: false, createdAt: "2026-01-12" },
]

function inDateRange(date: string, from?: string, to?: string) {
    if (from && date < from) return false
    if (to && date > to) return false
    return true
}

function applyLocalFilters(data: Space[], filters: FilterValues) {
    return data.filter((s) => {
        if (!inDateRange(s.createdAt, filters.dateFrom, filters.dateTo)) return false

        const tipo = filters.selects["tipo"]
        if (tipo && s.tipo !== tipo) return false

        const ubicacion = filters.selects["ubicacion"]
        if (ubicacion && s.ubicacion !== ubicacion) return false

        const activo = filters.checks["activo"]
        if (activo !== undefined && s.activo !== activo) return false

        const pagado = filters.checks["pagado"]
        if (pagado !== undefined && s.pagado !== pagado) return false

        return true
    })
}

function tipoLabel(t: Space["tipo"]) {
    if (t === "espectacular") return "Espectacular"
    if (t === "muro") return "Muro"
    return "Parabús"
}

function boolLabel(v: boolean) {
    return v ? "Sí" : "No"
}

export default function SpacePage() {
    const [filters, setFilters] = React.useState<FilterValues>({
        dateFrom: undefined,
        dateTo: undefined,
        selects: {},
        checks: {},
    })
    const navigate = useNavigate()
    const data = React.useMemo(() => applyLocalFilters(DUMMY_SPACES, filters), [filters])

    const actions = React.useMemo<TableAction<Space>[]>(() => {
    return [
        {
            key: "quote",
            label: "Cotizar",
            icon: <FileText className="h-4 w-4" />,
            onClick: (row) => {
            console.log("Cotizar", row.id)
            // navigate(`/spaces/${row.id}/quote`)
            },
        },
        {
            key: "view",
            label: "Ver",
            icon: <Eye className="h-4 w-4" />,
            onClick: (row) => {
            console.log("Ver", row.id)
            // navigate(`/spaces/${row.id}`)
            },
        },
        {
            key: "edit",
            label: "Editar",
            icon: <Pencil className="h-4 w-4" />,
            onClick: (row) => {
            console.log("Editar", row.id)
            // navigate(`/spaces/${row.id}/edit`)
            },
        },
        {
            key: "delete",
            label: "Eliminar",
            variant: "destructive",
            icon: <Trash2 className="h-4 w-4" />,
            separatorBefore: true,
            onClick: async (row) => {
            const ok = confirm(`¿Eliminar "${row.nombre}"?`)
            if (!ok) return
            console.log("Eliminar", row.id)
            // aquí conectas tu mutation delete
            },
            // ejemplo: no permitir eliminar si ya está pagado
            disabled: (row) => row.pagado === true,
        },
    ]
    }, [navigate])

    const columns = React.useMemo<ColumnDef<Space>[]>(() => {
        return [
        {
            accessorKey: "nombre",
            header: ({ column }) => (
            <Button
                variant="ghost"
                className="-ml-3"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Nombre
            </Button>
            ),
            cell: ({ row }) => <div className="font-medium">{row.getValue("nombre")}</div>,
        },
        {
            accessorKey: "ubicacion",
            header: ({ column }) => (
            <Button
                variant="ghost"
                className="-ml-3"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Ubicación
            </Button>
            ),
        },
        {
            accessorKey: "tipo",
            header: ({ column }) => (
            <Button
                variant="ghost"
                className="-ml-3"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Tipo
            </Button>
            ),
            cell: ({ row }) => tipoLabel(row.getValue("tipo")),
        },
        {
            accessorKey: "activo",
            header: ({ column }) => (
            <Button
                variant="ghost"
                className="-ml-3"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Activo
            </Button>
            ),
            cell: ({ row }) => boolLabel(row.getValue("activo")),
        },
        {
            accessorKey: "pagado",
            header: ({ column }) => (
            <Button
                variant="ghost"
                className="-ml-3"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Pagado
            </Button>
            ),
            cell: ({ row }) => boolLabel(row.getValue("pagado")),
        },
        {
            accessorKey: "createdAt",
            header: ({ column }) => (
            <Button
                variant="ghost"
                className="-ml-3"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Creado
            </Button>
            ),
        },

        // Columna Acciones
        createActionsColumn<Space>({
            header: "Acciones",
            actions,
            align: "end",
        }),
        ]
    }, [actions])


    return (
        <div className="space-y-4 p-6">
            <Filter
                title="Filtros de espacios"
                enableDateRange
                dropdowns={[
                    {
                        key: "tipo",
                        label: "Tipo",
                        placeholder: "Selecciona tipo",
                        options: [
                            { label: "Espectacular", value: "espectacular" },
                            { label: "Muro", value: "muro" },
                            { label: "Parabús", value: "parabus" },
                        ],
                    },
                    {
                        key: "ubicacion",
                        label: "Ubicación",
                        placeholder: "Selecciona ubicación",
                        options: [
                            { label: "Mérida - Norte", value: "Mérida - Norte" },
                            { label: "Mérida - Centro", value: "Mérida - Centro" },
                            { label: "Mérida - Oriente", value: "Mérida - Oriente" },
                            { label: "Periférico", value: "Periférico" },
                        ],
                    },
                ]}
                checkboxes={[
                    { key: "activo", label: "Activo" },
                    { key: "pagado", label: "Pagado" },
                ]}
                onApply={(v: FilterValues) => setFilters(v)}
            />
            <SpaceCreateDialog
                onCreated={(values) => {
                    console.log("CREATED:", values)
                }}
            />

            <Card>
                <CardContent className="py-2">
                    <DataTable
                        title={`Espacios (${data.length})`}
                        columns={columns}
                        data={data}
                        enableSearch
                        searchPlaceholder="Buscar..."
                        pageSize={10}
                        onRowClick={(row) => console.log("click", row)}
                    />
                </CardContent>
            </Card>
        </div>
    )
}