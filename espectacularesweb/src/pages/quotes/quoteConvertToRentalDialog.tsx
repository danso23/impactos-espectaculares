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
import { useConvertQuoteToRental } from "@/lib/hooks/quoteHook"
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
  const requiresCustomer = !quote?.customer_id || quote?.customer_type === "sin_cliente"
  const [customerType, setCustomerType] = React.useState<CustomerType>("cliente")
  const [selectedCustomer, setSelectedCustomer] = React.useState<QuoteCustomer | null>(null)
  const [startsAt, setStartsAt] = React.useState("")
  const [frequency, setFrequency] = React.useState<PaymentFrequency>("monthly")
  const [renewalCount, setRenewalCount] = React.useState(1)
  const [isRotating, setIsRotating] = React.useState(false)
  const [firstPaymentDate, setFirstPaymentDate] = React.useState("")
  const [commissionType, setCommissionType] = React.useState<QuoteAmountType>("none")
  const [commissionValue, setCommissionValue] = React.useState(0)

  const totalToConvert = quote?.totals.rentals_subtotal
    ? quote.totals.rentals_subtotal
    : quote?.totals.total ?? 0

  const commissionBase = React.useMemo(() => {
    const rentalItems = quote?.items.filter((item) => item.item_type === "rental") ?? []
    const itemsToConvert = rentalItems.length ? rentalItems : quote?.items ?? []

    return itemsToConvert.reduce(
      (sum, item) => sum + Math.max(0, Number(item.total) - Number(item.tax_amount)),
      0,
    )
  }, [quote?.items])

  const defaultRentalPeriod = React.useMemo(() => {
    const rentalItems = quote?.items.filter((item) => item.item_type === "rental") ?? []
    const startDates = rentalItems.map((item) => item.start_date).filter(Boolean).sort() as string[]

    return {
      startsAt: startDates[0] ?? "",
    }
  }, [quote?.items])

  React.useEffect(() => {
    if (!open) return

    setCustomerType("cliente")
    setSelectedCustomer(null)
    setStartsAt(defaultRentalPeriod.startsAt)
    setFrequency("monthly")
    setRenewalCount(1)
    setIsRotating(false)
    setFirstPaymentDate(defaultRentalPeriod.startsAt)
    setCommissionType(quote?.agency?.commission_type ?? "none")
    setCommissionValue(Number(quote?.agency?.commission_value ?? 0))
  }, [
    defaultRentalPeriod,
    open,
    quote?.agency?.commission_type,
    quote?.agency?.commission_value,
    quote?.id,
  ])

  const commissionAmount = React.useMemo(() => {
    if (commissionType === "none" || commissionValue <= 0) return 0
    if (commissionType === "percent") return commissionBase * (commissionValue / 100)
    return Math.min(commissionValue, commissionBase)
  }, [commissionBase, commissionType, commissionValue])

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
    total: totalToConvert,
  }), [firstPaymentDate, frequency, normalizedRenewalCount, startsAt, totalToConvert])

  const handleConfirm = async () => {
    if (!quote) return
    if (requiresCustomer && !selectedCustomer) {
      toast.error("Selecciona un cliente o prospecto para continuar.")
      return
    }
    if (!startsAt || !endsAt || !firstPaymentDate || normalizedRenewalCount < 1) {
      toast.error("Completa el inicio, las renovaciones y la primera fecha de pago.")
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
            {quote ? `La cotización ${quote.folio} dejará de ser solo comercial y generará una renta operativa.` : "Confirma la conversión a renta."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="rounded-md border bg-muted/30 p-3">
            <div>Cliente: {quote?.customer?.display_name ?? "—"}</div>
            <div>Estatus: {quote?.status?.name ?? "—"}</div>
            <div>
              Importe a convertir: {formatCurrency(
                totalToConvert
              )}
            </div>
            <div>Servicios: {quote?.totals.services_subtotal ? formatCurrency(quote.totals.services_subtotal) : formatCurrency(0)}</div>
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
                La fecha final se calcula con la frecuencia y las renovaciones.
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
                    if (!firstPaymentDate) setFirstPaymentDate(event.target.value)
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rental-renewals">Renovaciones</Label>
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
                Las parcialidades se calculan automáticamente según la vigencia.
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
                  onChange={(event) => setFirstPaymentDate(event.target.value)}
                />
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
                  {schedule.map((payment) => (
                    <div
                      key={payment.number}
                      className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-slate-100 px-3 py-2 last:border-0"
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
                      <span className="font-semibold text-slate-900">{formatCurrency(payment.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-emerald-200 px-3 py-4 text-center text-xs text-muted-foreground">
                Completa el inicio y las renovaciones para visualizar las parcialidades.
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
