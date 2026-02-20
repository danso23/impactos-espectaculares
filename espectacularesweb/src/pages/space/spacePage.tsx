import * as React from "react"
import type { FilterValues } from "@/types/Filter"
import type { Space } from "@/types/Space"

import { DataTable } from "@/components/generic/data-table"
import { Filter } from "@/components/generic/filter"
import { Card, CardContent } from "@/components/ui/card"
import { SpaceForm } from "./spaceForm"

import { downloadSpacesCatalog } from "@/lib/pdf/downloadSpacesCatalog";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import type { RowSelectionState } from "@tanstack/react-table";

import { useCreateSpace, useSpaces, useUpdateSpace } from "@/lib/hooks/spaceHook"
import { apiToUiSpace, buildSpacesParams } from "@/lib/mappers/spaceMapper"
import { useSpaceTable } from "./spaceTable"
import { asViewType } from "@/lib/helpers/viewTypeHelper"
import { asSpaceType } from "@/lib/helpers/spaceTypeHelper"

const initialFilters: FilterValues = {
  dateFrom: undefined,
  dateTo: undefined,
  selects: {
    tipo: undefined,
    conLuz: undefined,
    estatus: undefined,
  },
  checks: {
    activo: undefined,
  },
}

export default function SpacePage() {
  const [filters, setFilters] = React.useState<FilterValues>(initialFilters)
  const [page, setPage] = React.useState(1)
    const [searchInput, setSearchInput] = React.useState("")
  const [search, setSearch] = React.useState("")
  const perPage = 10
  const [editOpen, setEditOpen] = React.useState(false)
  const [editingSpace, setEditingSpace] = React.useState<Space | null>(null)
  
  const createMutation = useCreateSpace()
  const updateMutation = useUpdateSpace()

  React.useEffect(() => {
    const t = window.setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 350)

    return () => window.clearTimeout(t)
  }, [searchInput])

  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const handleApplyFilters = (v: FilterValues) => {
    setFilters(v)
    setPage(1)
  }

  const handleResetFilters = () => {
    setFilters(initialFilters)
    setPage(1)
  }

  const params = React.useMemo(
    () => buildSpacesParams(filters, page, perPage, search),
    [filters, page, perPage, search],
  )

  const spacesQuery = useSpaces(params)

  const rowsApi = React.useMemo(
    () => spacesQuery.data?.data ?? [],
    [spacesQuery.data?.data],
  )

  const meta = spacesQuery.data?.meta
  const totalPages = meta?.totalPages ?? 1
  const total = meta?.total ?? rowsApi.length

  const data: Space[] = React.useMemo(() => rowsApi.map(apiToUiSpace), [rowsApi])

  const { columns } = useSpaceTable({
    onEdit: (row) => {
      setEditingSpace(row)
      setEditOpen(true)
    },
    onDelete: async (row) => {
      const ok = confirm(`¿Eliminar "${row.title}"?`)
      if (!ok) return
      console.log("Eliminar", row.id)
    },
  })

  return (
    <div className="space-y-4 p-6">
      <Filter
        title="Filtros de espacios"
        enableDateRange
        initialValues={filters}
        dropdowns={[
          {
            key: "estatus",
            label: "Estatus",
            placeholder: "Selecciona",
            options: [
              { label: "Disponible", value: "disponible" },
              { label: "Bloqueado", value: "bloqueado" },
            ],
          },
          {
            key: "tipo",
            label: "Tipo",
            placeholder: "Selecciona tipo",
            options: [
              { label: "Espectacular", value: "Espectacular" },
              { label: "Muro", value: "Muro" },
              { label: "Parabús", value: "Parabus" },
            ],
          },
          {
            key: "conLuz",
            label: "Con luz",
            placeholder: "Selecciona",
            options: [
              { label: "Sí", value: "1" },
              { label: "No", value: "0" },
            ],
          },
        ]}
        checkboxes={[{ key: "activo", label: "Activo" }]}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        applyOnReset={true}
      />
      <Button
        variant="outline"
        className="flex gap-2"
        onClick={() => {
          console.log("Seleccionados", rowSelection);
          const selectedIds = Object.keys(rowSelection);

          const selectedSpaces = data.filter((space) =>
            selectedIds.includes(String(space.id)),
          );

          downloadSpacesCatalog(selectedSpaces);
        }}
      >
        <FileDown className="h-4 w-4" />
        Descargar catálogo PDF
      </Button>

      <div className="flex flex-wrap gap-2">
        <SpaceForm
          mode="create"
          onSubmit={async (payload) => {
            await createMutation.mutateAsync(payload)
          }}
          isSubmitting={createMutation.isPending}
          onSaved={() => spacesQuery.refetch()}
        />
        {editingSpace ? (
          <SpaceForm
            mode="edit"
            title="Editar espacio"
            hideTrigger
            open={editOpen}
            onOpenChange={(v) => {
              setEditOpen(v)
              if (!v) setEditingSpace(null)
            }}
            initialValues={{
              faces: editingSpace.faces,
              assigned_id: editingSpace.assigned_id ?? "",
              title: editingSpace.title ?? "",
              price: editingSpace.price,
              type: asSpaceType(editingSpace.type),
              width_m: editingSpace.width_m ? parseFloat(editingSpace.width_m.toString()) : undefined,
              height_m: editingSpace.height_m ? parseFloat(editingSpace.height_m.toString()) : undefined,
              has_lights: editingSpace.has_lights ?? false,
              viewType: asViewType(editingSpace.viewType),

              latitude: editingSpace.coords?.lat,
              longitude: editingSpace.coords?.lng,
              socioeconomic_level: editingSpace.socioeconomic_level ?? "",
              description: editingSpace.description ?? "",
              comments: editingSpace.comments ?? "",
            }}
            isSubmitting={updateMutation.isPending}
            onSubmit={async (payload) => {
              await updateMutation.mutateAsync({ id: editingSpace.id, payload })
              await spacesQuery.refetch()
            }}
          />
        ) : null}
      </div>

      <Card>
        <CardContent className="py-2">
          <DataTable
            title={`Espacios (${total})`}
            columns={columns}
            data={data}
            enableSearch
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            searchPlaceholder="Buscar..."
            searchValue={searchInput}
            onSearchChange={(v) => {
              setSearchInput(v)
              setPage(1)
            }}
            pageSize={perPage}
            enablePagination
            manualPagination
            pageIndex={(meta?.page ?? page) - 1}
            pageCount={totalPages}
            onPageChange={(nextPageIndex) => setPage(nextPageIndex + 1)}
            isLoading={spacesQuery.isFetching}
          />
        </CardContent>
      </Card>
    </div>
  )
}
