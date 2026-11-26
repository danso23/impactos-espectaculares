import * as React from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NumericInput } from "@/components/ui/numeric-input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type { ServiceFormValues, ServiceRecord } from "@/types/Service"

const EMPTY: ServiceFormValues = { key: "", name: "", description: "", base_price: 0, unit: "pieza", tax_rate: 16, is_active: true }

function toForm(record: ServiceRecord): ServiceFormValues {
  return { key: record.key ?? "", name: record.name, description: record.description ?? "", base_price: Number(record.base_price), unit: record.unit === "m2" ? "m2" : "pieza", tax_rate: Number(record.tax_rate), is_active: record.is_active !== false }
}

type Props = {
  editRecord?: ServiceRecord | null
  isSubmitting: boolean
  onSubmit: (payload: ServiceFormValues) => Promise<void>
  open?: boolean
  onOpenChange?: (open: boolean) => void
  showTrigger?: boolean
}

export function ServiceForm({ editRecord, isSubmitting, onSubmit, open: controlledOpen, onOpenChange, showTrigger = true }: Props) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const [form, setForm] = React.useState(EMPTY)
  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen

  React.useEffect(() => { if (open) setForm(editRecord ? toForm(editRecord) : EMPTY) }, [open, editRecord])
  const update = <K extends keyof ServiceFormValues>(key: K, value: ServiceFormValues[K]) => setForm((old) => ({ ...old, [key]: value }))
  const submit = async (event: React.FormEvent) => { event.preventDefault(); await onSubmit(form); setOpen(false) }

  const content = <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>{editRecord ? "Editar servicio" : "Nuevo servicio"}</DialogTitle>
      <DialogDescription>Configura el servicio que estará disponible al elaborar cotizaciones.</DialogDescription>
    </DialogHeader>
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label>Nombre *</Label><Input value={form.name} onChange={(e) => update("name", e.target.value)} required /></div>
        <div className="space-y-2"><Label>Clave interna</Label><Input value={form.key} onChange={(e) => update("key", e.target.value)} disabled={Boolean(editRecord?.key)} placeholder="Ej. instalacion" /></div>
        <div className="space-y-2"><Label>Precio unitario *</Label><NumericInput value={form.base_price} onValueChange={(value) => update("base_price", Number(value))} /></div>
        <div className="space-y-2"><Label>Unidad de medida *</Label><Select value={form.unit} onValueChange={(value) => update("unit", value === "m2" ? "m2" : "pieza")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pieza">Pieza (precio por unidad)</SelectItem><SelectItem value="m2">m² (precio × ancho × alto)</SelectItem></SelectContent></Select></div>
        <div className="space-y-2"><Label>IVA (%) *</Label><NumericInput value={form.tax_rate} onValueChange={(value) => update("tax_rate", Number(value))} /></div>
      </div>
      <p className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800">Cambiar el precio aquí actualiza el precio por defecto de <strong>todas las cotizaciones nuevas</strong>. Las cotizaciones ya guardadas no cambian. Para ajustar una sola cotización, edita el precio directamente en ella.</p>
      <div className="space-y-2"><Label>Descripción</Label><Textarea value={form.description} onChange={(e) => update("description", e.target.value)} /></div>
      <div className="flex items-center justify-between rounded-md border px-4 py-3">
        <div><p className="text-sm font-medium">Activo</p><p className="text-xs text-muted-foreground">Solo los activos se ofrecen en nuevas cotizaciones.</p></div>
        <Switch checked={form.is_active} onCheckedChange={(value) => update("is_active", value)} />
      </div>
      <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Guardando..." : "Guardar"}</Button></DialogFooter>
    </form>
  </DialogContent>

  return <Dialog open={open} onOpenChange={setOpen}>
    {showTrigger && <DialogTrigger asChild><Button className="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-6 text-white"><Plus className="mr-2 h-5 w-5" />Nuevo servicio</Button></DialogTrigger>}
    {content}
  </Dialog>
}
