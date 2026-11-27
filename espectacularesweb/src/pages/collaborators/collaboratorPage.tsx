import * as React from "react"
import { UserCheck2, UsersRound } from "lucide-react"
import { toast } from "sonner"
import { Can } from "@/components/auth/Can"
import { DataTable } from "@/components/generic/data-table"
import { ListingPanel } from "@/components/generic/listing-panel"
import { ExcelExportButton } from "@/components/generic/excel-export-button"
import { createSelectColumn } from "@/components/generic/select-column"
import { useTableSelection } from "@/hooks/useTableSelection"
import { fetchAllPages } from "@/lib/fetchAllPages"
import { getCollaborators } from "@/lib/services/collaboratorService"
import { Filter } from "@/components/generic/filter"
import { DeleteConfirmDialog } from "@/components/generic/delete-confirm-dialog"
import { ModuleHeader } from "@/components/generic/module-header"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useCollaborators, useCreateCollaborator, useDeleteCollaborator, useUpdateCollaborator } from "@/lib/hooks/collaboratorHook"
import type { CollaboratorFormValues, CollaboratorRecord } from "@/types/Collaborator"
import { CollaboratorForm } from "./collaboratorForm"
import { useCollaboratorTable } from "./collaboratorTable"

export default function CollaboratorPage() {
  const createMutation = useCreateCollaborator(), updateMutation = useUpdateCollaborator(), deleteMutation = useDeleteCollaborator()
  const [page, setPage] = React.useState(1), [searchInput, setSearchInput] = React.useState(""), [search, setSearch] = React.useState("")
  const [activeFilter, setActiveFilter] = React.useState("all")
  const [editRecord, setEditRecord] = React.useState<CollaboratorRecord | null>(null), [editOpen, setEditOpen] = React.useState(false)
  const [deleteRecord, setDeleteRecord] = React.useState<CollaboratorRecord | null>(null), [deleteOpen, setDeleteOpen] = React.useState(false)
  React.useEffect(() => { const timer = window.setTimeout(() => { setSearch(searchInput); setPage(1) }, 350); return () => window.clearTimeout(timer) }, [searchInput])
  const params = React.useMemo(() => ({ page, per_page: 10, q: search || undefined, active: activeFilter === "all" ? undefined : activeFilter }), [activeFilter, page, search])
  const query = useCollaborators(params), records = query.data?.data ?? [], meta = query.data?.meta
  const columns = useCollaboratorTable({ onEdit: React.useCallback((row) => { setEditRecord(row); setEditOpen(true) }, []), onDelete: React.useCallback((row) => { setDeleteRecord(row); setDeleteOpen(true) }, []) })

  async function create(payload: CollaboratorFormValues) { try { await createMutation.mutateAsync(payload); toast.success("Colaborador creado correctamente") } catch (error) { toast.error("No se pudo crear el colaborador", { description: error instanceof Error ? error.message : undefined }); throw error } }
  async function update(payload: CollaboratorFormValues) { if (!editRecord) return; try { await updateMutation.mutateAsync({ id: editRecord.id, payload }); toast.success("Colaborador actualizado correctamente"); setEditRecord(null) } catch (error) { toast.error("No se pudo actualizar el colaborador", { description: error instanceof Error ? error.message : undefined }); throw error } }
  async function remove() { if (!deleteRecord) return; try { await deleteMutation.mutateAsync(deleteRecord.id); toast.success("Colaborador eliminado correctamente"); setDeleteOpen(false) } catch (error) { toast.error("No se pudo eliminar el colaborador", { description: error instanceof Error ? error.message : undefined }) } finally { setDeleteRecord(null) } }

  // Selección de filas: si hay seleccionadas, se exportan solo esas.
  const selection = useTableSelection(records)
  const selectableColumns = React.useMemo(
    () => [createSelectColumn<(typeof records)[number]>(), ...columns],
    [columns],
  )

  return <div className="mx-auto max-w-7xl space-y-5 sm:space-y-8 animate-in fade-in duration-500">
    <ModuleHeader title="Colaboradores" badge="Control de colaboradores" description="Administra los datos de contacto y estatus del equipo interno." icon={UsersRound} actions={<Can permission="collaborators.edit"><CollaboratorForm isSubmitting={createMutation.isPending} onSubmit={create} /></Can>} />
    <div className="grid gap-4 sm:grid-cols-2">
      <Card><CardHeader><CardDescription>Total registrados</CardDescription><CardTitle className="flex items-center gap-2 text-3xl"><UsersRound className="h-5 w-5 text-purple-600" />{meta?.total ?? 0}</CardTitle></CardHeader></Card>
      <Card><CardHeader><CardDescription>Activos en esta página</CardDescription><CardTitle className="flex items-center gap-2 text-3xl"><UserCheck2 className="h-5 w-5 text-emerald-600" />{records.filter((item) => item.active).length}</CardTitle></CardHeader></Card>
    </div>
    <ListingPanel
      title="Colaboradores registrados"
      description="Busca por nombre, puesto, teléfono, email o notas."
      searchValue={searchInput}
      onSearchChange={setSearchInput}
      searchPlaceholder="Buscar colaborador..."
      selectedCount={selection.selected.length}
      itemLabel={["colaborador", "colaboradores"]}
      onClearSelection={selection.clear}
      exports={<ExcelExportButton columns={columns} data={records} filename="colaboradores" selected={selection.selected} disabled={query.isFetching} fetchAll={() => fetchAllPages((nextPage, size) => getCollaborators({ ...params, page: nextPage, per_page: size }))} />}
      activeFilters={activeFilter === "all" ? 0 : 1}
      filters={<Filter hideHeader defaultOpen enableDateRange={false} dropdowns={[{ key: "activo", label: "Activo", options: [{ label: "Sí", value: "1" }, { label: "No", value: "0" }] }]} initialValues={{ selects: { activo: activeFilter === "all" ? undefined : activeFilter }, checks: {} }} onApply={(values) => { setActiveFilter(values.selects.activo ?? "all"); setPage(1) }} onReset={() => { setActiveFilter("all"); setPage(1) }} />}
    >
      <DataTable columns={selectableColumns} data={records} rowSelection={selection.rowSelection} onRowSelectionChange={selection.setRowSelection} getRowId={selection.getRowId} enableRowSelection enableSearch={false} enableExport={false} pageSize={10} enablePagination manualPagination pageIndex={(meta?.page ?? page) - 1} pageCount={meta?.totalPages ?? 1} onPageChange={(index) => setPage(index + 1)} isLoading={query.isFetching} />
    </ListingPanel>
    <CollaboratorForm editRecord={editRecord} isSubmitting={updateMutation.isPending} onSubmit={update} open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) setEditRecord(null) }} showTrigger={false} />
    <DeleteConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={remove} itemName={deleteRecord?.name} loading={deleteMutation.isPending} />
  </div>
}
