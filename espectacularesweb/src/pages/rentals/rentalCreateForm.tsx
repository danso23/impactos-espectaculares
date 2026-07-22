import * as React from "react"
import { CalendarDays, CreditCard, Plus, ReceiptText, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { QuoteCustomerSelector } from "@/pages/quotes/quoteCustomerSelector"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { buildRentalPaymentSchedule } from "@/lib/helpers/rentalPaymentSchedule"
import { useQuoteCatalogs } from "@/lib/hooks/quoteHook"
import { useSpaces } from "@/lib/hooks/spaceHook"
import type { CustomerType, QuoteCustomer } from "@/types/Quote"
import type { PaymentFrequency, RentalCreatePayload } from "@/types/Rental"

const EMPTY_AGENCY = "__none__"

type EditableItem = {
  key: string
  spaceId: string
  concept: string
  qty: number
  unitPrice: number
}

function newItem(): EditableItem {
  return {
    key: crypto.randomUUID(),
    spaceId: "",
    concept: "",
    qty: 1,
    unitPrice: 0,
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeZone: "UTC" })
    .format(new Date(`${value}T00:00:00Z`))
}

const PAYMENT_FREQUENCIES: Array<{ value: PaymentFrequency; label: string }> = [
  { value: "single", label: "Pago único" },
  { value: "weekly", label: "Semanal" },
  { value: "biweekly", label: "Quincenal" },
  { value: "monthly", label: "Mensual" },
]

