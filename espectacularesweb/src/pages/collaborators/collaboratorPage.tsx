import * as React from "react"
import { Search, UserCheck2, UsersRound } from "lucide-react"
import { toast } from "sonner"
import { Can } from "@/components/auth/Can"
import { DataTable } from "@/components/generic/data-table"
import { DeleteConfirmDialog } from "@/components/generic/delete-confirm-dialog"
import { ModuleHeader } from "@/components/generic/module-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useCollaborators, useCreateCollaborator, useDeleteCollaborator, useUpdateCollaborator } from "@/lib/hooks/collaboratorHook"
import type { CollaboratorFormValues, CollaboratorRecord } from "@/types/Collaborator"
import { CollaboratorForm } from "./collaboratorForm"
import { useCollaboratorTable } from "./collaboratorTable"

export default function CollaboratorPage() {
  const createMutation = useCreateCollaborator(), updateMutation = useUpdateCollaborator(), deleteMutation = useDeleteCollaborator()
  const [page, setPage] = React.useState(1), [searchInput, setSearchInput] = React.useState(""), [search, setSearch] = React.useState("")
  const [editRecord, setEditRecord] = React.useState<CollaboratorRecord | null>(null), [editOpen, setEditOpen] = React.useState(false)
  const [deleteRecord, setDeleteRecord] = React.useState<CollaboratorRecord | null>(null), [deleteOpen, setDeleteOpen] = React.useState(false)
  React.useEffect(() => { const timer = window.setTimeout(() => { setSearch(searchInput); setPage(1) }, 350); return () => window.clearTimeout(timer) }, [searchInput])
  const params = React.useMemo(() => ({ page, per_page: 10, q: search || undefined }), [page, search])
  const query = useCollaborators(params), records = query.data?.data ?? [], meta = query.data?.meta
  const columns = useCollaboratorTable({ onEdit: React.useCallback((row) => { setEditRecord(row); setEditOpen(true) }, []), onDelete: React.useCallback((row) => { setDeleteRecord(row); setDeleteOpen(true) }, []) })

  async function create(payload: CollaboratorFormValues) { try { await createMutation.mutateAsync(payload); toast.success("Colaborador creado correctamente") } catch (error) { toast.error("No se pudo crear el colaborador", { description: error instanceof Error ? error.message : undefined }); throw error } }
  async function update(payload: CollaboratorFormValues) { if (!editRecord) return; try { await updateMutation.mutateAsync({ id: editRecord.id, payload }); toast.success("Colaborador actualizado correctamente"); setEditRecord(null) } catch (error) { toast.error("No se pudo actualizar el colaborador", { description: error instanceof Error ? error.message : undefined }); throw error } }
  async function remove() { if (!deleteRecord) return; try { await deleteMutation.mutateAsync(deleteRecord.id); toast.success("Colaborador eliminado correctamente"); setDeleteOpen(false) } catch (error) { toast.error("No se pudo eliminar el colaborador", { description: error instanceof Error ? error.message : undefined }) } finally { setDeleteRecord(null) } }

  return <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500">
    <ModuleHeader title="Colaboradores" badge="Control de colaboradores" description="Administra los datos de contacto y estatus del equipo interno." icon={UsersRound} actions={<Can permission="collaborators.edit"><CollaboratorForm isSubmitting={createMutation.isPending} onSubmit={create} /></Can>} />
    <div className="grid gap-4 sm:grid-cols-2">
      <Card><CardHeader><CardDescription>Total registrados</CardDescription><CardTitle className="flex items-center gap-2 text-3xl"><UsersRound className="h-5 w-5 text-purple-600" />{meta?.total ?? 0}</CardTitle></CardHeader></Card>
      <Card><CardHeader><CardDescription>Activos en esta página</CardDescription><CardTitle className="flex items-center gap-2 text-3xl"><UserCheck2 className="h-5 w-5 text-emerald-600" />{records.filter((item) => item.active).length}</CardTitle></CardHeader></Card>
    </div>
    <Card className="shadow-lg"><CardHeader className="space-y-4"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><CardTitle>Colaboradores registrados</CardTitle><CardDescription>Busca por nombre, puesto, teléfono, email o notas.</CardDescription></div><div className="relative w-full lg:max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-10" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Buscar colaborador..." /></div></div><Separator /></CardHeader><CardContent><DataTable columns={columns} data={records} enableSearch={false} pageSize={10} enablePagination manualPagination pageIndex={(meta?.page ?? page) - 1} pageCount={meta?.totalPages ?? 1} onPageChange={(index) => setPage(index + 1)} isLoading={query.isFetching} /></CardContent></Card>
    <CollaboratorForm editRecord={editRecord} isSubmitting={updateMutation.isPending} onSubmit={update} open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) setEditRecord(null) }} showTrigger={false} />
    <DeleteConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={remove} itemName={deleteRecord?.name} loading={deleteMutation.isPending} />
  </div>
}
