import * as React from "react"
import { CircleDollarSign, Search, Settings } from "lucide-react"
import { toast } from "sonner"
import { Can } from "@/components/auth/Can"
import { DataTable } from "@/components/generic/data-table"
import { DeleteConfirmDialog } from "@/components/generic/delete-confirm-dialog"
import { ModuleHeader } from "@/components/generic/module-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useCreateService, useDeleteService, useServices, useUpdateService } from "@/lib/hooks/serviceHook"
import type { ServiceFormValues, ServiceRecord } from "@/types/Service"
import { ServiceForm } from "./serviceForm"
import { useServiceTable } from "./serviceTable"

export default function ServicePage() {
  const createMutation = useCreateService(), updateMutation = useUpdateService(), deleteMutation = useDeleteService()
  const [page, setPage] = React.useState(1), [searchInput, setSearchInput] = React.useState(""), [search, setSearch] = React.useState("")
  const [editRecord, setEditRecord] = React.useState<ServiceRecord | null>(null), [editOpen, setEditOpen] = React.useState(false)
  const [deleteRecord, setDeleteRecord] = React.useState<ServiceRecord | null>(null), [deleteOpen, setDeleteOpen] = React.useState(false)
  React.useEffect(() => { const timer = window.setTimeout(() => { setSearch(searchInput); setPage(1) }, 350); return () => window.clearTimeout(timer) }, [searchInput])
  const params = React.useMemo(() => ({ page, per_page: 10, q: search || undefined }), [page, search])
  const query = useServices(params), records = query.data?.data ?? [], meta = query.data?.meta
  const columns = useServiceTable({ onEdit: React.useCallback((row) => { setEditRecord(row); setEditOpen(true) }, []), onDelete: React.useCallback((row) => { setDeleteRecord(row); setDeleteOpen(true) }, []) })

  async function create(payload: ServiceFormValues) { try { await createMutation.mutateAsync(payload); toast.success("Servicio creado correctamente") } catch (error) { toast.error("No se pudo crear el servicio", { description: error instanceof Error ? error.message : undefined }); throw error } }
  async function update(payload: ServiceFormValues) { if (!editRecord) return; try { await updateMutation.mutateAsync({ id: editRecord.id, payload }); toast.success("Servicio actualizado correctamente"); setEditRecord(null) } catch (error) { toast.error("No se pudo actualizar el servicio", { description: error instanceof Error ? error.message : undefined }); throw error } }
  async function remove() { if (!deleteRecord) return; try { const result = await deleteMutation.mutateAsync(deleteRecord.id); toast.success(result.message || "Servicio eliminado correctamente"); setDeleteOpen(false) } catch (error) { toast.error("No se pudo eliminar el servicio", { description: error instanceof Error ? error.message : undefined }) } finally { setDeleteRecord(null) } }

  return <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500">
    <ModuleHeader title="Servicios" badge="Catálogo de servicios" description="Administra los conceptos, precios e impuestos disponibles en las cotizaciones." icon={Settings} actions={<Can permission="services.edit"><ServiceForm isSubmitting={createMutation.isPending} onSubmit={create} /></Can>} />
    <div className="grid gap-4 sm:grid-cols-2">
      <Card><CardHeader><CardDescription>Total registrados</CardDescription><CardTitle className="flex items-center gap-2 text-3xl"><Settings className="h-5 w-5 text-purple-600" />{meta?.total ?? 0}</CardTitle></CardHeader></Card>
      <Card><CardHeader><CardDescription>Activos en esta página</CardDescription><CardTitle className="flex items-center gap-2 text-3xl"><CircleDollarSign className="h-5 w-5 text-emerald-600" />{records.filter((item) => item.is_active).length}</CardTitle></CardHeader></Card>
    </div>
    <Card className="shadow-lg"><CardHeader className="space-y-4"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><CardTitle>Servicios registrados</CardTitle><CardDescription>Busca por nombre, clave o descripción.</CardDescription></div><div className="relative w-full lg:max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-10" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Buscar servicio..." /></div></div><Separator /></CardHeader><CardContent><DataTable columns={columns} data={records} enableSearch={false} pageSize={10} enablePagination manualPagination pageIndex={(meta?.page ?? page) - 1} pageCount={meta?.totalPages ?? 1} onPageChange={(index) => setPage(index + 1)} isLoading={query.isFetching} /></CardContent></Card>
    <ServiceForm editRecord={editRecord} isSubmitting={updateMutation.isPending} onSubmit={update} open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) setEditRecord(null) }} showTrigger={false} />
    <DeleteConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={remove} itemName={deleteRecord?.name} loading={deleteMutation.isPending} />
  </div>
}