export function RentalCreateForm({
  isSubmitting,
  onSubmit,
}: {
  isSubmitting: boolean
  onSubmit: (payload: RentalCreatePayload) => Promise<void>
}) {
  const [open, setOpen] = React.useState(false)
  const [customerType, setCustomerType] = React.useState<CustomerType>("cliente")
  const [selectedCustomer, setSelectedCustomer] = React.useState<QuoteCustomer | null>(null)
  const [companyId, setCompanyId] = React.useState("")
  const [agencyId, setAgencyId] = React.useState(EMPTY_AGENCY)
  const [status, setStatus] = React.useState<"draft" | "active">("draft")
  const [startsAt, setStartsAt] = React.useState("")
  const [endsAt, setEndsAt] = React.useState("")
  const [frequency, setFrequency] = React.useState<PaymentFrequency>("monthly")
  const [firstPaymentDate, setFirstPaymentDate] = React.useState("")
  const [includesTax, setIncludesTax] = React.useState(true)
  const [taxRate, setTaxRate] = React.useState(16)
  const [notes, setNotes] = React.useState("")
  const [items, setItems] = React.useState<EditableItem[]>(() => [newItem()])
  const submitLockRef = React.useRef(false)

  const catalogsQuery = useQuoteCatalogs()
  const spacesQuery = useSpaces({ page: 1, per_page: 100, active: 1 })
  const catalogs = catalogsQuery.data?.data
  const spaces = spacesQuery.data?.data ?? []

  const subtotal = React.useMemo(
    () => items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0),
    [items],
  )
  const tax = includesTax ? subtotal * (taxRate / 100) : 0
  const total = subtotal + tax
  const schedule = React.useMemo(() => buildRentalPaymentSchedule({
    startsAt,
    endsAt,
    firstPaymentDate,
    frequency,
    total,
  }), [endsAt, firstPaymentDate, frequency, startsAt, total])

  React.useEffect(() => {
    if (!open) return
    setCustomerType("cliente")
    setSelectedCustomer(null)
    setCompanyId(catalogs?.companies[0] ? String(catalogs.companies[0].id) : "")
    setAgencyId(EMPTY_AGENCY)
    setStatus("draft")
    setStartsAt("")
    setEndsAt("")
    setFrequency("monthly")
    setFirstPaymentDate("")
    setIncludesTax(true)
    setTaxRate(16)
    setNotes("")
    setItems([newItem()])
  }, [catalogs?.companies, open])

  const updateItem = (key: string, patch: Partial<EditableItem>) => {
    setItems((current) => current.map((item) => item.key === key ? { ...item, ...patch } : item))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (submitLockRef.current || isSubmitting) return

    if (!selectedCustomer || (customerType !== "lead" && customerType !== "cliente")) {
      toast.error("Selecciona un cliente o prospecto.")
      return
    }
    if (!companyId) {
      toast.error("Selecciona la empresa emisora.")
      return
    }
    if (!startsAt || !endsAt || endsAt < startsAt) {
      toast.error("Define una vigencia válida.")
      return
    }
    if (!firstPaymentDate || schedule.length === 0) {
      toast.error("Define el plan de pagos.")
      return
    }
    if (items.some((item) => !item.spaceId || !item.concept.trim() || item.qty < 1 || item.unitPrice < 0)) {
      toast.error("Completa todos los espacios de la renta.")
      return
    }

    submitLockRef.current = true
    try {
      await onSubmit({
        customer: {
          type: customerType,
          id: selectedCustomer.id as number,
        },
        issuer_company_id: Number(companyId),
        agency_id: agencyId === EMPTY_AGENCY ? null : Number(agencyId),
        status,
        starts_at: startsAt,
        ends_at: endsAt,
        includes_tax: includesTax,
        tax_rate: includesTax ? taxRate : 0,
        notes: notes || null,
        payment: {
          frequency,
          first_payment_date: firstPaymentDate,
        },
        items: items.map((item) => ({
          space_id: Number(item.spaceId),
          concept: item.concept.trim(),
          qty: item.qty,
          unit_price: item.unitPrice,
        })),
      })
      setOpen(false)
    } finally {
      submitLockRef.current = false
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-6 text-white shadow-lg transition-all hover:-translate-y-0.5 hover:from-purple-700 hover:to-indigo-700 border-none">
          <Plus className="h-5 w-5" />
          Nueva renta
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva renta</DialogTitle>
          <DialogDescription>
            Registra al cliente, los espacios, la vigencia y el calendario de pagos.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Card className="border-violet-100 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Cliente y operación</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <QuoteCustomerSelector
                customerType={customerType}
                selectedCustomer={selectedCustomer}
                onCustomerTypeChange={setCustomerType}
                onCustomerChange={setSelectedCustomer}
                allowWithoutCustomer={false}
                enabled={open}
                resetKey={open}
              />

              <div className="space-y-2">
                <Label>Empresa emisora</Label>
                <Select value={companyId} onValueChange={setCompanyId}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar empresa" /></SelectTrigger>
                  <SelectContent>
                    {catalogs?.companies.map((company) => (
                      <SelectItem key={company.id} value={String(company.id)}>{company.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Agencia</Label>
                <Select value={agencyId} onValueChange={setAgencyId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={EMPTY_AGENCY}>Sin agencia</SelectItem>
                    {catalogs?.agencies.map((agency) => (
                      <SelectItem key={agency.id} value={String(agency.id)}>{agency.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Estatus inicial</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as "draft" | "active")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="active">Confirmar al crear</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="border-violet-100 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarDays className="h-4 w-4 text-violet-600" />
                  Vigencia
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Inicio</Label>
                  <Input
                    type="date"
                    value={startsAt}
                    onChange={(event) => {
                      setStartsAt(event.target.value)
                      if (!firstPaymentDate) setFirstPaymentDate(event.target.value)
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fin</Label>
                  <Input type="date" min={startsAt || undefined} value={endsAt} onChange={(event) => setEndsAt(event.target.value)} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-emerald-100 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="h-4 w-4 text-emerald-600" />
                  Plan de pagos
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Frecuencia</Label>
                  <Select value={frequency} onValueChange={(value) => setFrequency(value as PaymentFrequency)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PAYMENT_FREQUENCIES.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Primer vencimiento</Label>
                  <Input type="date" value={firstPaymentDate} onChange={(event) => setFirstPaymentDate(event.target.value)} />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-violet-100 shadow-none">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-base">Espacios incluidos</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">El sistema validará que estén disponibles durante toda la vigencia.</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setItems((current) => [...current, newItem()])}>
                <Plus className="h-4 w-4" /> Agregar espacio
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((item, index) => (
                <div key={item.key} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3 md:grid-cols-[1.2fr_1.2fr_100px_140px_auto] md:items-end">
                  <div className="space-y-2">
                    <Label>Espacio</Label>
                    <Select
                      value={item.spaceId || undefined}
                      onValueChange={(value) => {
                        const space = spaces.find((candidate) => String(candidate.id) === value)
                        updateItem(item.key, {
                          spaceId: value,
                          concept: item.concept || space?.title || "",
                          unitPrice: item.unitPrice || Number(space?.price ?? 0),
                        })
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>
                        {spaces.map((space) => (
                          <SelectItem
                            key={space.id}
                            value={String(space.id)}
                            disabled={items.some((other) => other.key !== item.key && other.spaceId === String(space.id))}
                          >
                            {space.assigned_id ? `${space.assigned_id} · ` : ""}{space.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Concepto</Label>
                    <Input value={item.concept} onChange={(event) => updateItem(item.key, { concept: event.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Cantidad</Label>
                    <Input type="number" min={1} value={item.qty} onChange={(event) => updateItem(item.key, { qty: Math.max(1, Number(event.target.value)) })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Precio</Label>
                    <Input type="number" min={0} step="0.01" value={item.unitPrice} onChange={(event) => updateItem(item.key, { unitPrice: Math.max(0, Number(event.target.value)) })} />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={items.length === 1}
                    onClick={() => setItems((current) => current.filter((candidate) => candidate.key !== item.key))}
                    aria-label={`Eliminar espacio ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4 text-rose-600" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-5 lg:grid-cols-[1fr_1.15fr]">
            <Card className="border-slate-200 shadow-none">
              <CardHeader className="pb-3"><CardTitle className="text-base">Importes</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
                  <div>
                    <div className="text-sm font-medium">Aplicar IVA</div>
                    <div className="text-xs text-muted-foreground">Calculado sobre el subtotal.</div>
                  </div>
                  <Switch checked={includesTax} onCheckedChange={setIncludesTax} />
                </div>
                {includesTax ? (
                  <div className="space-y-2">
                    <Label>Tasa de IVA (%)</Label>
                    <Input type="number" min={0} max={100} step="0.01" value={taxRate} onChange={(event) => setTaxRate(Number(event.target.value))} />
                  </div>
                ) : null}
                <div className="space-y-2 border-t border-slate-100 pt-3 text-sm">
                  <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                  <div className="flex justify-between"><span>IVA</span><span>{formatCurrency(tax)}</span></div>
                  <div className="flex justify-between text-base font-bold"><span>Total</span><span>{formatCurrency(total)}</span></div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-emerald-100 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span>Calendario generado</span>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs text-emerald-700">
                    {schedule.length} {schedule.length === 1 ? "pago" : "pagos"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {schedule.length ? (
                  <div className="max-h-44 space-y-1 overflow-y-auto">
                    {schedule.map((payment) => (
                      <div key={payment.number} className="grid grid-cols-[30px_1fr_auto] items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-emerald-50">
                        <span className="font-bold text-emerald-700">#{payment.number}</span>
                        <span>Vence {formatDate(payment.dueDate)}</span>
                        <span className="font-semibold">{formatCurrency(payment.amount)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-muted-foreground">Completa fechas e importes para calcular el plan.</div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="min-h-24" />
          </div>

          <DialogFooter className="sticky bottom-0 border-t border-slate-100 bg-white/95 py-3 backdrop-blur">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting || catalogsQuery.isLoading || spacesQuery.isLoading}>
              <ReceiptText className="h-4 w-4" />
              {isSubmitting
                ? "Creando renta..."
                : status === "active"
                  ? "Crear y confirmar renta"
                  : "Guardar renta en borrador"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
