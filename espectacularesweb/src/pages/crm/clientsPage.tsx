import * as React from "react"
import { MailCheck, FileText, UsersRound } from "lucide-react"

import { DataTable } from "@/components/generic/data-table"
import { ListingPanel } from "@/components/generic/listing-panel"
import { ExcelExportButton } from "@/components/generic/excel-export-button"
import { createSelectColumn } from "@/components/generic/select-column"
import { useTableSelection } from "@/hooks/useTableSelection"
import { fetchAllPages } from "@/lib/fetchAllPages"
import { getClients } from "@/lib/services/crmService"
import { ModuleHeader } from "@/components/generic/module-header"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useClientFilterOptions, useClients, useCreateClient } from "@/lib/hooks/crmHook"
import { Filter } from "@/components/generic/filter"
import type { FilterValues } from "@/types/Filter"
import { CrmForm } from "@/pages/crm/crmForm"
import { useClientTable } from "@/pages/crm/crmTable"
import type { ClientFormValues } from "@/types/Crm"
import { Can } from "@/components/auth/Can"
import { DeleteConfirmDialog } from "@/components/generic/delete-confirm-dialog"
import { toast } from "sonner"
import { useDeleteClient, useUpdateClient } from "@/lib/hooks/crmHook"
import type { ClientRecord } from "@/types/Crm"

export default function ClientsPage() {
  const createClientMutation = useCreateClient()
  const updateClientMutation = useUpdateClient()
  const deleteClientMutation = useDeleteClient()
  const [page, setPage] = React.useState(1)
  const [searchInput, setSearchInput] = React.useState("")
  const [search, setSearch] = React.useState("")
  const [filterValues, setFilterValues] = React.useState<FilterValues>({ selects: {}, checks: {} })
  const filterOptionsQuery = useClientFilterOptions()
  const perPage = 10
  const [editRecord, setEditRecord] = React.useState<ClientRecord | null>(null)
  const [deleteRecord, setDeleteRecord] = React.useState<ClientRecord | null>(null)

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
      rfc: filterValues.texts?.rfc?.trim() || undefined,
      source: filterValues.selects.fuente,
      usuario: filterValues.selects.usuario,
      date_from: filterValues.dateFrom,
      date_to: filterValues.dateTo,
    }),
    [filterValues, page, perPage, search]
  )

  const clientsQuery = useClients(params)
  const clients = clientsQuery.data?.data ?? []
  const meta = clientsQuery.data?.meta
  const columns = useClientTable({
    onEdit: setEditRecord,
    onDelete: setDeleteRecord,
  })
  const totalClients = meta?.total ?? 0
  const visibleWithEmail = clients.filter((client) => !!client.email).length
  const visibleWithRfc = clients.filter((client) => !!client.rfc).length

  // Selección de filas: si hay seleccionadas, se exportan solo esas.
  const selection = useTableSelection(clients)
  const selectableColumns = React.useMemo(
    () => [createSelectColumn<(typeof clients)[number]>(), ...columns],
    [columns],
  )

  return (
    <div className="max-w-7xl mx-auto space-y-5 sm:space-y-8 animate-in fade-in duration-500">
      <ModuleHeader
        title="Clientes"
        badge="Catálogo de clientes"
        description="Administra clientes disponibles para seguimiento, cotización y contacto comercial."
        icon={UsersRound}
        actions={<Can permission="clients.edit">
          <CrmForm
            mode="client"
            isSubmitting={createClientMutation.isPending}
            onSubmit={async (payload) => {
              await createClientMutation.mutateAsync(payload as ClientFormValues)
            }}
          />
        </Can>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card className="border-gray-200 shadow-md">
          <CardHeader className="pb-3">
            <CardDescription>Total registrados</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <UsersRound className="h-5 w-5 text-purple-600" />
              {totalClients}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-gray-200 shadow-md">
          <CardHeader className="pb-3">
            <CardDescription>Con email visible</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <MailCheck className="h-5 w-5 text-emerald-600" />
              {visibleWithEmail}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-gray-200 shadow-md">
          <CardHeader className="pb-3">
            <CardDescription>Con RFC visible</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <FileText className="h-5 w-5 text-slate-500" />
              {visibleWithRfc}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <ListingPanel
        title="Búsqueda rápida"
        description="Filtra por nombre, teléfono, email, RFC, fuente o usuario registrado."
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Buscar cliente..."
        selectedCount={selection.selected.length}
        itemLabel={["cliente", "clientes"]}
        onClearSelection={selection.clear}
        activeFilters={
          (filterValues.texts?.rfc?.trim() ? 1 : 0) +
          (filterValues.selects.fuente ? 1 : 0) +
          (filterValues.selects.usuario ? 1 : 0) +
          (filterValues.dateFrom || filterValues.dateTo ? 1 : 0)
        }
        filters={
          <Filter
            hideHeader
            defaultOpen
            dateRangeLabel="Fecha de alta"
            textFields={[{ key: "rfc", label: "RFC", placeholder: "Ej. XAXX010101000" }]}
            dropdowns={[
              {
                key: "fuente",
                label: "Fuente",
                options: (filterOptionsQuery.data?.data.sources ?? []).map((source) => ({ label: source, value: source })),
              },
              {
                key: "usuario",
                label: "Registrado por",
                options: (filterOptionsQuery.data?.data.users ?? []).map((user) => ({ label: user.name, value: user.username })),
              },
            ]}
            initialValues={filterValues}
            onApply={(values) => { setFilterValues(values); setPage(1) }}
          />
        }
        exports={<ExcelExportButton columns={columns} data={clients} filename="clientes" selected={selection.selected} disabled={clientsQuery.isFetching} fetchAll={() => fetchAllPages((nextPage, size) => getClients({ ...params, page: nextPage, per_page: size }))} />}
      >
          <DataTable
            columns={selectableColumns}
            data={clients}
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
            isLoading={clientsQuery.isFetching}
          />
      </ListingPanel>

      <CrmForm
        mode="client"
        editRecord={editRecord}
        open={!!editRecord}
        onOpenChange={(open) => {
          if (!open) setEditRecord(null)
        }}
        showTrigger={false}
        isSubmitting={updateClientMutation.isPending}
        onSubmit={async (payload) => {
          if (!editRecord) return
          try {
            await updateClientMutation.mutateAsync({ id: editRecord.id, payload: payload as ClientFormValues })
            setEditRecord(null)
          } catch (error) {
            toast.error("No se pudo actualizar el cliente", {
              description: error instanceof Error ? error.message : "Intenta nuevamente.",
            })
            throw error
          }
        }}
      />

      <DeleteConfirmDialog
        open={!!deleteRecord}
        onOpenChange={(open) => {
          if (!open) setDeleteRecord(null)
        }}
        title="Eliminar cliente"
        description="Esta acción no se puede deshacer."
        itemName={deleteRecord?.display_name}
        loading={deleteClientMutation.isPending}
        onConfirm={() => {
          if (!deleteRecord) return
          deleteClientMutation.mutate(deleteRecord.id, {
            onSuccess: () => {
              toast.success("Cliente eliminado correctamente")
              setDeleteRecord(null)
            },
            onError: (error) => {
              toast.error("No se pudo eliminar el cliente", {
                description: error instanceof Error ? error.message : "Intenta nuevamente.",
              })
            },
          })
        }}
      />
    </div>
  )
}
