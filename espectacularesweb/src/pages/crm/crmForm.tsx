import * as React from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"

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
import { CurpInput, RfcInput } from "@/components/ui/mexican-id-input"
import { PhoneInput } from "@/components/ui/phone-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { isValidCurp, isValidRfc } from "@/lib/helpers/mexicanId"
import type {
  ClientFormValues,
  CrmUser,
  LeadFormValues,
  LeadPriority,
  LeadStatus,
} from "@/types/Crm"

const EMPTY = "__empty__"

type CrmFormMode = "lead" | "client"

type Props = {
  mode: CrmFormMode
  statuses?: LeadStatus[]
  users?: CrmUser[]
  isSubmitting?: boolean
  onSubmit: (payload: LeadFormValues | ClientFormValues) => Promise<void> | void
}

const baseForm = {
  nombre: "",
  apellido_paterno: "",
  apellido_materno: "",
  curp: "",
  rfc: "",
  negocio: "",
  razon_social: "",
  giro: "",
  email: "",
  telefono: "",
  telefono_2: "",
  direccion: "",
  colonia: "",
  ciudad: "",
  estado: "",
  cp: "",
  nombre_aval: "",
  telefono_aval: "",
  direccion_aval: "",
  source: "",
  notes: "",
}

const initialLeadForm: LeadFormValues = {
  ...baseForm,
  lead_status_id: undefined,
  assigned_to: undefined,
  priority: 2,
}

const initialClientForm: ClientFormValues = {
  ...baseForm,
}

function cleanString(value: string) {
  const trimmed = value.trim()
  return trimmed === "" ? undefined : trimmed
}

function buildLeadPayload(form: LeadFormValues): LeadFormValues {
  return {
    nombre: form.nombre.trim(),
    ...(cleanString(form.apellido_paterno) && { apellido_paterno: cleanString(form.apellido_paterno) }),
    ...(cleanString(form.apellido_materno) && { apellido_materno: cleanString(form.apellido_materno) }),
    ...(cleanString(form.curp) && { curp: cleanString(form.curp) }),
    ...(cleanString(form.rfc) && { rfc: cleanString(form.rfc) }),
    ...(cleanString(form.negocio) && { negocio: cleanString(form.negocio) }),
    ...(cleanString(form.razon_social) && { razon_social: cleanString(form.razon_social) }),
    ...(cleanString(form.giro) && { giro: cleanString(form.giro) }),
    ...(cleanString(form.email) && { email: cleanString(form.email) }),
    ...(cleanString(form.telefono) && { telefono: cleanString(form.telefono) }),
    ...(cleanString(form.telefono_2) && { telefono_2: cleanString(form.telefono_2) }),
    ...(cleanString(form.direccion) && { direccion: cleanString(form.direccion) }),
    ...(cleanString(form.colonia) && { colonia: cleanString(form.colonia) }),
    ...(cleanString(form.ciudad) && { ciudad: cleanString(form.ciudad) }),
    ...(cleanString(form.estado) && { estado: cleanString(form.estado) }),
    ...(cleanString(form.cp) && { cp: cleanString(form.cp) }),
    ...(cleanString(form.nombre_aval) && { nombre_aval: cleanString(form.nombre_aval) }),
    ...(cleanString(form.telefono_aval) && { telefono_aval: cleanString(form.telefono_aval) }),
    ...(cleanString(form.direccion_aval) && { direccion_aval: cleanString(form.direccion_aval) }),
    ...(cleanString(form.source) && { source: cleanString(form.source) }),
    ...(cleanString(form.notes) && { notes: cleanString(form.notes) }),
    ...(form.lead_status_id && { lead_status_id: form.lead_status_id }),
    ...(form.assigned_to && { assigned_to: form.assigned_to }),
    priority: form.priority ?? 2,
  } as LeadFormValues
}

