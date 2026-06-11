import * as React from "react"
import { toast } from "sonner"

import { DataTable } from "@/components/generic/data-table"
import { DeleteConfirmDialog } from "@/components/generic/delete-confirm-dialog"
import { Input } from "@/components/ui/input"
import {
  useCreateRental,
  useDeleteRental,
  useRentals,
  useUpdateRental,
} from "@/lib/hooks/rentalHook"
import type { RentalFormValues, RentalRecord } from "@/types/Rental"
import { RentalForm } from "./rentalForm"
import { useRentalTable } from "./rentalTable"

export default function RentalPage() {
  const createMutation = useCreateRental()
  const updateMutation = useUpdateRental()
  const deleteMutation = useDeleteRental()

  const [page, setPage] = React.useState(1)
  const [searchInput, setSearchInput] = React.useState("")
  const [search, setSearch] = React.useState("")
  const perPage = 10

  const [editRecord, setEditRecord] = React.useState<RentalRecord | null>(null)
  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [rentalToDelete, setRentalToDelete] = React.useState<RentalRecord | null>(null)

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

  const rentalsQuery = useRentals(params)
  const rentals = rentalsQuery.data?.data ?? []
  const meta = rentalsQuery.data?.meta

  const handleEdit = React.useCallback((row: RentalRecord) => {
    setEditRecord(row)
    setEditOpen(true)
  }, [])

  const handleDelete = React.useCallback((row: RentalRecord) => {
    setRentalToDelete(row)
    setDeleteDialogOpen(true)
  }, [])

  const columns = useRentalTable({ onEdit: handleEdit, onDelete: handleDelete })

  async function handleCreate(payload: RentalFormValues) {
    try {
      await createMutation.mutateAsync(payload)
      toast.success("Renta creada correctamente")
    } catch (error) {
      toast.error("No se pudo crear la renta", {
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
      })
      throw error
    }
  }

  async function handleUpdate(payload: RentalFormValues) {
    if (!editRecord) return

    try {
      await updateMutation.mutateAsync({ id: editRecord.id, payload })
      toast.success("Renta actualizada correctamente")
      setEditOpen(false)
      setEditRecord(null)
    } catch (error) {
      toast.error("No se pudo actualizar la renta", {
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
      })
      throw error
    }
  }

  const handleConfirmDelete = async () => {
    if (!rentalToDelete) return

    try {
      await deleteMutation.mutateAsync(rentalToDelete.id)
      toast.success("Renta eliminada correctamente")
      setDeleteDialogOpen(false)
    } catch (error) {
      toast.error("No se pudo eliminar la renta", {
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
      })
    } finally {
      setRentalToDelete(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Rentas</h1>
          <p className="text-gray-600">Gestiona las rentas registradas en el sistema.</p>
        </div>

        <RentalForm isSubmitting={createMutation.isPending} onSubmit={handleCreate} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Buscar por nota, estatus o quote ID..."
          className="rounded-lg border-gray-300 focus:ring-purple-500"
        />
      </div>

      <DataTable
        columns={columns}
        data={rentals}
        enableSearch={false}
        pageSize={perPage}
        enablePagination
        manualPagination
        pageIndex={(meta?.page ?? page) - 1}
        pageCount={meta?.totalPages ?? 1}
        onPageChange={(nextPageIndex) => setPage(nextPageIndex + 1)}
        isLoading={rentalsQuery.isFetching}
      />

      <RentalForm
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
        itemName={rentalToDelete?.quote_id != null ? `Renta #${rentalToDelete.quote_id}` : undefined}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
