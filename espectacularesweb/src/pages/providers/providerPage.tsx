import * as React from "react"
import { UserCheck2, UserX, UsersRound } from "lucide-react"
import { toast } from "sonner"

import { DataTable } from "@/components/generic/data-table"
import { ListingPanel } from "@/components/generic/listing-panel"
import { ExcelExportButton } from "@/components/generic/excel-export-button"
import { createSelectColumn } from "@/components/generic/select-column"
import { useTableSelection } from "@/hooks/useTableSelection"
import { fetchAllPages } from "@/lib/fetchAllPages"
import { getProviders } from "@/lib/services/providerService"
import { Filter } from "@/components/generic/filter"
import { countFilterValues, EMPTY_FILTER_VALUES } from "@/lib/filterValues"
import type { FilterValues } from "@/types/Filter"
import { DeleteConfirmDialog } from "@/components/generic/delete-confirm-dialog"
import { ModuleHeader } from "@/components/generic/module-header"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  useCreateProvider,
  useDeleteProvider,
  useProviders,
  useUpdateProvider,
} from "@/lib/hooks/providerHook"
import type { ProviderFormValues, ProviderRecord } from "@/types/Provider"
import { ProviderForm } from "./providerForm"
import { useProviderTable } from "./providerTable"
import { Can } from "@/components/auth/Can"

export default function ProviderPage() {
  const createMutation = useCreateProvider()
  const updateMutation = useUpdateProvider()
  const deleteMutation = useDeleteProvider()

  const [page, setPage] = React.useState(1)
  const [searchInput, setSearchInput] = React.useState("")
  const [search, setSearch] = React.useState("")
  const [filterValues, setFilterValues] = React.useState<FilterValues>(EMPTY_FILTER_VALUES)
  const perPage = 10

  const [editRecord, setEditRecord] = React.useState<ProviderRecord | null>(null)
  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [providerToDelete, setProviderToDelete] = React.useState<ProviderRecord | null>(null)

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 350)

    return () => window.clearTimeout(timer)
  }, [searchInput])

  const params = React.useMemo(
    () => ({
      page,
      per_page: perPage,
      q: search || undefined,
      active: filterValues.selects.activo, date_from: filterValues.dateFrom, date_to: filterValues.dateTo,
    }),
    [filterValues, page, perPage, search]
  )

  const providersQuery = useProviders(params)
  const providers = providersQuery.data?.data ?? []
  const meta = providersQuery.data?.meta
  const totalProviders = meta?.total ?? 0
  const visibleActiveProviders = providers.filter((provider) => provider.active !== false).length
  const visibleInactiveProviders = providers.length - visibleActiveProviders

  const handleEdit = React.useCallback((row: ProviderRecord) => {
    setEditRecord(row)
    setEditOpen(true)
  }, [])

  const handleDelete = React.useCallback((row: ProviderRecord) => {
    setProviderToDelete(row)
    setDeleteDialogOpen(true)
  }, [])

  const columns = useProviderTable({ onEdit: handleEdit, onDelete: handleDelete })

  async function handleCreate(payload: ProviderFormValues) {
    try {
      await createMutation.mutateAsync(payload)
      toast.success("Proveedor creado correctamente")
    } catch (error) {
      toast.error("No se pudo crear el proveedor", {
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
      })
      throw error
    }
  }

  async function handleUpdate(payload: ProviderFormValues) {
    if (!editRecord) return

    try {
      await updateMutation.mutateAsync({ id: editRecord.id, payload })
      toast.success("Proveedor actualizado correctamente")
      setEditOpen(false)
      setEditRecord(null)
    } catch (error) {
      toast.error("No se pudo actualizar el proveedor", {
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
      })
      throw error
    }
  }

  const handleConfirmDelete = async () => {
    if (!providerToDelete) return

    try {
      await deleteMutation.mutateAsync(providerToDelete.id)
      toast.success("Proveedor eliminado correctamente")
      setDeleteDialogOpen(false)
    } catch (error) {
      toast.error("No se pudo eliminar el proveedor", {
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
      })
    } finally {
      setProviderToDelete(null)
    }
  }

  // Selección de filas: si hay seleccionadas, se exportan solo esas.
  const selection = useTableSelection(providers)
  const selectableColumns = React.useMemo(
    () => [createSelectColumn<(typeof providers)[number]>(), ...columns],
    [columns],
  )

  return (
    <div className="max-w-7xl mx-auto space-y-5 sm:space-y-8 animate-in fade-in duration-500">
      <ModuleHeader
        title="Proveedores"
        badge="Catálogo de proveedores"
        description="Administra contactos, teléfonos, correos y direcciones de tus proveedores desde un solo lugar."
        icon={UsersRound}
        actions={<Can permission="providers.edit">
          <ProviderForm isSubmitting={createMutation.isPending} onSubmit={handleCreate} />
        </Can>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card className="border-gray-200 shadow-md">
          <CardHeader className="pb-3">
            <CardDescription>Total registrados</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <UsersRound className="h-5 w-5 text-purple-600" />
              {totalProviders}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-gray-200 shadow-md">
          <CardHeader className="pb-3">
            <CardDescription>Activos en la página</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <UserCheck2 className="h-5 w-5 text-emerald-600" />
              {visibleActiveProviders}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-gray-200 shadow-md">
          <CardHeader className="pb-3">
            <CardDescription>Inactivos en la página</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <UserX className="h-5 w-5 text-slate-500" />
              {visibleInactiveProviders}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <ListingPanel
        title="Búsqueda rápida"
        description="Filtra por nombre, contacto, teléfono, email, dirección o notas."
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Buscar proveedor..."
        selectedCount={selection.selected.length}
        itemLabel={["proveedor", "proveedores"]}
        onClearSelection={selection.clear}
        exports={<ExcelExportButton columns={columns} data={providers} filename="proveedores" selected={selection.selected} disabled={providersQuery.isFetching} fetchAll={() => fetchAllPages((nextPage, size) => getProviders({ ...params, page: nextPage, per_page: size }))} />}
        activeFilters={countFilterValues(filterValues)}
        filters={<Filter
          hideHeader
          defaultOpen
          dateRangeLabel="Fecha de alta"
          dropdowns={[{ key: "activo", label: "Activo", options: [{ label: "Sí", value: "1" }, { label: "No", value: "0" }] }]}
          initialValues={filterValues}
          onApply={(values) => { setFilterValues(values); setPage(1) }}
        />}
      >
          <DataTable
            columns={selectableColumns}
            data={providers}
            rowSelection={selection.rowSelection}
            onRowSelectionChange={selection.setRowSelection}
            getRowId={selection.getRowId}
            enableRowSelection
            enableSearch={false}
            enableExport={false}
            pageSize={perPage}
            enablePagination
            manualPagination
            pageIndex={(meta?.page ?? page) - 1}
            pageCount={meta?.totalPages ?? 1}
            onPageChange={(nextPageIndex) => setPage(nextPageIndex + 1)}
            isLoading={providersQuery.isFetching}
          />
      </ListingPanel>

      <ProviderForm
        editRecord={editRecord}
        isSubmitting={updateMutation.isPending}
        onSubmit={handleUpdate}
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open)
          if (!open) setEditRecord(null)
        }}
        showTrigger={false}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        itemName={providerToDelete?.name}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
