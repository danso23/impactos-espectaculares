import * as React from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { RentalFormValues, RentalRecord } from "@/types/Rental"
import type { CustomerType, QuoteCustomer } from "@/types/Quote"
import { useRoles } from "@/hooks/useRoles"
import { useQuoteCatalogs } from "@/lib/hooks/quoteHook"
import { QuoteCustomerSelector } from "@/pages/quotes/quoteCustomerSelector"

const NO_AGENCY = "none"

const STATUS_LABELS: Record<RentalFormValues["status"], string> = {
  draft: "Borrador",
  active: "Activa / confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
}

/** Cambios de estatus que acepta el backend desde cada estatus. */
const ALLOWED_STATUSES: Record<RentalFormValues["status"], RentalFormValues["status"][]> = {
  draft: ["draft", "active", "cancelled"],
  active: ["active", "completed", "cancelled"],
  completed: ["completed"],
  cancelled: ["cancelled"],
}

function money(value: string) {
  const amount = Number(value)
  return Number.isFinite(amount) && value !== ""
    ? new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount)
    : "—"
}

function customerFromRecord(record: RentalRecord | null | undefined): QuoteCustomer | null {
  if (!record || !record.customer_id || record.customer_type === "sin_cliente") return null
  return {
    type: (record.customer_type ?? "lead") as CustomerType,
    id: Number(record.customer_id),
    display_name: record.customer_name || `#${record.customer_id}`,
  }
}

const EMPTY_FORM: RentalFormValues = {
  customer_type: "lead",
  customer_id: "",
  agency_id: "",
  issuer_company_id: "",
  created_by: "",
  status: "draft",
  is_rotating: false,
  starts_at: "",
  ends_at: "",
  subtotal: "",
  tax: "",
  total: "",
  notes: "",
  manual_invoice_id: "",
}

function recordToForm(record: RentalRecord): RentalFormValues {
  return {
    customer_type: record.customer_type ?? "lead",
    customer_id: record.customer_id != null ? String(record.customer_id) : "",
    agency_id: record.agency_id != null ? String(record.agency_id) : "",
    issuer_company_id: record.issuer_company_id != null ? String(record.issuer_company_id) : "",
    created_by: record.created_by != null ? String(record.created_by) : "",
    status: (record.status as RentalFormValues["status"]) ?? "draft",
    is_rotating:
      record.is_rotating === true ||
      record.is_rotating === 1 ||
      record.is_rotating === "1" ||
      record.is_rotating === "true",
    starts_at: record.starts_at ?? "",
    ends_at: record.ends_at ?? "",
    subtotal: record.subtotal != null ? String(record.subtotal) : "",
    tax: record.tax != null ? String(record.tax) : "",
    total: record.total != null ? String(record.total) : "",
    notes: record.notes ?? "",
    manual_invoice_id: record.manual_invoice_id ?? "",
  }
}

type RentalFormProps = {
  editRecord?: RentalRecord | null
  isSubmitting: boolean
  onSubmit: (payload: Partial<RentalFormValues>) => Promise<void>
  open?: boolean
  onOpenChange?: (open: boolean) => void
  showTrigger?: boolean
}

