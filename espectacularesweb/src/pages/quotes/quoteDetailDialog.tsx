import * as React from "react"
import { Lock, RefreshCw } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useQuote, useQuoteHistory } from "@/lib/hooks/quoteHook"
import { toneClass } from "@/pages/quotes/quoteStatus"
import type { QuoteAmountType, QuoteRecord } from "@/types/Quote"

function formatCurrency(value?: number | string | null) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" })
    .format(Number(value ?? 0))
}

// "YYYY-MM-DD" se lee como fecha local para no mostrar un día antes.
function formatDate(value?: string | null) {
  if (!value) return "—"
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value.replace(" ", "T"))
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(date)
}

function formatDateTime(value?: string | null) {
  if (!value) return "—"
  const date = new Date(value.replace(" ", "T"))
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(date)
}

function amountLabel(type?: QuoteAmountType | null, value?: number | null) {
  if (!type || type === "none") return "Sin descuento"
  if (type === "percent") return `${Number(value ?? 0)}%`
  return formatCurrency(value)
}

const REASON_LABELS: Record<string, string> = {
  created: "Cotización creada",
  converted_to_rental: "Convertida a renta",
  edited: "Cotización editada",
  duplicated: "Creada como duplicado",
}

const RENTAL_STATUS: Record<string, string> = {
  draft: "Borrador",
  active: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium text-slate-900">{children}</div>
    </div>
  )
}

type QuoteDetailDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  quote: QuoteRecord | null
}

