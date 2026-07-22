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
import { NumericInput } from "@/components/ui/numeric-input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { RentalFormValues, RentalRecord } from "@/types/Rental"

const EMPTY_FORM: RentalFormValues = {
  customer_type: "lead",
  customer_id: "",
  agency_id: "",
  issuer_company_id: "",
  created_by: "",
  status: "draft",
  starts_at: "",
  ends_at: "",
  subtotal: "",
  tax: "",
  total: "",
  notes: "",
}

function recordToForm(record: RentalRecord): RentalFormValues {
  return {
    customer_type: record.customer_type ?? "lead",
    customer_id: record.customer_id != null ? String(record.customer_id) : "",
    agency_id: record.agency_id != null ? String(record.agency_id) : "",
    issuer_company_id: record.issuer_company_id != null ? String(record.issuer_company_id) : "",
    created_by: record.created_by != null ? String(record.created_by) : "",
    status: (record.status as RentalFormValues["status"]) ?? "draft",
    starts_at: record.starts_at ?? "",
    ends_at: record.ends_at ?? "",
    subtotal: record.subtotal != null ? String(record.subtotal) : "",
    tax: record.tax != null ? String(record.tax) : "",
    total: record.total != null ? String(record.total) : "",
    notes: record.notes ?? "",
  }
}

type RentalFormProps = {
  editRecord?: RentalRecord | null
  isSubmitting: boolean
  onSubmit: (payload: RentalFormValues) => Promise<void>
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
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = controlledOnOpenChange ?? setInternalOpen
  const [form, setForm] = React.useState<RentalFormValues>(EMPTY_FORM)

  React.useEffect(() => {
    if (open) {
      setForm(editRecord ? recordToForm(editRecord) : EMPTY_FORM)
    }
  }, [open, editRecord])

  function updateField<K extends keyof RentalFormValues>(key: K, value: RentalFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onSubmit(form)
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
          <div className="space-y-2">
            <Label>Tipo de cliente</Label>
            <Select
              value={form.customer_type}
              onValueChange={(value) => updateField("customer_type", value as RentalFormValues["customer_type"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="cliente">Cliente</SelectItem>
                <SelectItem value="sin_cliente">Sin cliente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Customer ID</Label>
            <Input
              value={form.customer_id}
              onChange={(e) => updateField("customer_id", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Agencia ID</Label>
            <Input value={form.agency_id} onChange={(e) => updateField("agency_id", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Empresa ID</Label>
            <Input
              value={form.issuer_company_id}
              onChange={(e) => updateField("issuer_company_id", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Creado por</Label>
            <Input value={form.created_by} onChange={(e) => updateField("created_by", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Estatus</Label>
            <Select
              value={form.status}
              onValueChange={(value) => updateField("status", value as RentalFormValues["status"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="active">Activa / confirmada</SelectItem>
                <SelectItem value="completed">Completada</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Inicio</Label>
            <Input type="date" value={form.starts_at} onChange={(e) => updateField("starts_at", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Fin</Label>
            <Input type="date" value={form.ends_at} onChange={(e) => updateField("ends_at", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Subtotal</Label>
            <NumericInput value={form.subtotal} onValueChange={(value) => updateField("subtotal", String(value))} />
          </div>
          <div className="space-y-2">
            <Label>IVA</Label>
            <NumericInput value={form.tax} onValueChange={(value) => updateField("tax", String(value))} />
          </div>
          <div className="space-y-2">
            <Label>Total</Label>
            <NumericInput value={form.total} onValueChange={(value) => updateField("total", String(value))} />
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
