import * as React from "react"
import { CalendarDays, CreditCard, Search, ReceiptText, CircleCheckBig, CircleDashed } from "lucide-react"
import { toast } from "sonner"

import { DataTable } from "@/components/generic/data-table"
import { DeleteConfirmDialog } from "@/components/generic/delete-confirm-dialog"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  useCreateRental,
  useConfirmRental,
  useDeleteRental,
  useRentals,
  useUpdateRental,
} from "@/lib/hooks/rentalHook"
import type { RentalCreatePayload, RentalFormValues, RentalRecord } from "@/types/Rental"
import { RentalCreateForm } from "./rentalCreateForm"
import { RentalForm } from "./rentalForm"
import { useRentalTable } from "./rentalTable"

function formatCurrency(value?: number | string | null) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number(value ?? 0))
}

function formatDate(value?: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeZone: "UTC" })
    .format(new Date(`${value.slice(0, 10)}T00:00:00Z`))
}

function paymentFrequencyLabel(value?: string | null) {
  if (value === "single") return "Pago único"
  if (value === "weekly") return "Semanal"
  if (value === "biweekly") return "Quincenal"
  if (value === "monthly") return "Mensual"
  return "Sin plan definido"
}

function invoiceStatusLabel(value?: string | null) {
  if (value === "draft") return "Programado"
  if (value === "issued") return "Emitido"
  if (value === "paid") return "Pagado"
  if (value === "overdue") return "Vencido"
  if (value === "cancelled") return "Cancelado"
  return value ?? "—"
}

export default function RentalPage() {
  const createMutation = useCreateRental()
  const updateMutation = useUpdateRental()
  const deleteMutation = useDeleteRental()
  const confirmMutation = useConfirmRental()

  const [page, setPage] = React.useState(1)
  const [searchInput, setSearchInput] = React.useState("")
  const [search, setSearch] = React.useState("")
  const perPage = 10

  const [editRecord, setEditRecord] = React.useState<RentalRecord | null>(null)
  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [rentalToDelete, setRentalToDelete] = React.useState<RentalRecord | null>(null)
  const [paymentPlanRecord, setPaymentPlanRecord] = React.useState<RentalRecord | null>(null)
  const [rentalToConfirm, setRentalToConfirm] = React.useState<RentalRecord | null>(null)

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

  const columns = useRentalTable({
    onEdit: handleEdit,
    onDelete: handleDelete,
    onViewPayments: setPaymentPlanRecord,
    onConfirm: setRentalToConfirm,
  })

  async function handleConfirmRental() {
    if (!rentalToConfirm) return

    try {
      await confirmMutation.mutateAsync(rentalToConfirm.id)
      toast.success("Renta confirmada", {
        description: "Los espacios quedaron reservados y sus cobros fueron emitidos.",
      })
      setRentalToConfirm(null)
    } catch (error) {
      toast.error("No se pudo confirmar la renta", {
        description: error instanceof Error ? error.message : "Revisa la disponibilidad de los espacios.",
      })
    }
  }

  async function handleCreate(payload: RentalCreatePayload) {
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

        <RentalCreateForm isSubmitting={createMutation.isPending} onSubmit={handleCreate} />
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
            <CardDescription>Confirmadas en página</CardDescription>
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
                Filtra por ID, nota o estatus.
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

      <Dialog
        open={paymentPlanRecord !== null}
        onOpenChange={(open) => {
          if (!open) setPaymentPlanRecord(null)
        }}
      >
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Plan de pagos de la renta #{paymentPlanRecord?.id}</DialogTitle>
            <DialogDescription>
              Vigencia, frecuencia y parcialidades programadas para esta renta.
            </DialogDescription>
          </DialogHeader>

          {paymentPlanRecord ? (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays className="h-4 w-4 text-violet-600" />
                    Vigencia
                  </div>
                  <div className="mt-2 text-sm font-semibold">
                    {formatDate(paymentPlanRecord.starts_at)} – {formatDate(paymentPlanRecord.ends_at)}
                  </div>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CreditCard className="h-4 w-4 text-emerald-600" />
                    Frecuencia
                  </div>
                  <div className="mt-2 text-sm font-semibold">
                    {paymentFrequencyLabel(paymentPlanRecord.payment_frequency)}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs text-muted-foreground">Total contratado</div>
                  <div className="mt-2 text-lg font-bold">{formatCurrency(paymentPlanRecord.total)}</div>
                </div>
              </div>

              {paymentPlanRecord.invoices?.length ? (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <div className="min-w-[700px]">
                  <div className="grid grid-cols-[60px_1fr_1fr_120px_110px] gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <span>No.</span>
                    <span>Periodo</span>
                    <span>Vencimiento</span>
                    <span>Estatus</span>
                    <span className="text-right">Importe</span>
                  </div>
                  {paymentPlanRecord.invoices.map((invoice, index) => (
                    <div
                      key={invoice.id}
                      className="grid grid-cols-[60px_1fr_1fr_120px_110px] items-center gap-3 border-t border-slate-100 px-4 py-3 text-sm"
                    >
                      <span className="font-semibold text-violet-700">#{index + 1}</span>
                      <span>{formatDate(invoice.period_start)} – {formatDate(invoice.period_end)}</span>
                      <span>{formatDate(invoice.due_date)}</span>
                      <span className="w-fit rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium">
                        {invoiceStatusLabel(invoice.status)}
                      </span>
                      <span className="text-right font-semibold">{formatCurrency(invoice.total)}</span>
                    </div>
                  ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-muted-foreground">
                  {paymentPlanRecord.status === "draft"
                    ? "El calendario está definido y sus cargos se generarán al confirmar la renta."
                    : "Esta renta todavía no tiene parcialidades programadas."}
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

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
        itemName={rentalToDelete ? `Renta #${rentalToDelete.id}` : undefined}
        loading={deleteMutation.isPending}
      />

      <AlertDialog open={rentalToConfirm !== null} onOpenChange={(open) => !open && setRentalToConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar renta #{rentalToConfirm?.id}</AlertDialogTitle>
            <AlertDialogDescription>
              Se validará nuevamente la disponibilidad, se reservarán los espacios durante la vigencia y se activará el calendario de cobros.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={confirmMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={(event) => { event.preventDefault(); void handleConfirmRental() }} disabled={confirmMutation.isPending}>
              {confirmMutation.isPending ? "Confirmando..." : "Confirmar renta"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
