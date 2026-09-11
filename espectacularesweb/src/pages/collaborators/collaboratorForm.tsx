import * as React from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PhoneInput } from "@/components/ui/phone-input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type { CollaboratorFormValues, CollaboratorRecord } from "@/types/Collaborator"

const EMPTY: CollaboratorFormValues = { name: "", position: "", phone: "", email: "", notes: "", active: true }
const toForm = (record: CollaboratorRecord): CollaboratorFormValues => ({ name: record.name, position: record.position ?? "", phone: record.phone ?? "", email: record.email ?? "", notes: record.notes ?? "", active: record.active !== false })

type Props = { editRecord?: CollaboratorRecord | null; isSubmitting: boolean; onSubmit: (payload: CollaboratorFormValues) => Promise<void>; open?: boolean; onOpenChange?: (open: boolean) => void; showTrigger?: boolean }

export function CollaboratorForm({ editRecord, isSubmitting, onSubmit, open: controlledOpen, onOpenChange, showTrigger = true }: Props) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const [form, setForm] = React.useState(EMPTY)
  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  React.useEffect(() => { if (open) setForm(editRecord ? toForm(editRecord) : EMPTY) }, [open, editRecord])
  const update = <K extends keyof CollaboratorFormValues>(key: K, value: CollaboratorFormValues[K]) => setForm((old) => ({ ...old, [key]: value }))
  const submit = async (event: React.FormEvent) => { event.preventDefault(); await onSubmit(form); setOpen(false) }

  const content = <DialogContent className="max-w-2xl">
    <DialogHeader><DialogTitle>{editRecord ? "Editar colaborador" : "Nuevo colaborador"}</DialogTitle><DialogDescription>Registra la información interna del colaborador.</DialogDescription></DialogHeader>
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label>Nombre *</Label><Input value={form.name} onChange={(e) => update("name", e.target.value)} required /></div>
        <div className="space-y-2"><Label>Puesto</Label><Input value={form.position} onChange={(e) => update("position", e.target.value)} /></div>
        <div className="space-y-2"><Label>Teléfono</Label><PhoneInput value={form.phone} onValueChange={(value) => update("phone", value)} /></div>
        <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} /></div>
      </div>
      <div className="space-y-2"><Label>Notas</Label><Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} /></div>
      <div className="flex items-center justify-between rounded-md border px-4 py-3"><div><p className="text-sm font-medium">Activo</p><p className="text-xs text-muted-foreground">Permite ocultarlo sin borrar sus datos.</p></div><Switch checked={form.active} onCheckedChange={(value) => update("active", value)} /></div>
      <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Guardando..." : "Guardar"}</Button></DialogFooter>
    </form>
  </DialogContent>

  return <Dialog open={open} onOpenChange={setOpen}>{showTrigger && <DialogTrigger asChild><Button className="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-6 text-white"><Plus className="mr-2 h-5 w-5" />Nuevo colaborador</Button></DialogTrigger>}{content}</Dialog>
}