export function QuoteDetailDialog({ open, onOpenChange, quote }: QuoteDetailDialogProps) {
  // El listado no trae partidas: se carga la cotización completa.
  const detailQuery = useQuote(quote?.id ?? null, open)
  const historyQuery = useQuoteHistory(quote?.id ?? null, open)
  const data = detailQuery.data?.data ?? null
  const history = historyQuery.data?.data ?? []
  const items = data?.items ?? []
  const totals = data?.totals

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            Cotización {quote?.folio}
            {data?.status ? (
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${toneClass(data.status)}`}>
                {data.status.name}
              </span>
            ) : null}
          </DialogTitle>
          <DialogDescription>Consulta de solo lectura. Los datos se muestran como quedaron registrados.</DialogDescription>
        </DialogHeader>

        {detailQuery.isLoading || !data ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Cargando cotización…
          </div>
        ) : (
          <div className="space-y-5 text-sm">
            {data.rental ? (
              <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
                <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="grid flex-1 gap-3 sm:grid-cols-4">
                  <Field label="Renta ligada">Renta #{data.rental.id}</Field>
                  <Field label="Estatus de la renta">{RENTAL_STATUS[data.rental.status] ?? data.rental.status}</Field>
                  <Field label="Duración de la renta contratada">
                    {formatDate(data.rental.starts_at)} – {formatDate(data.rental.ends_at)}
                  </Field>
                  <Field label="Total de la renta">{formatCurrency(data.rental.total)}</Field>
                  <p className="text-xs sm:col-span-4">
                    Convertida el {formatDateTime(data.converted_to_rental_at)}
                    {data.converted_to_rental_by?.name ? ` por ${data.converted_to_rental_by.name}` : ""}.
                    Esta cotización ya no se puede modificar; los cobros se consultan en Rentas.
                  </p>
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 rounded-xl border bg-muted/30 p-4 sm:grid-cols-3">
              <Field label="Cliente">
                {data.customer?.display_name ?? "Sin cliente"}
                {data.customer?.contact_name ? (
                  <div className="text-xs font-normal text-muted-foreground">{data.customer.contact_name}</div>
                ) : null}
              </Field>
              <Field label="Empresa emisora">{data.company?.name ?? "—"}</Field>
              <Field label="Agencia">{data.agency?.name ?? "Sin agencia"}</Field>
              <Field label="Cotización válida hasta">{formatDate(data.valid_until)}</Field>
              <Field label="Alta">{formatDateTime(data.created_at)}</Field>
              <Field label="Versión">{data.version}</Field>
              <Field label="IVA">{data.includes_tax ? `${Number(data.tax_rate)}%` : "Sin IVA"}</Field>
              <Field label="Descuento">{amountLabel(totals?.discount_type, totals?.discount_value)}</Field>
              {data.accepted_at ? (
                <Field label="Aceptada">
                  {formatDateTime(data.accepted_at)}
                  {data.accepted_by?.name ? ` · ${data.accepted_by.name}` : ""}
                </Field>
              ) : null}
            </div>

            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full min-w-[760px] text-left">
                <thead className="bg-slate-50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Tipo</th>
                    <th className="px-3 py-2">Concepto</th>
                    <th className="px-3 py-2">Periodo cotizado</th>
                    <th className="px-3 py-2 text-right">Cantidad</th>
                    <th className="px-3 py-2 text-right">Precio</th>
                    <th className="px-3 py-2 text-right">Subtotal</th>
                    <th className="px-3 py-2 text-right">IVA</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const isArea = item.unit === "m2"
                    return (
                      <tr key={index} className="border-t align-top">
                        <td className="px-3 py-2">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                            {item.item_type === "rental" ? "Renta" : "Servicio"}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-medium">{item.concept}</div>
                          {item.description ? (
                            <div className="text-xs text-muted-foreground">{item.description}</div>
                          ) : null}
                          {item.width_m && item.height_m ? (
                            <div className="text-xs text-muted-foreground">
                              {Number(item.width_m)} × {Number(item.height_m)} m
                            </div>
                          ) : null}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {item.start_date ? `${formatDate(item.start_date)} – ${formatDate(item.end_date)}` : "—"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {isArea ? `${Number(item.square_meters ?? 0)} m²` : `${Number(item.qty)} pza`}
                        </td>
                        <td className="px-3 py-2 text-right">{formatCurrency(item.unit_price)}</td>
                        <td className="px-3 py-2 text-right">{formatCurrency(item.subtotal)}</td>
                        <td className="px-3 py-2 text-right">{formatCurrency(item.tax_amount)}</td>
                        <td className="px-3 py-2 text-right font-semibold">{formatCurrency(item.total)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {totals ? (
              <div className="ml-auto w-full max-w-sm space-y-1 rounded-xl border p-4">
                <div className="flex justify-between"><span>Subtotal rentas</span><span>{formatCurrency(totals.rentals_subtotal)}</span></div>
                <div className="flex justify-between"><span>Subtotal servicios</span><span>{formatCurrency(totals.services_subtotal)}</span></div>
                <div className="flex justify-between"><span>Descuento</span><span>-{formatCurrency(totals.discount_amount)}</span></div>
                <div className="flex justify-between"><span>IVA</span><span>{formatCurrency(totals.tax)}</span></div>
                <div className="flex justify-between border-t pt-2 text-base font-semibold">
                  <span>Total</span><span>{formatCurrency(totals.total)}</span>
                </div>
              </div>
            ) : null}

            {data.notes ? (
              <div className="rounded-xl border p-4">
                <div className="mb-1 text-xs text-muted-foreground">Notas internas</div>
                <p className="whitespace-pre-wrap">{data.notes}</p>
              </div>
            ) : null}

            {history.length ? (
              <div className="rounded-xl border p-4">
                <div className="mb-2 text-xs text-muted-foreground">Historial de estatus</div>
                <ul className="space-y-2">
                  {history.map((entry) => (
                    <li key={entry.id} className="flex flex-wrap justify-between gap-2 border-b pb-2 last:border-0 last:pb-0">
                      <span>
                        {entry.from_status?.name ?? "Inicio"} → {entry.to_status?.name ?? "—"}
                        {entry.reason ? <span className="text-muted-foreground"> · {REASON_LABELS[entry.reason] ?? entry.reason}</span> : null}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(entry.changed_at)}
                        {entry.changed_by?.name ? ` · ${entry.changed_by.name}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
