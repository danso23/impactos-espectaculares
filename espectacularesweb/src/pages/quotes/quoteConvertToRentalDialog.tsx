import * as React from "react"
import { CalendarDays, CreditCard, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NumericInput } from "@/components/ui/numeric-input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useConvertQuoteToRental, useQuote } from "@/lib/hooks/quoteHook"
import {
  buildRentalPaymentSchedule,
  calculateRentalEndDate,
} from "@/lib/helpers/rentalPaymentSchedule"
import { QuoteCustomerSelector } from "@/pages/quotes/quoteCustomerSelector"
import type {
  CustomerType,
  QuoteCustomer,
  QuoteAmountType,
  QuoteRecord,
  SearchableCustomerType,
} from "@/types/Quote"
import type { PaymentFrequency } from "@/types/Rental"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value || 0)
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeZone: "UTC" })
    .format(new Date(`${value}T00:00:00Z`))
}

const FREQUENCY_LABELS: Record<PaymentFrequency, string> = {
  single: "Pago único",
  weekly: "Semanal",
  biweekly: "Quincenal",
  monthly: "Mensual",
  annual: "Anual",
}

type QuoteConvertToRentalDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  quote: QuoteRecord | null
}

export function QuoteConvertToRentalDialog({
  open,
  onOpenChange,
  quote,
}: QuoteConvertToRentalDialogProps) {
  const convertMutation = useConvertQuoteToRental()
  // El listado no trae las partidas: se carga la cotización completa para
  // separar renta por periodo y servicios de cargo único.
  const quoteDetailQuery = useQuote(quote?.id ?? null, open)
  const detailItems = quoteDetailQuery.data?.data?.items
  const listItems = quote?.items
  const quoteItems = React.useMemo(() => detailItems ?? listItems ?? [], [detailItems, listItems])
  const requiresCustomer = !quote?.customer_id || quote?.customer_type === "sin_cliente"
  const [customerType, setCustomerType] = React.useState<CustomerType>("cliente")
  const [selectedCustomer, setSelectedCustomer] = React.useState<QuoteCustomer | null>(null)
  const [startsAt, setStartsAt] = React.useState("")
  const [frequency, setFrequency] = React.useState<PaymentFrequency>("monthly")
  const [renewalCount, setRenewalCount] = React.useState(1)
  const [isRotating, setIsRotating] = React.useState(false)
  const [firstPaymentDate, setFirstPaymentDate] = React.useState("")
  // Mientras el usuario no edite el primer vencimiento, sigue a la fecha de inicio.
  // Antes se copiaba solo en el primer cambio y, al teclear el año, quedaba "0002-...".
  const [firstPaymentTouched, setFirstPaymentTouched] = React.useState(false)
  const [commissionType, setCommissionType] = React.useState<QuoteAmountType>("none")
  const [commissionValue, setCommissionValue] = React.useState(0)

  // Importes sin IVA (ya con descuento). La renta de los espacios se cobra en
  // cada periodo; los servicios (impresión, instalación…) solo en el primer pago.
  const { quotedRentPerPeriod, oneTimeServices } = React.useMemo(() => {
    const net = (item: { total: number | string; tax_amount: number | string }) =>
      Math.max(0, Number(item.total) - Number(item.tax_amount))
    const items = quoteItems
    return {
      quotedRentPerPeriod: roundMoney(items.filter((item) => item.space_id).reduce((sum, item) => sum + net(item), 0)),
      oneTimeServices: roundMoney(items.filter((item) => !item.space_id).reduce((sum, item) => sum + net(item), 0)),
    }
  }, [quoteItems])
  const taxRate = quote?.includes_tax ? Number(quote?.tax_rate ?? 0) : 0
  const [rentPerPeriod, setRentPerPeriod] = React.useState(0)
  // Importes editados a mano por pago (índice → importe sin IVA).
  const [amountOverrides, setAmountOverrides] = React.useState<Record<number, number>>({})

  const defaultRentalPeriod = React.useMemo(() => {
    const rentalItems = quoteItems.filter((item) => item.item_type === "rental") ?? []
    const startDates = rentalItems.map((item) => item.start_date).filter(Boolean).sort() as string[]

    return {
      startsAt: startDates[0] ?? "",
    }
  }, [quoteItems])

  React.useEffect(() => {
    if (!open) return

    setCustomerType("cliente")
    setSelectedCustomer(null)
    setStartsAt(defaultRentalPeriod.startsAt)
    setFrequency("monthly")
    setRenewalCount(1)
    setIsRotating(false)
    setFirstPaymentDate(defaultRentalPeriod.startsAt)
    setFirstPaymentTouched(false)
    setCommissionType(quote?.agency?.commission_type ?? "none")
    setCommissionValue(Number(quote?.agency?.commission_value ?? 0))
  }, [
    defaultRentalPeriod.startsAt,
    open,
    quote?.agency?.commission_type,
    quote?.agency?.commission_value,
    quote?.id,
  ])

  // La renta por periodo se toma de la cotización completa en cuanto carga.
  React.useEffect(() => {
    if (!open) return
    setRentPerPeriod(quotedRentPerPeriod)
    setAmountOverrides({})
  }, [open, quotedRentPerPeriod])

  const normalizedRenewalCount = frequency === "single" ? 1 : renewalCount
  const endsAt = React.useMemo(
    () => calculateRentalEndDate(startsAt, frequency, normalizedRenewalCount),
    [frequency, normalizedRenewalCount, startsAt],
  )

  const schedule = React.useMemo(() => buildRentalPaymentSchedule({
    startsAt,
    firstPaymentDate,
    frequency,
    renewalCount: normalizedRenewalCount,
    total: 0,
  }), [firstPaymentDate, frequency, normalizedRenewalCount, startsAt])

  // Si cambia el número de pagos, los importes editados a mano ya no aplican.
  React.useEffect(() => {
    setAmountOverrides({})
  }, [schedule.length])

  const installmentAmounts = React.useMemo(
    () => schedule.map((_, index) =>
      amountOverrides[index] ?? roundMoney(rentPerPeriod + (index === 0 ? oneTimeServices : 0)),
    ),
    [amountOverrides, oneTimeServices, rentPerPeriod, schedule],
  )
  const rentalSubtotal = roundMoney(installmentAmounts.reduce((sum, amount) => sum + amount, 0))
  const rentalTax = roundMoney(installmentAmounts.reduce((sum, amount) => sum + roundMoney(amount * taxRate / 100), 0))
  const rentalTotal = roundMoney(rentalSubtotal + rentalTax)
  const commissionBase = rentalSubtotal

  const commissionAmount = React.useMemo(() => {
    if (commissionType === "none" || commissionValue <= 0) return 0
    if (commissionType === "percent") return commissionBase * (commissionValue / 100)
    return Math.min(commissionValue, commissionBase)
  }, [commissionBase, commissionType, commissionValue])


  const handleConfirm = async () => {
    if (!quote) return
    if (requiresCustomer && !selectedCustomer) {
      toast.error("Selecciona un cliente o prospecto para continuar.")
      return
    }
    if (!startsAt || !endsAt || !firstPaymentDate || normalizedRenewalCount < 1) {
      toast.error("Completa el inicio, el número de rentas y la primera fecha de pago.")
      return
    }
    if (schedule.length === 0) {
      toast.error("No fue posible generar el calendario de pagos.")
      return
    }

    try {
      const response = await convertMutation.mutateAsync({
        id: quote.id,
        payload: {
          ...(requiresCustomer ? {
            customer: {
              type: selectedCustomer!.type as SearchableCustomerType,
              id: selectedCustomer!.id as number,
            },
          } : {}),
          rental: {
            starts_at: startsAt,
            is_rotating: isRotating,
          },
          payment: {
            frequency,
            first_payment_date: firstPaymentDate,
            renewals: normalizedRenewalCount,
            installment_amounts: installmentAmounts,
          },
          commission: {
            type: commissionType,
            value: commissionValue,
          },
        },
      })
      toast.success(response.message || `Cotización convertida a renta #${response.data.rental?.id}.`)
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible convertir la cotización a renta.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Convertir a renta</DialogTitle>
          <DialogDescription>
            {quote ? `La cotización ${quote.folio} generará una renta confirmada: los espacios quedarán ocupados durante la vigencia y se emitirán los cobros.` : "Confirma la conversión a renta."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="rounded-md border bg-muted/30 p-3">
            <div>Cliente: {quote?.customer?.display_name ?? "—"}</div>
            <div>Estatus: {quote?.status?.name ?? "—"}</div>
            <div>Renta cotizada por periodo (sin IVA): {formatCurrency(quotedRentPerPeriod)}</div>
            <div>Servicios, cargo único en el primer pago (sin IVA): {formatCurrency(oneTimeServices)}</div>
          </div>

          {requiresCustomer ? (
            <div className="space-y-3 rounded-md border border-sky-200 bg-sky-50 p-3">
              <div className="text-sm font-medium text-sky-900">
                Esta cotización no tiene cliente asignado
              </div>
              <div className="text-sm text-sky-800">
                Asigna un cliente o prospecto para continuar con la conversión a renta.
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <QuoteCustomerSelector
                  customerType={customerType}
                  selectedCustomer={selectedCustomer}
                  onCustomerTypeChange={setCustomerType}
                  onCustomerChange={setSelectedCustomer}
                  allowWithoutCustomer={false}
                  enabled={open && requiresCustomer}
                  resetKey={`${quote?.id ?? "none"}-${open}`}
                />
              </div>
            </div>
          ) : null}

          <div className="space-y-4 rounded-xl border border-violet-100 bg-violet-50/40 p-4">
            <div>
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <CalendarDays className="h-4 w-4 text-violet-600" />
                Vigencia de la renta
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                La fecha final se calcula con la frecuencia y el número de rentas.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rental-starts-at">Inicio</Label>
                <Input
                  id="rental-starts-at"
                  type="date"
                  value={startsAt}
                  onChange={(event) => {
                    setStartsAt(event.target.value)
                    if (!firstPaymentTouched) setFirstPaymentDate(event.target.value)
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rental-renewals">Número de rentas</Label>
                <Input
                  id="rental-renewals"
                  type="number"
                  min={1}
                  max={120}
                  step={1}
                  disabled={frequency === "single"}
                  value={normalizedRenewalCount}
                  onChange={(event) => setRenewalCount(Math.min(120, Math.max(1, Math.trunc(Number(event.target.value)) || 1)))}
                />
                <p className="text-xs text-muted-foreground">
                  {endsAt ? `Vigencia calculada hasta ${formatDate(endsAt)}.` : "Se calcula según la frecuencia."}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-violet-200 bg-white px-3 py-2">
              <div>
                <p className="text-sm font-medium">Renta rotativa</p>
                <p className="text-xs text-muted-foreground">Uso interno para casos especiales.</p>
              </div>
              <Switch
                checked={isRotating}
                onCheckedChange={setIsRotating}
                aria-label="Marcar renta como rotativa"
              />
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
            <div>
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <CreditCard className="h-4 w-4 text-emerald-600" />
                Plan de pagos
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Cada pago cobra la renta del periodo; el primero incluye los servicios. Los importes son sin IVA y se pueden ajustar.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Frecuencia</Label>
                <Select
                  value={frequency}
                  onValueChange={(value) => {
                    const nextFrequency = value as PaymentFrequency
                    setFrequency(nextFrequency)
                    if (nextFrequency === "single") setRenewalCount(1)
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="first-payment-date">Primer vencimiento</Label>
                <Input
                  id="first-payment-date"
                  type="date"
                  value={firstPaymentDate}
                  onChange={(event) => {
                    setFirstPaymentDate(event.target.value)
                    setFirstPaymentTouched(true)
                  }}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Renta por periodo (sin IVA)</Label>
                <NumericInput
                  value={rentPerPeriod}
                  onValueChange={(value) => {
                    setRentPerPeriod(Math.max(0, Number(value) || 0))
                    setAmountOverrides({})
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Se cobra en cada pago. Puedes ajustar el importe de cada pago en el calendario.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Comisión</Label>
                <Select
                  value={commissionType}
                  onValueChange={(value) => {
                    const type = value as QuoteAmountType
                    setCommissionType(type)
                    if (type === "none") setCommissionValue(0)
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin comisión</SelectItem>
                    <SelectItem value="percent">Porcentaje</SelectItem>
                    <SelectItem value="fixed">Monto fijo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valor de comisión</Label>
                <NumericInput
                  disabled={commissionType === "none"}
                  value={commissionValue}
                  onValueChange={setCommissionValue}
                />
                <p className="text-xs text-muted-foreground">
                  Comisión calculada: {formatCurrency(commissionAmount)}
                </p>
              </div>
            </div>

            {schedule.length ? (
              <div className="overflow-hidden rounded-xl border border-emerald-100 bg-white">
                <div className="flex items-center justify-between border-b border-emerald-100 px-3 py-2">
                  <span className="font-medium">Calendario generado</span>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    {schedule.length} {schedule.length === 1 ? "pago" : "pagos"}
                  </span>
                </div>
                <div className="max-h-56 overflow-y-auto">
                  {schedule.map((payment, index) => (
                    <div
                      key={payment.number}
                      className="grid grid-cols-[auto_1fr_140px] items-center gap-3 border-b border-slate-100 px-3 py-2 last:border-0"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-50 text-xs font-bold text-violet-700">
                        {payment.number}
                      </span>
                      <div>
                        <div className="text-xs font-medium text-slate-700">
                          Vence {formatDate(payment.dueDate)}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Periodo: {formatDate(payment.periodStart)} – {formatDate(payment.periodEnd)}
                        </div>
                      </div>
                      <div>
                        <NumericInput
                          aria-label={`Importe del pago ${payment.number}`}
                          value={installmentAmounts[index] ?? 0}
                          onValueChange={(value) =>
                            setAmountOverrides((current) => ({ ...current, [index]: Math.max(0, Number(value) || 0) }))
                          }
                        />
                        {index === 0 && oneTimeServices > 0 && amountOverrides[index] === undefined ? (
                          <p className="mt-1 text-[11px] text-muted-foreground">Incluye servicios</p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 border-t border-emerald-100 bg-emerald-50/50 px-3 py-2 text-xs">
                  <div>Subtotal: <span className="font-semibold">{formatCurrency(rentalSubtotal)}</span></div>
                  <div>IVA{taxRate ? ` (${taxRate}%)` : ""}: <span className="font-semibold">{formatCurrency(rentalTax)}</span></div>
                  <div className="text-right">Total: <span className="font-semibold">{formatCurrency(rentalTotal)}</span></div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-emerald-200 px-3 py-4 text-center text-xs text-muted-foreground">
                Completa el inicio y el número de rentas para visualizar las parcialidades.
              </div>
            )}
          </div>

          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
            Se generará la renta, sus partidas y {schedule.length
              ? `${schedule.length} ${schedule.length === 1 ? "parcialidad" : "parcialidades"}`
              : "las parcialidades correspondientes"}. La cotización aceptada quedará ligada y ya no deberá duplicarse.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!quote || convertMutation.isPending}>
            {convertMutation.isPending ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Confirmar conversión
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
