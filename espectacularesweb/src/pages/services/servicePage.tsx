import * as React from "react"
import { CircleDollarSign, Settings } from "lucide-react"
import { toast } from "sonner"
import { Can } from "@/components/auth/Can"
import { DataTable } from "@/components/generic/data-table"
import { ListingPanel } from "@/components/generic/listing-panel"
import { ExcelExportButton } from "@/components/generic/excel-export-button"
import { createSelectColumn } from "@/components/generic/select-column"
import { useTableSelection } from "@/hooks/useTableSelection"
import { fetchAllPages } from "@/lib/fetchAllPages"
import { getServices } from "@/lib/services/serviceService"
import { Filter } from "@/components/generic/filter"
import { DeleteConfirmDialog } from "@/components/generic/delete-confirm-dialog"
import { ModuleHeader } from "@/components/generic/module-header"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useCreateService, useDeleteService, useServices, useUpdateService } from "@/lib/hooks/serviceHook"
import type { ServiceFormValues, ServiceRecord } from "@/types/Service"
import { ServiceForm } from "./serviceForm"
import { useServiceTable } from "./serviceTable"

export default function ServicePage() {
  const createMutation = useCreateService(), updateMutation = useUpdateService(), deleteMutation = useDeleteService()
  const [page, setPage] = React.useState(1), [searchInput, setSearchInput] = React.useState(""), [search, setSearch] = React.useState("")
  const [activeFilter, setActiveFilter] = React.useState("all")
  const [editRecord, setEditRecord] = React.useState<ServiceRecord | null>(null), [editOpen, setEditOpen] = React.useState(false)
  const [deleteRecord, setDeleteRecord] = React.useState<ServiceRecord | null>(null), [deleteOpen, setDeleteOpen] = React.useState(false)
  React.useEffect(() => { const timer = window.setTimeout(() => { setSearch(searchInput); setPage(1) }, 350); return () => window.clearTimeout(timer) }, [searchInput])
  const params = React.useMemo(() => ({ page, per_page: 10, q: search || undefined, is_active: activeFilter === "all" ? undefined : activeFilter }), [activeFilter, page, search])
  const query = useServices(params), records = query.data?.data ?? [], meta = query.data?.meta
  const columns = useServiceTable({ onEdit: React.useCallback((row) => { setEditRecord(row); setEditOpen(true) }, []), onDelete: React.useCallback((row) => { setDeleteRecord(row); setDeleteOpen(true) }, []) })

  async function create(payload: ServiceFormValues) { try { await createMutation.mutateAsync(payload); toast.success("Servicio creado correctamente") } catch (error) { toast.error("No se pudo crear el servicio", { description: error instanceof Error ? error.message : undefined }); throw error } }
  async function update(payload: ServiceFormValues) { if (!editRecord) return; try { await updateMutation.mutateAsync({ id: editRecord.id, payload }); toast.success("Servicio actualizado correctamente"); setEditRecord(null) } catch (error) { toast.error("No se pudo actualizar el servicio", { description: error instanceof Error ? error.message : undefined }); throw error } }
  async function remove() { if (!deleteRecord) return; try { const result = await deleteMutation.mutateAsync(deleteRecord.id); toast.success(result.message || "Servicio eliminado correctamente"); setDeleteOpen(false) } catch (error) { toast.error("No se pudo eliminar el servicio", { description: error instanceof Error ? error.message : undefined }) } finally { setDeleteRecord(null) } }

  // Selección de filas: si hay seleccionadas, se exportan solo esas.
  const selection = useTableSelection(records)
  const selectableColumns = React.useMemo(
    () => [createSelectColumn<(typeof records)[number]>(), ...columns],
    [columns],
  )

  return <div className="mx-auto max-w-7xl space-y-5 sm:space-y-8 animate-in fade-in duration-500">
    <ModuleHeader title="Servicios" badge="Catálogo de servicios" description="Administra los conceptos, precios e impuestos disponibles en las cotizaciones." icon={Settings} actions={<Can permission="services.edit"><ServiceForm isSubmitting={createMutation.isPending} onSubmit={create} /></Can>} />
    <div className="grid gap-4 sm:grid-cols-2">
      <Card><CardHeader><CardDescription>Total registrados</CardDescription><CardTitle className="flex items-center gap-2 text-3xl"><Settings className="h-5 w-5 text-purple-600" />{meta?.total ?? 0}</CardTitle></CardHeader></Card>
      <Card><CardHeader><CardDescription>Activos en esta página</CardDescription><CardTitle className="flex items-center gap-2 text-3xl"><CircleDollarSign className="h-5 w-5 text-emerald-600" />{records.filter((item) => item.is_active).length}</CardTitle></CardHeader></Card>
    </div>
    <ListingPanel
      title="Servicios registrados"
      description="Busca por nombre, clave o descripción."
      searchValue={searchInput}
      onSearchChange={setSearchInput}
      searchPlaceholder="Buscar servicio..."
      selectedCount={selection.selected.length}
      itemLabel={["servicio", "servicios"]}
      onClearSelection={selection.clear}
      exports={<ExcelExportButton columns={columns} data={records} filename="servicios" selected={selection.selected} disabled={query.isFetching} fetchAll={() => fetchAllPages((nextPage, size) => getServices({ ...params, page: nextPage, per_page: size }))} />}
      activeFilters={activeFilter === "all" ? 0 : 1}
      filters={<Filter hideHeader defaultOpen enableDateRange={false} dropdowns={[{ key: "activo", label: "Activo", options: [{ label: "Sí", value: "1" }, { label: "No", value: "0" }] }]} initialValues={{ selects: { activo: activeFilter === "all" ? undefined : activeFilter }, checks: {} }} onApply={(values) => { setActiveFilter(values.selects.activo ?? "all"); setPage(1) }} onReset={() => { setActiveFilter("all"); setPage(1) }} />}
    >
      <DataTable columns={selectableColumns} data={records} rowSelection={selection.rowSelection} onRowSelectionChange={selection.setRowSelection} getRowId={selection.getRowId} enableRowSelection enableSearch={false} enableExport={false} pageSize={10} enablePagination manualPagination pageIndex={(meta?.page ?? page) - 1} pageCount={meta?.totalPages ?? 1} onPageChange={(index) => setPage(index + 1)} isLoading={query.isFetching} />
    </ListingPanel>
    <ServiceForm editRecord={editRecord} isSubmitting={updateMutation.isPending} onSubmit={update} open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) setEditRecord(null) }} showTrigger={false} />
    <DeleteConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={remove} itemName={deleteRecord?.name} loading={deleteMutation.isPending} />
  </div>
}
