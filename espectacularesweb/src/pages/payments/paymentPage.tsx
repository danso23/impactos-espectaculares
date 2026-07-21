import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import {
  Banknote,
  CalendarClock,
  CircleDollarSign,
  Search,
  TriangleAlert,
  WalletCards,
} from "lucide-react"
import { toast } from "sonner"

import { createActionsColumn } from "@/components/generic/create-actions-column"
import { DataTable } from "@/components/generic/data-table"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useReceivables, useRegisterPayment } from "@/lib/hooks/paymentHook"
import type { PaymentMethod, ReceivableRecord } from "@/types/Payment"

const ALL_STATUSES = "all"

function formatCurrency(value?: number | null) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value ?? 0)
}

function formatDate(value?: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeZone: "UTC" })
    .format(new Date(`${value.slice(0, 10)}T00:00:00Z`))
}

function localDateTimeValue() {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 16)
}

function daysUntilDue(value?: string | null) {
  if (!value) return null
  const dueDate = new Date(`${value.slice(0, 10)}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (Number.isNaN(dueDate.getTime())) return null
  return Math.round((dueDate.getTime() - today.getTime()) / 86_400_000)
}

function isDueSoon(record: ReceivableRecord) {
  const days = daysUntilDue(record.due_date)
  return record.balance > 0 && days !== null && days >= 0 && days <= 3
}

function statusPresentation(record: ReceivableRecord) {
  if (record.status === "cancelled") return { label: "Cancelado", className: "border-slate-200 bg-slate-50 text-slate-600" }
  if (record.balance <= 0 || record.status === "paid") return { label: "Pagado", className: "border-emerald-200 bg-emerald-50 text-emerald-700" }
  if (record.status === "overdue") return { label: record.paid > 0 ? "Parcial vencido" : "Vencido", className: "border-rose-200 bg-rose-50 text-rose-700" }
  if (isDueSoon(record)) return { label: record.paid > 0 ? "Parcial · vence pronto" : "Vence pronto", className: "border-amber-300 bg-amber-100 text-amber-800" }
  if (record.paid > 0) return { label: "Parcial", className: "border-sky-200 bg-sky-50 text-sky-700" }
  return { label: "Pendiente", className: "border-indigo-200 bg-indigo-50 text-indigo-700" }
}

export default function PaymentPage() {
  const [page, setPage] = React.useState(1)
  const [searchInput, setSearchInput] = React.useState("")
  const [search, setSearch] = React.useState("")
  const [status, setStatus] = React.useState(ALL_STATUSES)
  const [selectedReceivable, setSelectedReceivable] = React.useState<ReceivableRecord | null>(null)
  const [amount, setAmount] = React.useState("")
  const [method, setMethod] = React.useState<PaymentMethod>("Transferencia")
  const [reference, setReference] = React.useState("")
  const [paidAt, setPaidAt] = React.useState(localDateTimeValue)
  const perPage = 10
  const registerMutation = useRegisterPayment()

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  React.useEffect(() => {
    if (!selectedReceivable) return
    setAmount(selectedReceivable.balance.toFixed(2))
    setMethod("Transferencia")
    setReference("")
    setPaidAt(localDateTimeValue())
  }, [selectedReceivable])

  const params = React.useMemo(() => ({
    page,
    per_page: perPage,
    q: search || undefined,
    status: status === ALL_STATUSES ? undefined : status,
  }), [page, search, status])

  const receivablesQuery = useReceivables(params)
  const rows = receivablesQuery.data?.data ?? []
  const meta = receivablesQuery.data?.meta
  const stats = receivablesQuery.data?.stats ?? {
    receivable: 0,
    overdue: 0,
    due_this_month: 0,
    collected_this_month: 0,
  }
  const enteredAmount = Number(amount)
  const validEnteredAmount = Number.isFinite(enteredAmount) && enteredAmount > 0
  const remainingAfterPayment = selectedReceivable
    ? Math.max(0, selectedReceivable.balance - (validEnteredAmount ? enteredAmount : 0))
    : 0
  const settlesReceivable = !!selectedReceivable
    && validEnteredAmount
    && Math.abs(remainingAfterPayment) < 0.005

  const columns = React.useMemo<ColumnDef<ReceivableRecord>[]>(() => [
    {
      accessorKey: "rental_id",
      header: "Renta",
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-semibold">#{row.original.rental_id}</div>
          <div className="text-xs text-muted-foreground">Cargo #{row.original.id}</div>
        </div>
      ),
    },
    {
      accessorKey: "customer_name",
      header: "Cliente",
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-medium">{row.original.customer_name}</div>
          <div className="text-xs capitalize text-muted-foreground">{row.original.customer_type ?? "—"}</div>
        </div>
      ),
    },
    {
      accessorKey: "period_start",
      header: "Periodo",
      cell: ({ row }) => (
        <div className="text-sm">
          <div>{formatDate(row.original.period_start)}</div>
          <div className="text-xs text-muted-foreground">al {formatDate(row.original.period_end)}</div>
        </div>
      ),
    },
    {
      accessorKey: "due_date",
      header: "Vencimiento",
      cell: ({ row }) => {
        const days = daysUntilDue(row.original.due_date)
        const dueSoon = isDueSoon(row.original)

        return (
          <div className={dueSoon ? "w-fit rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-amber-800" : ""}>
            <div className={dueSoon ? "font-semibold" : ""}>{formatDate(row.original.due_date)}</div>
            {dueSoon ? (
              <div className="text-[11px] font-medium">
                {days === 0 ? "Vence hoy" : days === 1 ? "Vence mañana" : `Faltan ${days} días`}
              </div>
            ) : null}
          </div>
        )
      },
    },
    {
      accessorKey: "total",
      header: "Importes",
      cell: ({ row }) => (
        <div className="min-w-32 space-y-1 text-xs">
          <div className="flex justify-between gap-3"><span className="text-muted-foreground">Total</span><span>{formatCurrency(row.original.total)}</span></div>
          <div className="flex justify-between gap-3"><span className="text-muted-foreground">Pagado</span><span className="text-emerald-700">{formatCurrency(row.original.paid)}</span></div>
          <div className="flex justify-between gap-3 font-semibold"><span>Saldo</span><span>{formatCurrency(row.original.balance)}</span></div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Estatus",
      cell: ({ row }) => {
        const presentation = statusPresentation(row.original)
        return <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${presentation.className}`}>{presentation.label}</span>
      },
    },
    createActionsColumn<ReceivableRecord>({
      actions: [{
        key: "register-payment",
        label: "Registrar pago",
        icon: <Banknote className="h-4 w-4" />,
        visible: (row) => row.balance > 0 && row.status !== "cancelled",
        onClick: setSelectedReceivable,
      }],
    }),
  ], [])

  const handleRegisterPayment = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedReceivable) return
    const numericAmount = Number(amount)
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      toast.error("Ingresa un importe válido.")
      return
    }
    if (numericAmount > selectedReceivable.balance) {
      toast.error("El pago no puede superar el saldo pendiente.")
      return
    }

    try {
      const response = await registerMutation.mutateAsync({
        invoiceId: selectedReceivable.id,
        payload: {
          amount: numericAmount,
          method,
          reference: reference || null,
          paid_at: paidAt,
        },
      })
      toast.success(response.message || "Pago registrado correctamente.")
      setSelectedReceivable(null)
    } catch (error) {
      toast.error("No se pudo registrar el pago", {
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
      })
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
          <WalletCards className="h-3.5 w-3.5" />
          Control de cobranza
        </div>
        <h1 className="text-3xl font-bold text-gray-800">Pagos</h1>
        <p className="max-w-2xl text-gray-600">Administra vencimientos, saldos y pagos recibidos de las rentas.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-gray-200 shadow-md">
          <CardHeader className="pb-3">
            <CardDescription>Cartera pendiente</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl"><WalletCards className="h-5 w-5 text-purple-600" />{formatCurrency(stats.receivable)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-gray-200 shadow-md">
          <CardHeader className="pb-3">
            <CardDescription>Saldo vencido</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl"><TriangleAlert className="h-5 w-5 text-rose-600" />{formatCurrency(stats.overdue)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-gray-200 shadow-md">
          <CardHeader className="pb-3">
            <CardDescription>Vence este mes</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl"><CalendarClock className="h-5 w-5 text-amber-500" />{formatCurrency(stats.due_this_month)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-gray-200 shadow-md">
          <CardHeader className="pb-3">
            <CardDescription>Cobrado este mes</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl"><CircleDollarSign className="h-5 w-5 text-emerald-600" />{formatCurrency(stats.collected_this_month)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-gray-200 shadow-lg">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-xl">Cuentas por cobrar</CardTitle>
              <CardDescription>Consulta cada parcialidad y registra abonos o liquidaciones.</CardDescription>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <div className="relative sm:w-80">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Buscar renta o cliente..." className="pl-10" />
              </div>
              <Select value={status} onValueChange={(value) => { setStatus(value); setPage(1) }}>
                <SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_STATUSES}>Todos</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="overdue">Vencidos</SelectItem>
                  <SelectItem value="paid">Pagados</SelectItem>
                  <SelectItem value="cancelled">Cancelados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <div className="px-6 pb-6">
          <DataTable
            columns={columns}
            data={rows}
            enableSearch={false}
            pageSize={perPage}
            enablePagination
            manualPagination
            pageIndex={(meta?.page ?? page) - 1}
            pageCount={meta?.totalPages ?? 1}
            onPageChange={(nextPage) => setPage(nextPage + 1)}
            isLoading={receivablesQuery.isFetching}
          />
        </div>
      </Card>

      <Dialog open={selectedReceivable !== null} onOpenChange={(open) => { if (!open) setSelectedReceivable(null) }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Registrar pago</DialogTitle>
            <DialogDescription>
              Renta #{selectedReceivable?.rental_id} · vencimiento {formatDate(selectedReceivable?.due_date)}
            </DialogDescription>
          </DialogHeader>

          {selectedReceivable ? (
            <form onSubmit={handleRegisterPayment} className="space-y-5">
              <div className="grid grid-cols-3 gap-3 rounded-xl border border-violet-100 bg-violet-50/50 p-3 text-sm">
                <div><div className="text-xs text-muted-foreground">Total</div><div className="font-semibold">{formatCurrency(selectedReceivable.total)}</div></div>
                <div><div className="text-xs text-muted-foreground">Pagado</div><div className="font-semibold text-emerald-700">{formatCurrency(selectedReceivable.paid)}</div></div>
                <div><div className="text-xs text-muted-foreground">Saldo</div><div className="font-bold">{formatCurrency(selectedReceivable.balance)}</div></div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Importe recibido</Label>
                  <Input type="number" min="0.01" max={selectedReceivable.balance} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Método</Label>
                  <Select value={method} onValueChange={(value) => setMethod(value as PaymentMethod)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(["Transferencia", "Efectivo", "Tarjeta", "Paypal", "Otro"] as PaymentMethod[]).map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fecha y hora</Label>
                  <Input type="datetime-local" value={paidAt} onChange={(event) => setPaidAt(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Referencia</Label>
                  <Input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Folio o referencia bancaria" />
                </div>
              </div>

              {validEnteredAmount && enteredAmount <= selectedReceivable.balance ? (
                <div className={`rounded-xl border px-4 py-3 text-sm ${
                  settlesReceivable
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-sky-200 bg-sky-50 text-sky-800"
                }`}>
                  <div className="font-semibold">
                    {settlesReceivable ? "Este pago liquida la mensualidad" : "Este pago se registrará como parcial"}
                  </div>
                  <div className="mt-1 text-xs">
                    {settlesReceivable
                      ? "El saldo quedará en $0.00 y la parcialidad cambiará a Pagado."
                      : `Después del abono quedará un saldo de ${formatCurrency(remainingAfterPayment)}.`}
                  </div>
                </div>
              ) : null}

              {selectedReceivable.payments.length ? (
                <div className="space-y-2">
                  <Label>Movimientos anteriores</Label>
                  <div className="max-h-32 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2">
                    {selectedReceivable.payments.map((payment) => (
                      <div key={payment.id} className="flex justify-between rounded-lg px-2 py-1 text-xs hover:bg-slate-50">
                        <span>{formatDate(payment.paid_at)} · {payment.method}</span>
                        <span className="font-semibold">{formatCurrency(payment.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setSelectedReceivable(null)} disabled={registerMutation.isPending}>Cancelar</Button>
                <Button type="submit" disabled={registerMutation.isPending}>
                  <Banknote className="h-4 w-4" />
                  {registerMutation.isPending
                    ? "Registrando..."
                    : settlesReceivable
                      ? "Liquidar mensualidad"
                      : "Registrar pago parcial"}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
