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
import { PhoneInput } from "@/components/ui/phone-input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type { ProviderFormValues, ProviderRecord } from "@/types/Provider"

const EMPTY_FORM: ProviderFormValues = {
  name: "",
  contact_name: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
  active: true,
}

function recordToForm(record: ProviderRecord): ProviderFormValues {
  return {
    name: record.name ?? "",
    contact_name: record.contact_name ?? "",
    phone: record.phone ?? "",
    email: record.email ?? "",
    address: record.address ?? "",
    notes: record.notes ?? "",
    active: record.active !== false,
  }
}

type ProviderFormProps = {
  editRecord?: ProviderRecord | null
  isSubmitting: boolean
  onSubmit: (payload: ProviderFormValues) => Promise<void>
  open?: boolean
  onOpenChange?: (open: boolean) => void
  showTrigger?: boolean
}

export function ProviderForm({
  editRecord,
  isSubmitting,
  onSubmit,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  showTrigger = true,
}: ProviderFormProps) {
  const isEdit = !!editRecord
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = controlledOnOpenChange ?? setInternalOpen
  const [form, setForm] = React.useState<ProviderFormValues>(EMPTY_FORM)

  React.useEffect(() => {
    if (open) {
      setForm(editRecord ? recordToForm(editRecord) : EMPTY_FORM)
    }
  }, [open, editRecord])

  function updateField<K extends keyof ProviderFormValues>(key: K, value: ProviderFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onSubmit(form)
    setOpen(false)
  }

  const content = (
    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{isEdit ? "Editar proveedor" : "Nuevo proveedor"}</DialogTitle>
        <DialogDescription>
          {isEdit ? "Modifica la información del proveedor." : "Registra un nuevo proveedor."}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Nombre *</Label>
            <Input value={form.name} onChange={(e) => updateField("name", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Contacto</Label>
            <Input
              value={form.contact_name}
              onChange={(e) => updateField("contact_name", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Teléfono</Label>
            <PhoneInput
              value={form.phone}
              onValueChange={(value) => updateField("phone", value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Dirección</Label>
          <Input value={form.address} onChange={(e) => updateField("address", e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>Notas</Label>
          <Textarea
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            className="min-h-24"
          />
        </div>

        <div className="flex items-center justify-between rounded-md border px-4 py-3">
          <div>
            <p className="text-sm font-medium">Activo</p>
            <p className="text-xs text-muted-foreground">Los inactivos no se muestran en listados.</p>
          </div>
          <Switch checked={form.active} onCheckedChange={(checked) => updateField("active", checked)} />
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
          <span>Nuevo proveedor</span>
        </Button>
      </DialogTrigger>
      {content}
    </Dialog>
  )
}