function buildClientPayload(form: ClientFormValues): ClientFormValues {
  return {
    nombre: form.nombre.trim(),
    ...(cleanString(form.apellido_paterno) && { apellido_paterno: cleanString(form.apellido_paterno) }),
    ...(cleanString(form.apellido_materno) && { apellido_materno: cleanString(form.apellido_materno) }),
    ...(cleanString(form.curp) && { curp: cleanString(form.curp) }),
    ...(cleanString(form.rfc) && { rfc: cleanString(form.rfc) }),
    ...(cleanString(form.negocio) && { negocio: cleanString(form.negocio) }),
    ...(cleanString(form.razon_social) && { razon_social: cleanString(form.razon_social) }),
    ...(cleanString(form.giro) && { giro: cleanString(form.giro) }),
    ...(cleanString(form.email) && { email: cleanString(form.email) }),
    ...(cleanString(form.telefono) && { telefono: cleanString(form.telefono) }),
    ...(cleanString(form.telefono_2) && { telefono_2: cleanString(form.telefono_2) }),
    ...(cleanString(form.direccion) && { direccion: cleanString(form.direccion) }),
    ...(cleanString(form.colonia) && { colonia: cleanString(form.colonia) }),
    ...(cleanString(form.ciudad) && { ciudad: cleanString(form.ciudad) }),
    ...(cleanString(form.estado) && { estado: cleanString(form.estado) }),
    ...(cleanString(form.cp) && { cp: cleanString(form.cp) }),
    ...(cleanString(form.nombre_aval) && { nombre_aval: cleanString(form.nombre_aval) }),
    ...(cleanString(form.telefono_aval) && { telefono_aval: cleanString(form.telefono_aval) }),
    ...(cleanString(form.direccion_aval) && { direccion_aval: cleanString(form.direccion_aval) }),
    ...(cleanString(form.source) && { source: cleanString(form.source) }),
    ...(cleanString(form.notes) && { notes: cleanString(form.notes) }),
  } as ClientFormValues
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

export function CrmForm({
  mode,
  statuses = [],
  users = [],
  isSubmitting = false,
  onSubmit,
}: Props) {
  const isLead = mode === "lead"
  const [open, setOpen] = React.useState(false)
  const [leadForm, setLeadForm] = React.useState<LeadFormValues>(initialLeadForm)
  const [clientForm, setClientForm] = React.useState<ClientFormValues>(initialClientForm)

  const resetForm = React.useCallback(() => {
    setLeadForm(initialLeadForm)
    setClientForm(initialClientForm)
  }, [])

  const setLeadField = <K extends keyof LeadFormValues>(key: K, value: LeadFormValues[K]) => {
    setLeadForm((prev) => ({ ...prev, [key]: value }))
  }

  const setClientField = <K extends keyof ClientFormValues>(
    key: K,
    value: ClientFormValues[K]
  ) => {
    setClientForm((prev) => ({ ...prev, [key]: value }))
  }

  const validate = () => {
    const nombre = isLead ? leadForm.nombre : clientForm.nombre
    if (!nombre.trim()) return "El nombre es obligatorio."
    const activeForm = isLead ? leadForm : clientForm
    if (!isValidRfc(activeForm.rfc)) return "Captura un RFC válido o rellénalo completamente con X."
    if (!isValidCurp(activeForm.curp)) return "Captura una CURP válida o rellénala completamente con X."
    return null
  }

  const handleSave = async () => {
    const error = validate()
    if (error) {
      toast.error(error)
      return
    }

    try {
      if (isLead) {
        await onSubmit(buildLeadPayload(leadForm))
      } else {
        await onSubmit(buildClientPayload(clientForm))
      }

      toast.success(isLead ? "Prospecto creado" : "Cliente creado")
      resetForm()
      setOpen(false)
    } catch (err) {
      toast.error("No se pudo guardar", {
        description: err instanceof Error ? err.message : "Intenta nuevamente.",
      })
    }
  }

  const title = isLead ? "Nuevo prospecto" : "Nuevo cliente"
  const description = isLead
    ? "Registra un prospecto para seguimiento comercial."
    : "Registra un cliente disponible para cotizaciones."

  const activeForm = isLead ? leadForm : clientForm

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) resetForm()
        setOpen(nextOpen)
      }}
    >
      <DialogTrigger asChild>
        <Button className="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-6 text-white shadow-lg transition-all hover:from-purple-700 hover:to-indigo-700 hover:-translate-y-0.5 border-none">
          <Plus className="mr-2 h-5 w-5" />
          {isLead ? "Agregar prospecto" : "Agregar cliente"}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nombre">
              <Input
                value={activeForm.nombre}
                onChange={(e) =>
                  isLead
                    ? setLeadField("nombre", e.target.value)
                    : setClientField("nombre", e.target.value)
                }
                placeholder="Nombre"
              />
            </Field>

            <Field label="Nombre comercial">
              <Input
                value={activeForm.negocio}
                onChange={(e) =>
                  isLead
                    ? setLeadField("negocio", e.target.value)
                    : setClientField("negocio", e.target.value)
                }
                placeholder="Negocio"
              />
            </Field>

            <Field label="Apellido paterno">
              <Input
                value={activeForm.apellido_paterno}
                onChange={(e) =>
                  isLead
                    ? setLeadField("apellido_paterno", e.target.value)
                    : setClientField("apellido_paterno", e.target.value)
                }
                placeholder="Apellido paterno"
              />
            </Field>

            <Field label="Razón social">
              <Input
                value={activeForm.razon_social}
                onChange={(e) =>
                  isLead
                    ? setLeadField("razon_social", e.target.value)
                    : setClientField("razon_social", e.target.value)
                }
                placeholder="Razón social"
              />
            </Field>

            <Field label="Apellido materno">
              <Input
                value={activeForm.apellido_materno}
                onChange={(e) =>
                  isLead
                    ? setLeadField("apellido_materno", e.target.value)
                    : setClientField("apellido_materno", e.target.value)
                }
                placeholder="Apellido materno"
              />
            </Field>

            <Field label="Giro">
              <Input
                value={activeForm.giro}
                onChange={(e) =>
                  isLead
                    ? setLeadField("giro", e.target.value)
                    : setClientField("giro", e.target.value)
                }
                placeholder="Giro"
              />
            </Field>

            <Field label="Teléfono">
              <PhoneInput
                value={activeForm.telefono}
                onValueChange={(value) =>
                  isLead
                    ? setLeadField("telefono", value)
                    : setClientField("telefono", value)
                }
                placeholder="Teléfono principal"
              />
            </Field>

            <Field label="Teléfono secundario">
              <PhoneInput
                value={activeForm.telefono_2}
                onValueChange={(value) =>
                  isLead
                    ? setLeadField("telefono_2", value)
                    : setClientField("telefono_2", value)
                }
                placeholder="Teléfono alterno"
              />
            </Field>

            <Field label="Email">
              <Input
                type="email"
                value={activeForm.email}
                onChange={(e) =>
                  isLead
                    ? setLeadField("email", e.target.value)
                    : setClientField("email", e.target.value)
                }
                placeholder="correo@empresa.com"
              />
            </Field>

            <Field label="Fuente">
              <Input
                value={activeForm.source}
                onChange={(e) =>
                  isLead
                    ? setLeadField("source", e.target.value)
                    : setClientField("source", e.target.value)
                }
                placeholder="Referido, Facebook, Instagram..."
              />
            </Field>

            <Field label="RFC">
              <RfcInput
                value={activeForm.rfc}
                onValueChange={(value) =>
                  isLead
                    ? setLeadField("rfc", value)
                    : setClientField("rfc", value)
                }
              />
            </Field>

            <Field label="CURP">
              <CurpInput
                value={activeForm.curp}
                onValueChange={(value) =>
                  isLead
                    ? setLeadField("curp", value)
                    : setClientField("curp", value)
                }
              />
            </Field>
          </div>

          {isLead ? (
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Estatus">
                <Select
                  value={leadForm.lead_status_id ? String(leadForm.lead_status_id) : EMPTY}
                  onValueChange={(value) =>
                    setLeadField("lead_status_id", value === EMPTY ? undefined : Number(value))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona estatus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={EMPTY}>Sin estatus</SelectItem>
                    {statuses.map((status) => (
                      <SelectItem key={status.id} value={String(status.id)}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Asignado a">
                <Select
                  value={leadForm.assigned_to ? String(leadForm.assigned_to) : EMPTY}
                  onValueChange={(value) =>
                    setLeadField("assigned_to", value === EMPTY ? undefined : Number(value))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona usuario" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={EMPTY}>Sin asignar</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={String(user.id)}>
                        {user.name || user.username || `Usuario ${user.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Prioridad">
                <Select
                  value={String(leadForm.priority ?? 2)}
                  onValueChange={(value) =>
                    setLeadField("priority", Number(value) as LeadPriority)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Alta</SelectItem>
                    <SelectItem value="2">Media</SelectItem>
                    <SelectItem value="3">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Dirección">
              <Input
                value={activeForm.direccion}
                onChange={(e) =>
                  isLead
                    ? setLeadField("direccion", e.target.value)
                    : setClientField("direccion", e.target.value)
                }
                placeholder="Dirección"
              />
            </Field>

            <Field label="Colonia">
              <Input
                value={activeForm.colonia}
                onChange={(e) =>
                  isLead
                    ? setLeadField("colonia", e.target.value)
                    : setClientField("colonia", e.target.value)
                }
                placeholder="Colonia"
              />
            </Field>

            <Field label="Ciudad">
              <Input
                value={activeForm.ciudad}
                onChange={(e) =>
                  isLead
                    ? setLeadField("ciudad", e.target.value)
                    : setClientField("ciudad", e.target.value)
                }
                placeholder="Ciudad"
              />
            </Field>

            <Field label="Estado">
              <Input
                value={activeForm.estado}
                onChange={(e) =>
                  isLead
                    ? setLeadField("estado", e.target.value)
                    : setClientField("estado", e.target.value)
                }
                placeholder="Estado"
              />
            </Field>

            <Field label="Código postal">
              <Input
                value={activeForm.cp}
                onChange={(e) =>
                  isLead
                    ? setLeadField("cp", e.target.value)
                    : setClientField("cp", e.target.value)
                }
                placeholder="CP"
              />
            </Field>

            <Field label="Nombre aval">
              <Input
                value={activeForm.nombre_aval}
                onChange={(e) =>
                  isLead
                    ? setLeadField("nombre_aval", e.target.value)
                    : setClientField("nombre_aval", e.target.value)
                }
                placeholder="Nombre del aval"
              />
            </Field>

            <Field label="Teléfono aval">
              <PhoneInput
                value={activeForm.telefono_aval}
                onValueChange={(value) =>
                  isLead
                    ? setLeadField("telefono_aval", value)
                    : setClientField("telefono_aval", value)
                }
                placeholder="Teléfono del aval"
              />
            </Field>

            <Field label="Dirección aval">
              <Input
                value={activeForm.direccion_aval}
                onChange={(e) =>
                  isLead
                    ? setLeadField("direccion_aval", e.target.value)
                    : setClientField("direccion_aval", e.target.value)
                }
                placeholder="Dirección del aval"
              />
            </Field>
          </div>

          <Field label="Notas">
            <Textarea
              value={activeForm.notes}
              onChange={(e) =>
                isLead
                  ? setLeadField("notes", e.target.value)
                  : setClientField("notes", e.target.value)
              }
              rows={4}
              placeholder="Notas internas"
            />
          </Field>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              resetForm()
              setOpen(false)
            }}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
