import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { CalendarRange, FileSpreadsheet, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { excelDate, exportRowsToExcel } from "@/lib/exportExcel"
import { useGroundRentPaymentsReport } from "@/lib/hooks/groundRentHook"
import { getCaseros } from "@/lib/services/caseroService"
import type { GroundRentPayment, GroundRentReportParams, GroundRentReportRow } from "@/types/GroundRent"

const STATUS_LABELS: Record<GroundRentPayment["status"], string> = {
  pending: "Pendiente",
  paid: "Pagado",
  overdue: "Vencido",
  cancelled: "Cancelado",
}

const STATUS_CLASSES: Record<GroundRentPayment["status"], string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
  overdue: "border-rose-200 bg-rose-50 text-rose-700",
  cancelled: "border-slate-200 bg-slate-50 text-slate-500",
}

const FREQUENCY_LABELS = { monthly: "Mensual", quarterly: "Trimestral", semiannual: "Semestral", annual: "Anual" } as const

function currency(value: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value)
}

function formatDate(value?: string | null) {
  if (!value) return "—"
  const parsed = new Date(`${value.slice(0, 10)}T12:00:00`)
  return Number.isNaN(parsed.getTime()) ? "—" : new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(parsed)
}

function monthLabel(month: string) {
  const parsed = new Date(`${month}-01T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return month
  const label = new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" }).format(parsed)
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function toISO(value: Date) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
}

function currentMonthRange() {
  const today = new Date()
  return {
    from: toISO(new Date(today.getFullYear(), today.getMonth(), 1)),
    to: toISO(new Date(today.getFullYear(), today.getMonth() + 1, 0)),
  }
}

function spacesLabel(row: GroundRentReportRow, field: "assigned_id" | "title") {
  return row.spaces.map((space) => space[field] || "—").join(", ")
}

const EXPORT_COLUMNS: Array<{ id: string; label: string; value: (row: GroundRentReportRow) => unknown }> = [
  { id: "month", label: "Mes", value: (row) => monthLabel(row.month) },
  { id: "due", label: "Vencimiento", value: (row) => excelDate(row.due_date) },
  { id: "casero", label: "Casero", value: (row) => row.casero_name ?? "" },
  { id: "property", label: "Predio", value: (row) => row.property_name ?? "" },
  { id: "address", label: "Dirección", value: (row) => row.property_address ?? "" },
  { id: "space_ids", label: "ID anuncio", value: (row) => spacesLabel(row, "assigned_id") },
  { id: "spaces", label: "Anuncio", value: (row) => spacesLabel(row, "title") },
  { id: "contract", label: "No. contrato", value: (row) => row.contract_number ?? "" },
  { id: "frequency", label: "Periodicidad", value: (row) => (row.payment_frequency ? FREQUENCY_LABELS[row.payment_frequency] : "") },
  { id: "installment", label: "Pago", value: (row) => (row.payment_count ? `${row.installment_number} de ${row.payment_count}` : row.installment_number) },
  { id: "period_start", label: "Periodo desde", value: (row) => excelDate(row.period_start) },
  { id: "period_end", label: "Periodo hasta", value: (row) => excelDate(row.period_end) },
  { id: "amount", label: "Importe", value: (row) => row.amount },
  { id: "status", label: "Estatus", value: (row) => STATUS_LABELS[row.status] },
  { id: "paid_at", label: "Fecha de pago", value: (row) => excelDate(row.paid_at) },
  { id: "reference", label: "Referencia", value: (row) => row.reference ?? "" },
]

/** Reporte de pagos a caseros agrupado por mes, con filtro de fechas. */
export function GroundRentReportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const initialRange = React.useMemo(currentMonthRange, [])
  const [from, setFrom] = React.useState(initialRange.from)
  const [to, setTo] = React.useState(initialRange.to)
  const [status, setStatus] = React.useState<"" | GroundRentPayment["status"]>("")
  const [caseroId, setCaseroId] = React.useState("")

  const params = React.useMemo<GroundRentReportParams>(() => ({
    from: from || undefined,
    to: to || undefined,
    status: status || undefined,
    casero_id: caseroId ? Number(caseroId) : undefined,
  }), [from, to, status, caseroId])

  const report = useGroundRentPaymentsReport(params, open)
  const caseros = useQuery({ queryKey: ["caseros", "report-options"], queryFn: () => getCaseros({ page: 1, per_page: 100 }), enabled: open, staleTime: 60_000 })

  const rows = React.useMemo(() => report.data?.data ?? [], [report.data])
  const months = report.data?.months ?? []
  const totals = report.data?.totals
  const rowsByMonth = React.useMemo(() => {
    const grouped = new Map<string, GroundRentReportRow[]>()
    rows.forEach((row) => grouped.set(row.month, [...(grouped.get(row.month) ?? []), row]))
    return grouped
  }, [rows])

  function exportExcel() {
    if (rows.length === 0) {
      toast.info("No hay pagos para exportar con los filtros actuales.")
      return
    }
    exportRowsToExcel({
      filename: `pagos-caseros-${from || "inicio"}-a-${to || "fin"}`,
      columns: EXPORT_COLUMNS.map(({ id, label }) => ({ id, label })),
      rows: rows.map((row) => ({ getValue: (id: string) => EXPORT_COLUMNS.find((column) => column.id === id)?.value(row) })),
    })
  }

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
      <DialogHeader>
        <div className="flex flex-wrap items-center justify-between gap-3 pr-6">
          <DialogTitle className="flex items-center gap-2"><CalendarRange className="h-5 w-5 text-violet-600" />Reporte de pagos a caseros</DialogTitle>
          <Button type="button" variant="outline" size="sm" className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" disabled={report.isFetching || rows.length === 0} onClick={exportExcel}><FileSpreadsheet className="mr-2 h-4 w-4" />Exportar</Button>
        </div>
        <DialogDescription>Pagos de renta de piso por mes, según su fecha de vencimiento.</DialogDescription>
      </DialogHeader>

      <div className="grid gap-3 rounded-2xl border border-violet-100 bg-violet-50/40 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div><Label htmlFor="report-from">Vence desde</Label><Input id="report-from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="mt-1 bg-white" /></div>
        <div><Label htmlFor="report-to">Vence hasta</Label><Input id="report-to" type="date" value={to} onChange={(event) => setTo(event.target.value)} className="mt-1 bg-white" /></div>
        <div><Label htmlFor="report-status">Estatus</Label><select id="report-status" value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="mt-1 h-10 w-full rounded-md border border-input bg-white px-3 text-sm"><option value="">Todos</option>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
        <div><Label htmlFor="report-casero">Casero</Label><select id="report-casero" value={caseroId} onChange={(event) => setCaseroId(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-white px-3 text-sm"><option value="">Todos</option>{(caseros.data?.data ?? []).map((casero) => <option key={casero.id} value={casero.id}>{[casero.nombre, casero.apellido_paterno, casero.apellido_materno].filter(Boolean).join(" ")}</option>)}</select></div>
        <div className="flex items-end gap-2">
          <Button type="button" variant="outline" size="sm" className="h-10 flex-1 bg-white" onClick={() => { const range = currentMonthRange(); setFrom(range.from); setTo(range.to) }}>Este mes</Button>
          <Button type="button" variant="ghost" size="sm" className="h-10" onClick={() => { setFrom(""); setTo(""); setStatus(""); setCaseroId("") }}>Limpiar</Button>
        </div>
      </div>

      {totals && <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Pagos", value: String(totals.count) },
          { label: "Total a pagar", value: currency(totals.total) },
          { label: "Pagado", value: currency(totals.paid), className: "text-emerald-700" },
          { label: "Pendiente", value: currency(totals.pending), className: "text-amber-700" },
        ].map((card) => <div key={card.label} className="rounded-xl border bg-white px-4 py-3"><p className="text-xs text-muted-foreground">{card.label}</p><p className={`text-xl font-semibold ${card.className ?? "text-slate-900"}`}>{card.value}</p></div>)}
      </div>}

      {report.isLoading ? <div className="flex min-h-40 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Cargando reporte…</div>
        : report.isError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">No se pudo cargar el reporte. {report.error instanceof Error ? report.error.message : ""}</div>
        : rows.length === 0 ? <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">No hay pagos con vencimiento en este periodo.</div>
        : <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>
              <th className="px-3 py-2">Vence</th><th className="px-3 py-2">Casero</th><th className="px-3 py-2">Predio</th><th className="px-3 py-2">Anuncio</th><th className="px-3 py-2">Contrato</th><th className="px-3 py-2">Pago</th><th className="px-3 py-2 text-right">Importe</th><th className="px-3 py-2">Estatus</th>
            </tr></thead>
            <tbody>
              {months.map((month) => <React.Fragment key={month.month}>
                <tr className="border-t bg-violet-50/70"><td colSpan={6} className="px-3 py-2 font-semibold text-violet-900">{monthLabel(month.month)} <span className="font-normal text-muted-foreground">· {month.count} pago{month.count === 1 ? "" : "s"} · pagado {currency(month.paid)} · pendiente {currency(month.pending)}</span></td><td className="px-3 py-2 text-right font-semibold text-violet-900">{currency(month.total)}</td><td /></tr>
                {(rowsByMonth.get(month.month) ?? []).map((row) => <tr key={row.id} className="border-t">
                  <td className="whitespace-nowrap px-3 py-2">{formatDate(row.due_date)}</td>
                  <td className="px-3 py-2">{row.casero_name || "—"}</td>
                  <td className="px-3 py-2">{row.property_name || "—"}</td>
                  <td className="px-3 py-2">{row.spaces.length ? row.spaces.map((space) => <div key={space.id}><span className="font-medium text-violet-700">{space.assigned_id || "—"}</span> {space.title}</div>) : "—"}</td>
                  <td className="px-3 py-2">{row.contract_number || (row.contract_id ? `#${row.contract_id}` : "—")}{row.payment_frequency && <div className="text-xs text-muted-foreground">{FREQUENCY_LABELS[row.payment_frequency]}</div>}</td>
                  <td className="whitespace-nowrap px-3 py-2">{row.payment_count ? `${row.installment_number} de ${row.payment_count}` : row.installment_number}<div className="text-xs text-muted-foreground">{formatDate(row.period_start)} – {formatDate(row.period_end)}</div></td>
                  <td className="whitespace-nowrap px-3 py-2 text-right font-medium">{currency(row.amount)}</td>
                  <td className="px-3 py-2"><span className={`rounded-full border px-2 py-1 text-xs font-medium ${STATUS_CLASSES[row.status]}`}>{STATUS_LABELS[row.status]}</span>{row.paid_at && <div className="mt-1 text-xs text-muted-foreground">{formatDate(row.paid_at)}</div>}</td>
                </tr>)}
              </React.Fragment>)}
            </tbody>
          </table>
        </div>}
    </DialogContent>
  </Dialog>
}
