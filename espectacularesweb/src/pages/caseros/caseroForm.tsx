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
import { NumericInput } from "@/components/ui/numeric-input"
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
import type { CaseroFormValues, CaseroRecord } from "@/types/Casero"

const EMPTY_FORM: CaseroFormValues = {
  nombre: "",
  apellido_paterno: "",
  apellido_materno: "",
  telefono: "",
  telefono_2: "",
  email: "",
  rfc: "",
  curp: "",
  direccion: "",
  colonia: "",
  ciudad: "",
  estado: "",
  cp: "",
  monto_renta: "",
  periodicidad: "",
  metodo_pago: "",
  banco: "",
  cuenta_banco: "",
  clabe: "",
  notes: "",
  active: true,
}

function recordToForm(record: CaseroRecord): CaseroFormValues {
  return {
    nombre: record.nombre || "",
    apellido_paterno: record.apellido_paterno || "",
    apellido_materno: record.apellido_materno || "",
    telefono: record.telefono || "",
    telefono_2: record.telefono_2 || "",
    email: record.email || "",
    rfc: record.rfc || "",
    curp: record.curp || "",
    direccion: record.direccion || "",
    colonia: record.colonia || "",
    ciudad: record.ciudad || "",
    estado: record.estado || "",
    cp: record.cp || "",
    monto_renta: record.monto_renta != null ? String(record.monto_renta) : "",
    periodicidad: record.periodicidad || "",
    metodo_pago: record.metodo_pago || "",
    banco: record.banco || "",
    cuenta_banco: record.cuenta_banco || "",
    clabe: record.clabe || "",
    notes: record.notes || "",
    active: record.active !== false,
  }
}

type CaseroFormProps = {
  /** If provided, the form opens in edit mode */
  editRecord?: CaseroRecord | null
  isSubmitting: boolean
  onSubmit: (payload: CaseroFormValues) => Promise<void>
  /** Controlled open state for edit mode */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Whether to show the DialogTrigger button */
  showTrigger?: boolean
}