export function RentalForm({
  editRecord,
  isSubmitting,
  onSubmit,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  showTrigger = true,
}: RentalFormProps) {
  const isEdit = !!editRecord
  const { can } = useRoles()
  // Renta confirmada: la fecha de inicio solo la cambia quien tenga el permiso especial.
  const isConfirmed = editRecord?.status === "active" || editRecord?.status === "completed"
  const startDateLocked = isConfirmed && !can("rentals.edit_start_date")
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = controlledOnOpenChange ?? setInternalOpen
  const [form, setForm] = React.useState<RentalFormValues>(EMPTY_FORM)
  const [customer, setCustomer] = React.useState<QuoteCustomer | null>(null)
  const catalogsQuery = useQuoteCatalogs()
  const companies = catalogsQuery.data?.data?.companies ?? []
  const agencies = catalogsQuery.data?.data?.agencies ?? []
  const originalStatus = (editRecord?.status as RentalFormValues["status"]) ?? "draft"
  const statusOptions = ALLOWED_STATUSES[originalStatus] ?? [originalStatus]

  React.useEffect(() => {
    if (open) {
      setForm(editRecord ? recordToForm(editRecord) : EMPTY_FORM)
      setCustomer(customerFromRecord(editRecord))
    }
  }, [open, editRecord])

  function updateField<K extends keyof RentalFormValues>(key: K, value: RentalFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Los importes salen del plan de pagos y "creado por" no se edita: no se envían.
    const isWithoutCustomer = form.customer_type === "sin_cliente"
    await onSubmit({
      customer_type: form.customer_type,
      customer_id: isWithoutCustomer || customer?.id == null ? "" : String(customer.id),
      agency_id: form.agency_id,
      issuer_company_id: form.issuer_company_id,
      status: form.status,
      is_rotating: form.is_rotating,
      starts_at: form.starts_at,
      ends_at: form.ends_at,
      notes: form.notes,
      manual_invoice_id: form.manual_invoice_id,
    })
    setOpen(false)
  }

  const content = (
    <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{isEdit ? "Editar renta" : "Nueva renta"}</DialogTitle>
        <DialogDescription>
          {isEdit ? "Ajusta la información de la renta." : "Registra una renta manualmente."}
        </DialogDescription>
        {isEdit ? (
          <div className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1.5 text-xs text-violet-700">
            ID de renta: <span className="font-bold text-violet-900">#{editRecord.id}</span>
          </div>
        ) : null}
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuoteCustomerSelector
            customerType={form.customer_type}
            selectedCustomer={customer}
            onCustomerTypeChange={(type) => {
              updateField("customer_type", type)
              setCustomer(null)
            }}
            onCustomerChange={setCustomer}
            allowWithoutCustomer
            enabled={open}
          />
          <div className="space-y-2">
            <Label>Empresa emisora</Label>
            <Select value={form.issuer_company_id} onValueChange={(value) => updateField("issuer_company_id", value)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar empresa" /></SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={String(company.id)}>{company.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Agencia</Label>
            <Select
              value={form.agency_id || NO_AGENCY}
              onValueChange={(value) => updateField("agency_id", value === NO_AGENCY ? "" : value)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_AGENCY}>Sin agencia</SelectItem>
                {agencies.map((agency) => (
                  <SelectItem key={agency.id} value={String(agency.id)}>{agency.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Estatus</Label>
            <Select
              value={form.status}
              disabled={statusOptions.length <= 1}
              onValueChange={(value) => updateField("status", value as RentalFormValues["status"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status}>{STATUS_LABELS[status]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.status === "cancelled" && originalStatus !== "cancelled" ? (
              <p className="text-xs text-amber-700">Al cancelar se liberan los anuncios y se cancelan los cobros pendientes.</p>
            ) : statusOptions.length <= 1 ? (
              <p className="text-xs text-muted-foreground">Una renta {STATUS_LABELS[originalStatus].toLowerCase()} ya no cambia de estatus.</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label>Inicio</Label>
            <Input
              type="date"
              value={form.starts_at}
              disabled={startDateLocked}
              onChange={(e) => updateField("starts_at", e.target.value)}
            />
            {startDateLocked ? (
              <p className="text-xs text-muted-foreground">
                Renta confirmada: se requiere el permiso «Editar fecha de inicio de rentas confirmadas».
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label>Fin</Label>
            <Input type="date" value={form.ends_at} onChange={(e) => updateField("ends_at", e.target.value)} />
          </div>
          {isEdit && (form.starts_at !== (editRecord?.starts_at ?? "") || form.ends_at !== (editRecord?.ends_at ?? "")) ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 col-span-full">
              Al guardar se recalcula el plan de pagos: los pendientes se ajustan a la nueva vigencia, se agregan o
              cancelan pagos según los meses y los ya cobrados no se modifican.
            </p>
          ) : null}
          <div className="flex items-center justify-between rounded-lg border border-violet-200 bg-violet-50/60 px-3 py-2">
            <Label>Es rotativa</Label>
            <Switch
              checked={form.is_rotating}
              onCheckedChange={(value) => updateField("is_rotating", value)}
              aria-label="Marcar renta como rotativa"
            />
          </div>
          <div className="space-y-1 rounded-lg border bg-slate-50 px-3 py-2 sm:col-span-2">
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <span>Subtotal <strong>{money(form.subtotal)}</strong></span>
              <span>IVA <strong>{money(form.tax)}</strong></span>
              <span>Total <strong>{money(form.total)}</strong></span>
            </div>
            <p className="text-xs text-muted-foreground">Los importes salen del plan de pagos; se ajustan desde Pagos.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rental-manual-invoice-id">ID de factura</Label>
            <Input
              id="rental-manual-invoice-id"
              value={form.manual_invoice_id}
              maxLength={30}
              onChange={(e) => updateField("manual_invoice_id", e.target.value)}
              placeholder="Captura manual (máx. 30)"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Notas</Label>
          <Textarea
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            className="min-h-24"
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )

  if (!showTrigger) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        {content}
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-6 text-white shadow-lg transition-all hover:from-purple-700 hover:to-indigo-700 hover:-translate-y-0.5 border-none">
          <Plus className="mr-2 h-5 w-5" />
          <span>Nueva renta</span>
        </Button>
      </DialogTrigger>
      {content}
    </Dialog>
  )
}
