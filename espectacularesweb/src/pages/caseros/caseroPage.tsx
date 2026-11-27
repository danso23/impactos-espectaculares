import * as React from "react"
import { BadgeDollarSign, CalendarRange, MailCheck, MapPinned, UsersRound } from "lucide-react"
import { toast } from "sonner"

import { DataTable } from "@/components/generic/data-table"
import { ListingPanel } from "@/components/generic/listing-panel"
import { ExcelExportButton } from "@/components/generic/excel-export-button"
import { createSelectColumn } from "@/components/generic/select-column"
import { useTableSelection } from "@/hooks/useTableSelection"
import { fetchAllPages } from "@/lib/fetchAllPages"
import { getCaseros } from "@/lib/services/caseroService"
import { Filter } from "@/components/generic/filter"
import { ModuleHeader } from "@/components/generic/module-header"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { GroundRentReportDialog } from "@/pages/caseros/groundRentReportDialog"
import { Button } from "@/components/ui/button"
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
  const [reportOpen, setReportOpen] = React.useState(false)

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

  // Selección de filas: si hay seleccionadas, se exportan solo esas.
  const selection = useTableSelection(caseros)
  const selectableColumns = React.useMemo(
    () => [createSelectColumn<(typeof caseros)[number]>(), ...columns],
    [columns],
  )

  return (
    <div className="max-w-7xl mx-auto space-y-5 sm:space-y-8 animate-in fade-in duration-500">
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

      <ListingPanel
        title="Búsqueda rápida"
        description="Filtra por nombre, teléfono, email, RFC, ciudad o banco."
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Buscar casero..."
        actions={<Button type="button" variant="outline" className="h-11 border-violet-200 bg-violet-50 text-violet-700 shadow-sm hover:bg-violet-100" onClick={() => setReportOpen(true)}><CalendarRange className="h-4 w-4" />Reporte de pagos</Button>}
        selectedCount={selection.selected.length}
        itemLabel={["casero", "caseros"]}
        onClearSelection={selection.clear}
        exports={<ExcelExportButton columns={columns} data={caseros} filename="caseros" selected={selection.selected} disabled={caserosQuery.isFetching} fetchAll={() => fetchAllPages((nextPage, size) => getCaseros({ ...params, page: nextPage, per_page: size }))} />}
        activeFilters={activeFilter === "all" ? 0 : 1}
        filters={<Filter hideHeader defaultOpen enableDateRange={false} dropdowns={[{ key: "activo", label: "Activo", options: [{ label: "Sí", value: "1" }, { label: "No", value: "0" }] }]} initialValues={{ selects: { activo: activeFilter === "all" ? undefined : activeFilter }, checks: {} }} onApply={(values) => { setActiveFilter(values.selects.activo ?? "all"); setPage(1) }} onReset={() => { setActiveFilter("all"); setPage(1) }} />}
      >
        <DataTable columns={selectableColumns} data={caseros} rowSelection={selection.rowSelection} onRowSelectionChange={selection.setRowSelection} getRowId={selection.getRowId} enableRowSelection enableSearch={false} enableExport={false} pageSize={perPage} enablePagination manualPagination pageIndex={(meta?.page ?? page) - 1} pageCount={meta?.totalPages ?? 1} onPageChange={(nextPageIndex) => setPage(nextPageIndex + 1)} isLoading={caserosQuery.isFetching} />
      </ListingPanel>

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

      <GroundRentReportDialog open={reportOpen} onOpenChange={setReportOpen} />
    </div>
  )
}
