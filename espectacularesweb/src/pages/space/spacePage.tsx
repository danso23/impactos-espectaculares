import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import type { FilterValues } from "@/types/Filter"
import type { TableAction } from "@/types/TableAction"
import type { Space, SpaceApi } from "@/types/Space"

import { useNavigate } from "react-router-dom"
import { DataTable } from "@/components/generic/data-table"
import { Filter } from "@/components/generic/filter"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SpaceCreateDialog } from "./space-create-dialog"

import { Pencil, Eye, Trash2, FileText } from "lucide-react"
import { createActionsColumn } from "@/components/generic/create-actions-column"

import { useSpaces } from "@/lib/hooks/spaceHook"

function apiToUiStatus(active?: boolean | number | null): Space["status"] {
  // active = 0 => Bloqueado, si active = 1 => Disponible Por lo pronto en que agrego otro campo
  const isActive = active === true || active === 1
  return isActive ? "Disponible" : "Bloqueado"
}

function apiToUiSpace(r: SpaceApi): Space {
  return {
    id: r.id,
    title: r.title,
    price: r.price ?? undefined,
    coords: {
      lat: Number(r.latitude ?? 0),
      lng: Number(r.longitude ?? 0),
    },
    status: apiToUiStatus(r.active),
    createdAt: (r.created_at ?? "").slice(0, 10),
  }
}

export default function SpacePage() {
  const [filters, setFilters] = React.useState<FilterValues>({
    dateFrom: undefined,
    dateTo: undefined,
    selects: {},
    checks: {},
  })

  const [page, setPage] = React.useState(1)
  const perPage = 10

  const handleApplyFilters = (v: FilterValues) => {
    setFilters(v)
    setPage(1)
  }

  const spacesQuery = useSpaces(filters, page, perPage)
  const rowsApi = spacesQuery.data?.data ?? []
  const meta = spacesQuery.data?.meta

  const totalPages = meta?.totalPages ?? 1
  const total = meta?.total ?? rowsApi.length

  const data: Space[] = React.useMemo(() => rowsApi.map(apiToUiSpace), [rowsApi])

  const navigate = useNavigate()

  const actions = React.useMemo<TableAction<Space>[]>(() => {
    return [
      {
        key: "quote",
        label: "Cotizar",
        icon: <FileText className="h-4 w-4" />,
        onClick: (row) => console.log("Cotizar", row.id),
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
          const ok = confirm(`¿Eliminar "${row.title}"?`)
          if (!ok) return
          console.log("Eliminar", row.id)
        },
      },
    ]
  }, [navigate])

  const columns = React.useMemo<ColumnDef<Space>[]>(() => {
    return [
      {
        accessorKey: "title",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Título
          </Button>
        ),
        cell: ({ row }) => <div className="font-medium">{row.getValue("title")}</div>,
      },
      {
        accessorKey: "price",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Precio
          </Button>
        ),
        cell: ({ row }) => {
          const v = row.getValue("price") as number | undefined
          return v === undefined ? "-" : `$${v.toLocaleString("es-MX")}`
        },
      },
      {
        accessorKey: "coords",
        header: "Coords",
        cell: ({ row }) => {
          const c = row.getValue("coords") as Space["coords"]
          return `${c.lat.toFixed(6)}, ${c.lng.toFixed(6)}`
        },
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Estatus
          </Button>
        ),
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
        ]}
        checkboxes={[{ key: "activo", label: "Activo" }]}
        onApply={handleApplyFilters}
      />

      <SpaceCreateDialog onCreated={() => setPage(1)} />

      <Card>
        <CardContent className="py-2">
          <DataTable
            title={`Espacios (${total})`}
            columns={columns}
            data={data}
            enableSearch
            searchPlaceholder="Buscar..."
            pageSize={perPage}
            enablePagination
            manualPagination
            pageIndex={(meta?.page ?? page) - 1}
            pageCount={totalPages}
            onPageChange={(nextPageIndex) => setPage(nextPageIndex + 1)}
            isLoading={spacesQuery.isFetching}
            onRowClick={(row) => console.log("click", row)}
          />
        </CardContent>
      </Card>
    </div>
  )
}