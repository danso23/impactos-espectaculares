import * as React from "react"
import { Search, ReceiptText, CircleCheckBig, CircleDashed } from "lucide-react"
import { toast } from "sonner"

import { DataTable } from "@/components/generic/data-table"
import { DeleteConfirmDialog } from "@/components/generic/delete-confirm-dialog"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
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
  const totalRentals = meta?.total ?? 0
  const visibleActiveRentals = rentals.filter((rental) => rental.status === "active").length
  const visibleCompletedRentals = rentals.filter((rental) => rental.status === "completed").length
  const visibleDraftRentals = rentals.filter((rental) => rental.status === "draft").length

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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
            <ReceiptText className="h-3.5 w-3.5" />
            Control de rentas
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Rentas</h1>
            <p className="mt-2 max-w-2xl text-gray-600">
              Revisa y administra las rentas registradas desde una sola pantalla.
            </p>
          </div>
        </div>

        <RentalForm isSubmitting={createMutation.isPending} onSubmit={handleCreate} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-gray-200 shadow-md">
          <CardHeader className="pb-3">
            <CardDescription>Total registrados</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <ReceiptText className="h-5 w-5 text-purple-600" />
              {totalRentals}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-gray-200 shadow-md">
          <CardHeader className="pb-3">
            <CardDescription>Borradores en página</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <CircleDashed className="h-5 w-5 text-slate-500" />
              {visibleDraftRentals}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-gray-200 shadow-md">
          <CardHeader className="pb-3">
            <CardDescription>Activas en página</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <CircleCheckBig className="h-5 w-5 text-emerald-600" />
              {visibleActiveRentals}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-gray-200 shadow-md">
          <CardHeader className="pb-3">
            <CardDescription>Completadas en página</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <CircleCheckBig className="h-5 w-5 text-indigo-600" />
              {visibleCompletedRentals}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-gray-200 shadow-lg">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-xl">Búsqueda rápida</CardTitle>
              <CardDescription>
                Filtra por nota, estatus o Quote ID.
              </CardDescription>
            </div>

            <div className="w-full lg:max-w-md">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Buscar renta..."
                  className="rounded-xl border-gray-300 bg-white pl-10 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          <Separator />
        </CardHeader>

        <CardContent className="pt-0">
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
        </CardContent>
      </Card>

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
