import * as React from "react"
import { BadgeDollarSign, MailCheck, MapPinned, Search, UsersRound } from "lucide-react"
import { toast } from "sonner"

import { DataTable } from "@/components/generic/data-table"
import { ExcelExportButton } from "@/components/generic/excel-export-button"
import { Filter } from "@/components/generic/filter"
import { ModuleHeader } from "@/components/generic/module-header"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { DeleteConfirmDialog } from "@/components/generic/delete-confirm-dialog"
import {
  useCaseros,
  useCreateCasero,
  useUpdateCasero,
  useDeleteCasero,
} from "@/lib/hooks/caseroHook"
import { CaseroForm } from "@/pages/caseros/caseroForm"
import { useCaseroTable } from "@/pages/caseros/caseroTable"
import { GroundRentalsDialog } from "@/pages/caseros/groundRentalsDialog"
import type { CaseroFormValues, CaseroRecord } from "@/types/Casero"
import { Can } from "@/components/auth/Can"
import { useRoles } from "@/hooks/useRoles"

export default function CaseroPage() {
  const createMutation = useCreateCasero()
  const updateMutation = useUpdateCasero()
  const deleteMutation = useDeleteCasero()
  const { can } = useRoles()

  const [page, setPage] = React.useState(1)
  const [searchInput, setSearchInput] = React.useState("")
  const [search, setSearch] = React.useState("")
  const [activeFilter, setActiveFilter] = React.useState("all")
  const perPage = 10

  // Edit dialog state
  const [editRecord, setEditRecord] = React.useState<CaseroRecord | null>(null)
  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteRecord, setDeleteRecord] = React.useState<CaseroRecord | null>(null)
  const [groundRentRecord, setGroundRentRecord] = React.useState<CaseroRecord | null>(null)

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
      active: activeFilter === "all" ? undefined : activeFilter,
    }),
    [activeFilter, page, perPage, search]
  )

  const caserosQuery = useCaseros(params)
  const caseros = caserosQuery.data?.data ?? []
  const meta = caserosQuery.data?.meta

  const handleEdit = React.useCallback((row: CaseroRecord) => {
    setEditRecord(row)
    setEditOpen(true)
  }, [])

  const columns = useCaseroTable({ onEdit: handleEdit, onDelete: setDeleteRecord, onGroundRentals: setGroundRentRecord })
  const totalCaseros = meta?.total ?? 0
  const visibleWithEmail = caseros.filter((casero) => !!casero.email).length
  const activeCaseros = caseros.filter((casero) => casero.active !== false).length

  async function handleCreate(payload: CaseroFormValues) {
    try {
      await createMutation.mutateAsync(payload)
      toast.success("Casero creado correctamente")
    } catch (error) {
      toast.error("No se pudo crear el casero", {
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
      })
      throw error
    }
  }

  async function handleUpdate(payload: CaseroFormValues) {
    if (!editRecord) return

    try {
      await updateMutation.mutateAsync({ id: editRecord.id, payload })
      toast.success("Casero actualizado correctamente")
      setEditOpen(false)
      setEditRecord(null)
    } catch (error) {
      toast.error("No se pudo actualizar el casero", {
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
      })
      throw error
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <ModuleHeader
        title="Caseros"
        badge="Control de propietarios"
        description="Propietarios de terrenos donde se ubican los espectaculares."
        icon={MapPinned}
        actions={<Can permission="caseros.edit">
          <CaseroForm
            isSubmitting={createMutation.isPending}
            onSubmit={handleCreate}
          />
        </Can>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card className="border-gray-200 shadow-md"><CardHeader className="pb-3"><CardDescription>Total registrados</CardDescription><CardTitle className="flex items-center gap-2 text-3xl"><UsersRound className="h-5 w-5 text-purple-600" />{totalCaseros}</CardTitle></CardHeader></Card>
        <Card className="border-gray-200 shadow-md"><CardHeader className="pb-3"><CardDescription>Con email visible</CardDescription><CardTitle className="flex items-center gap-2 text-3xl"><MailCheck className="h-5 w-5 text-emerald-600" />{visibleWithEmail}</CardTitle></CardHeader></Card>
        <Card className="border-gray-200 shadow-md"><CardHeader className="pb-3"><CardDescription>Activos visibles</CardDescription><CardTitle className="flex items-center gap-2 text-3xl"><BadgeDollarSign className="h-5 w-5 text-slate-500" />{activeCaseros}</CardTitle></CardHeader></Card>
      </div>

      <Card className="border-gray-200 shadow-lg">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div><CardTitle className="text-xl">Búsqueda rápida</CardTitle><CardDescription>Filtra por nombre, teléfono, email, RFC, ciudad o banco.</CardDescription></div>
            <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto"><div className="relative w-full lg:w-80"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Buscar casero..." className="rounded-xl border-gray-300 bg-white pl-10 shadow-sm focus:border-purple-500 focus:ring-purple-500" /></div><ExcelExportButton columns={columns} data={caseros} filename="caseros" disabled={caserosQuery.isFetching} /></div>
          </div>
          <Separator />
        </CardHeader>
        <CardContent className="space-y-6 pt-0"><Filter title="Filtros avanzados" enableDateRange={false} defaultOpen={false} dropdowns={[{ key: "activo", label: "Activo", options: [{ label: "Sí", value: "1" }, { label: "No", value: "0" }] }]} initialValues={{ selects: { activo: activeFilter === "all" ? undefined : activeFilter }, checks: {} }} onApply={(values) => { setActiveFilter(values.selects.activo ?? "all"); setPage(1) }} onReset={() => { setActiveFilter("all"); setPage(1) }} /><DataTable columns={columns} data={caseros} enableSearch={false} enableExport={false} pageSize={perPage} enablePagination manualPagination pageIndex={(meta?.page ?? page) - 1} pageCount={meta?.totalPages ?? 1} onPageChange={(nextPageIndex) => setPage(nextPageIndex + 1)} isLoading={caserosQuery.isFetching} /></CardContent>
      </Card>

      {/* Edit dialog */}
      <CaseroForm
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
        open={!!deleteRecord}
        onOpenChange={(open) => { if (!open) setDeleteRecord(null) }}
        title="Eliminar casero"
        description="Esta acción no se puede deshacer."
        itemName={deleteRecord ? [deleteRecord.nombre, deleteRecord.apellido_paterno, deleteRecord.apellido_materno].filter(Boolean).join(" ") : undefined}
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteRecord) return
          deleteMutation.mutate(deleteRecord.id, {
            onSuccess: () => { toast.success("Casero eliminado correctamente"); setDeleteRecord(null) },
            onError: (error) => toast.error("No se pudo eliminar el casero", { description: error instanceof Error ? error.message : "Intenta nuevamente." }),
          })
        }}
      />

      <GroundRentalsDialog
        casero={groundRentRecord}
        open={!!groundRentRecord}
        onOpenChange={(open) => { if (!open) setGroundRentRecord(null) }}
        canEdit={can("caseros.edit")}
      />
    </div>
  )
}
