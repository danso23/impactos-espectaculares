import * as React from "react"
import { MapPinned } from "lucide-react"
import { toast } from "sonner"

import { DataTable } from "@/components/generic/data-table"
import { ModuleHeader } from "@/components/generic/module-header"
import { Input } from "@/components/ui/input"
import {
  useCaseros,
  useCreateCasero,
  useUpdateCasero,
  useDeleteCasero,
} from "@/lib/hooks/caseroHook"
import { CaseroForm } from "@/pages/caseros/caseroForm"
import { useCaseroTable } from "@/pages/caseros/caseroTable"
import type { CaseroFormValues, CaseroRecord } from "@/types/Casero"
import { Can } from "@/components/auth/Can"

export default function CaseroPage() {
  const createMutation = useCreateCasero()
  const updateMutation = useUpdateCasero()
  const deleteMutation = useDeleteCasero()

  const [page, setPage] = React.useState(1)
  const [searchInput, setSearchInput] = React.useState("")
  const [search, setSearch] = React.useState("")
  const perPage = 10

  // Edit dialog state
  const [editRecord, setEditRecord] = React.useState<CaseroRecord | null>(null)
  const [editOpen, setEditOpen] = React.useState(false)

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
    }),
    [page, perPage, search]
  )

  const caserosQuery = useCaseros(params)
  const caseros = caserosQuery.data?.data ?? []
  const meta = caserosQuery.data?.meta

  const handleEdit = React.useCallback((row: CaseroRecord) => {
    setEditRecord(row)
    setEditOpen(true)
  }, [])

  const handleDelete = React.useCallback(
    async (row: CaseroRecord) => {
      const fullName = [row.nombre, row.apellido_paterno, row.apellido_materno]
        .filter(Boolean)
        .join(" ")

      const confirmDelete = window.confirm(
        `¿Eliminar al casero "${fullName}"? Esta acción no se puede deshacer.`
      )
      if (!confirmDelete) return

      try {
        await deleteMutation.mutateAsync(row.id)
        toast.success("Casero eliminado correctamente")
      } catch (error) {
        toast.error("No se pudo eliminar el casero", {
          description: error instanceof Error ? error.message : "Intenta nuevamente.",
        })
      }
    },
    [deleteMutation]
  )

  const columns = useCaseroTable({ onEdit: handleEdit, onDelete: handleDelete })

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

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <div className="flex-1">
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por nombre, teléfono, email, RFC..."
              className="rounded-lg border-gray-300 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={caseros}
        enableSearch={false}
        pageSize={perPage}
        enablePagination
        manualPagination
        pageIndex={(meta?.page ?? page) - 1}
        pageCount={meta?.totalPages ?? 1}
        onPageChange={(nextPageIndex) => setPage(nextPageIndex + 1)}
        isLoading={caserosQuery.isFetching}
      />

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
    </div>
  )
}