export function CaseroForm({
  editRecord,
  isSubmitting,
  onSubmit,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  showTrigger = true,
}: CaseroFormProps) {
  const isEdit = !!editRecord
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = controlledOnOpenChange ?? setInternalOpen

  const [form, setForm] = React.useState<CaseroFormValues>(EMPTY_FORM)

  React.useEffect(() => {
    if (open) {
      setForm(editRecord ? recordToForm(editRecord) : EMPTY_FORM)
    }
  }, [open, editRecord])

  function updateField<K extends keyof CaseroFormValues>(key: K, value: CaseroFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onSubmit(form)
    setOpen(false)
  }

  const dialogContent = (
    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{isEdit ? "Editar Casero" : "Nuevo Casero"}</DialogTitle>
        <DialogDescription>
          {isEdit
            ? "Modifica los datos del casero."
            : "Registra un nuevo casero (propietario de terreno)."}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} id="casero-form" className="space-y-6">
        {/* ── Datos personales ── */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-purple-700 border-b border-purple-100 pb-1 mb-2">
            Datos Personales
          </legend>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="casero-nombre">Nombre *</Label>
              <Input
                id="casero-nombre"
                required
                value={form.nombre}
                onChange={(e) => updateField("nombre", e.target.value)}
                placeholder="Nombre"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="casero-ap">Apellido Paterno</Label>
              <Input
                id="casero-ap"
                value={form.apellido_paterno}
                onChange={(e) => updateField("apellido_paterno", e.target.value)}
                placeholder="Apellido paterno"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="casero-am">Apellido Materno</Label>
              <Input
                id="casero-am"
                value={form.apellido_materno}
                onChange={(e) => updateField("apellido_materno", e.target.value)}
                placeholder="Apellido materno"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="casero-rfc">RFC</Label>
              <Input
                id="casero-rfc"
                value={form.rfc}
                maxLength={13}
                onChange={(e) => updateField("rfc", e.target.value.toUpperCase())}
                placeholder="XAXX010101000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="casero-curp">CURP</Label>
              <Input
                id="casero-curp"
                value={form.curp}
                maxLength={18}
                onChange={(e) => updateField("curp", e.target.value.toUpperCase())}
                placeholder="XAXX010101HDFRRN09"
              />
            </div>
          </div>
        </fieldset>

        {/* ── Contacto ── */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-purple-700 border-b border-purple-100 pb-1 mb-2">
            Contacto
          </legend>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="casero-tel">Teléfono</Label>
              <Input
                id="casero-tel"
                value={form.telefono}
                onChange={(e) => updateField("telefono", e.target.value)}
                placeholder="55 1234 5678"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="casero-tel2">Teléfono 2</Label>
              <Input
                id="casero-tel2"
                value={form.telefono_2}
                onChange={(e) => updateField("telefono_2", e.target.value)}
                placeholder="Otro teléfono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="casero-email">Email</Label>
              <Input
                id="casero-email"
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="correo@ejemplo.com"
              />
            </div>
          </div>
        </fieldset>

        {/* ── Dirección ── */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-purple-700 border-b border-purple-100 pb-1 mb-2">
            Dirección
          </legend>

          <div className="space-y-2">
            <Label htmlFor="casero-dir">Dirección</Label>
            <Input
              id="casero-dir"
              value={form.direccion}
              onChange={(e) => updateField("direccion", e.target.value)}
              placeholder="Calle y número"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="casero-col">Colonia</Label>
              <Input
                id="casero-col"
                value={form.colonia}
                onChange={(e) => updateField("colonia", e.target.value)}
                placeholder="Colonia"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="casero-city">Ciudad</Label>
              <Input
                id="casero-city"
                value={form.ciudad}
                onChange={(e) => updateField("ciudad", e.target.value)}
                placeholder="Ciudad"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="casero-state">Estado</Label>
              <Input
                id="casero-state"
                value={form.estado}
                onChange={(e) => updateField("estado", e.target.value)}
                placeholder="Estado"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="casero-cp">C.P.</Label>
              <Input
                id="casero-cp"
                value={form.cp}
                maxLength={10}
                onChange={(e) => updateField("cp", e.target.value)}
                placeholder="00000"
              />
            </div>
          </div>
        </fieldset>

        {/* ── Datos de Pago ── */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-purple-700 border-b border-purple-100 pb-1 mb-2">
            Datos de Pago
          </legend>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="casero-renta">Monto Renta (MXN)</Label>
              <NumericInput
                id="casero-renta"
                value={form.monto_renta}
                onValueChange={(value) => updateField("monto_renta", String(value))}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="casero-periodicidad">Periodicidad</Label>
              <Select
                value={form.periodicidad || "__none__"}
                onValueChange={(v) => updateField("periodicidad", v === "__none__" ? "" : v)}
              >
                <SelectTrigger id="casero-periodicidad">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin especificar</SelectItem>
                  <SelectItem value="mensual">Mensual</SelectItem>
                  <SelectItem value="trimestral">Trimestral</SelectItem>
                  <SelectItem value="semestral">Semestral</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="casero-metodo">Método de Pago</Label>
              <Select
                value={form.metodo_pago || "__none__"}
                onValueChange={(v) => updateField("metodo_pago", v === "__none__" ? "" : v)}
              >
                <SelectTrigger id="casero-metodo">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin especificar</SelectItem>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="deposito">Depósito</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(form.metodo_pago === "transferencia" || form.metodo_pago === "deposito") && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="space-y-2">
                <Label htmlFor="casero-banco">Banco</Label>
                <Input
                  id="casero-banco"
                  value={form.banco}
                  onChange={(e) => updateField("banco", e.target.value)}
                  placeholder="Nombre del banco"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="casero-cuenta">Cuenta Bancaria</Label>
                <Input
                  id="casero-cuenta"
                  value={form.cuenta_banco}
                  onChange={(e) => updateField("cuenta_banco", e.target.value)}
                  placeholder="Número de cuenta"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="casero-clabe">CLABE</Label>
                <Input
                  id="casero-clabe"
                  value={form.clabe}
                  maxLength={18}
                  onChange={(e) => updateField("clabe", e.target.value)}
                  placeholder="018 ..."
                />
              </div>
            </div>
          )}
        </fieldset>

        {/* ── Notas y estatus ── */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-purple-700 border-b border-purple-100 pb-1 mb-2">
            Otros
          </legend>

          <div className="space-y-2">
            <Label htmlFor="casero-notes">Notas</Label>
            <Textarea
              id="casero-notes"
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Observaciones generales..."
              rows={3}
            />
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="casero-active"
              checked={form.active}
              onCheckedChange={(checked) => updateField("active", checked)}
            />
            <Label htmlFor="casero-active">Casero activo</Label>
          </div>
        </fieldset>
      </form>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
        <Button
          type="submit"
          form="casero-form"
          disabled={isSubmitting || !form.nombre.trim()}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
        >
          {isSubmitting ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear Casero"}
        </Button>
      </DialogFooter>
    </DialogContent>
  )

  // For edit mode (controlled) or when trigger is hidden, don't render a trigger button
  if (isEdit || !showTrigger) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        {dialogContent}
      </Dialog>
    )
  }

  // For create mode with trigger, render with trigger button
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Casero
        </Button>
      </DialogTrigger>
      {dialogContent}
    </Dialog>
  )
}
