import * as React from "react"
import type { LatLngLiteral } from "leaflet"
import type { SpaceFormPayload, SpaceFormValues } from "@/types/Space"

import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

import { MapPicker } from "@/components/maps/map-picker"
import { HeatmapLayer } from "@/components/maps/heatmap-layer"
import { useSpaceCoords } from "@/lib/hooks/spaceHook"

export type SpaceType = "Espectacular" | "Muro" | "Parabus"
export type ViewType = "Vista natural" | "Vista cruzada"

type SpaceCoord = {
  id?: number
  title?: string
  latitude: string | number
  longitude: string | number
}

type Props = {
  /** create | edit */
  mode?: "create" | "edit"
  /** Dialog title */
  title?: string
  /** Trigger text */
  triggerText?: string
  /** usar propio botón/icono como trigger */
  trigger?: React.ReactNode
  /** Valores iniciales para edición */
  initialValues?: Partial<SpaceFormValues>
  /** texto del botón submit */
  submitText?: string
  /** loading externo (useCreateSpace / useUpdateSpace del padre) */
  isSubmitting?: boolean
  /** guardar (create/update) */
  onSubmit: (payload: SpaceFormPayload) => Promise<void> | void
  /** callback cuando guardó */
  onSaved?: (payload: SpaceFormPayload) => void
  /** callback cuando cancela */
  onCancel?: () => void
  /** controlar el open desde fuera (opcional) */
  open?: boolean
  onOpenChange?: (v: boolean) => void
  hideTrigger?: boolean
}

const baseForm: SpaceFormValues = {
  faces: undefined,
  latitude: undefined,
  longitude: undefined,
  assigned_id: "",
  title: "",
  price: undefined,
  type: undefined,
  width_m: undefined,
  height_m: undefined,
  description: "",
  has_lights: false,
  viewType: undefined,
  comments: "",
}

export function SpaceForm({
  mode = "create",
  title,
  triggerText,
  trigger,
  initialValues,
  submitText,
  isSubmitting = false,
  onSubmit,
  onSaved,
  onCancel,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  hideTrigger,
}: Props) {
  const isCreate = mode === "create"

  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = controlledOnOpenChange ?? setUncontrolledOpen

  const [showHeat, setShowHeat] = React.useState(true)
  const [selectedExistingId, setSelectedExistingId] = React.useState<number | null>(null)

  const [images, setImages] = React.useState<File[]>([])
  const [imagePreviews, setImagePreviews] = React.useState<string[]>([])

  const coordsQuery = useSpaceCoords()
  const coordsData = React.useMemo<SpaceCoord[]>(
    () => (coordsQuery.data?.data ?? []) as SpaceCoord[],
    [coordsQuery.data],
  )

  // rehidrata el form
  const [form, setForm] = React.useState<SpaceFormValues>(() => ({
    ...baseForm,
    ...initialValues,
  }))

  React.useEffect(() => {
    setForm({ ...baseForm, ...initialValues })
    setImages([])
    setSelectedExistingId(null)
    setShowHeat(true)
  }, [initialValues])

  // refetch coords al abrir
  React.useEffect(() => {
    if (!open) return
    coordsQuery.refetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  React.useEffect(() => {
    const urls = images.map((f) => URL.createObjectURL(f))
    setImagePreviews(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [images])

  const resetForm = () => {
    setForm({ ...baseForm, ...initialValues })
    setShowHeat(true)
    setImages([])
    setImagePreviews([])
    setSelectedExistingId(null)
  }

  const setField = <K extends keyof SpaceFormValues>(key: K, value: SpaceFormValues[K]) => {
    setForm((p) => ({ ...p, [key]: value }))
  }

  const handlePick = (c: LatLngLiteral) => {
    setField("latitude", c.lat)
    setField("longitude", c.lng)
  }

  const coords: LatLngLiteral | undefined =
    form.latitude !== undefined && form.longitude !== undefined
      ? { lat: form.latitude, lng: form.longitude }
      : undefined

  const heatPoints = React.useMemo(
    () =>
      coordsData.map((p) => ({
        lat: Number(p.latitude),
        lng: Number(p.longitude),
        weight: 1,
      })),
    [coordsData],
  )

  const existingMarkers = React.useMemo(() => {
    return coordsData.map((p: SpaceCoord, idx: number) => ({
      id: Number(p.id ?? idx + 1),
      title: String(p.title ?? `Espacio ${p.id ?? idx + 1}`),
      position: { lat: Number(p.latitude), lng: Number(p.longitude) },
    }))
  }, [coordsData])

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    const onlyImages = files.filter((f) => f.type.startsWith("image/"))
    setImages((prev) => [...prev, ...onlyImages].slice(0, 5))

    e.target.value = ""
  }

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx))
  }

  const validate = () => {
    if (!form.faces || form.faces <= 0) return "Falta el número de caras"
    if (!form.price || form.price <= 0) return "Falta el precio"
    if (!form.type) return "Falta el tipo"
    if (!form.width_m || form.width_m <= 0) return "Falta el ancho"
    if (!form.height_m || form.height_m <= 0) return "Falta el alto"
    if (!form.viewType) return "Falta el tipo de vista"
    if (!form.title.trim()) return "Falta el título"
    if (form.latitude === undefined || form.longitude === undefined) return "Falta la ubicación"
    return null
  }

  const handleSubmit = async () => {
    const msg = validate()
    if (msg) {
      toast.error(msg)
      return
    }

    try {
      const payload: SpaceFormPayload = { ...form, images }
      await onSubmit(payload)

      toast.success(isCreate ? "Espacio creado" : "Espacio actualizado", {
        description: "Se guardó correctamente.",
      })

      onSaved?.(payload)

      resetForm()
      setOpen(false)
    } catch (err: unknown) {
      toast.error("No se pudo guardar", {
        description: err instanceof Error ? err.message : "Intenta nuevamente.",
      })
    }
  }

  const handleCancel = () => {
    resetForm()
    setOpen(false)
    onCancel?.()
  }

  const finalTitle = title ?? (isCreate ? "Nuevo espacio" : "Editar espacio")
  const finalSubmitText = submitText ?? (isCreate ? "Guardar" : "Actualizar")
  const finalTriggerText = triggerText ?? (isCreate ? "Agregar" : "Editar")

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (isSubmitting) return
        setOpen(v)
        if (!v) resetForm()
      }}
    >
      {/* Trigger opcional */}
      {!hideTrigger ? (
        trigger ? (
          <DialogTrigger asChild>{trigger}</DialogTrigger>
        ) : (
          <DialogTrigger asChild>
            <Button>{finalTriggerText}</Button>
          </DialogTrigger>
        )
      ) : null}

      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto pr-1" style={{ padding: "30px" }}>
        <DialogHeader>
          <DialogTitle>{finalTitle}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>No. de caras</Label>
            <Input
              type="number"
              value={form.faces ?? ""}
              onChange={(e) => setField("faces", Number(e.target.value))}
            />
          </div>

          <div className="flex items-center justify-between gap-3 sm:col-span-2">
            <Label>Ubicación en el mapa</Label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Ver calor</span>
              <Switch checked={showHeat} onCheckedChange={setShowHeat} />
            </div>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[320px_1fr]">
              <div className="h-[320px] overflow-auto rounded-md border bg-background">
                {existingMarkers.map((m) => {
                  const active = m.id === selectedExistingId
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedExistingId(m.id)}
                      className={[
                        "w-full text-left px-3 py-2 border-b",
                        active ? "bg-green-50 border-l-4 border-l-green-600" : "hover:bg-muted",
                      ].join(" ")}
                    >
                      <div className="text-sm font-medium">{m.title}</div>
                      <div className="text-xs opacity-70">
                        {m.position.lat.toFixed(5)}, {m.position.lng.toFixed(5)}
                      </div>
                    </button>
                  )
                })}
              </div>

              <MapPicker
                height={320}
                value={coords}
                onChange={handlePick}
                existingMarkers={existingMarkers}
                selectedMarkerId={selectedExistingId}
                onSelectMarker={(id) => setSelectedExistingId(id)}
                focusMarkerId={selectedExistingId}
                pickOnMarkerClick={false}
              >
                {showHeat && heatPoints.length > 0 ? (
                  <HeatmapLayer points={heatPoints} radius={28} blur={18} maxZoom={17} minOpacity={0.35} />
                ) : null}
              </MapPicker>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Latitud</Label>
            <Input value={form.latitude ?? ""} readOnly />
          </div>

          <div className="space-y-2">
            <Label>Longitud</Label>
            <Input value={form.longitude ?? ""} readOnly />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>ID</Label>
            <Input value={form.assigned_id ?? ""} onChange={(e) => setField("assigned_id", e.target.value)} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Título</Label>
            <Input value={form.title} onChange={(e) => setField("title", e.target.value)} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Precio</Label>
            <Input type="number" value={form.price ?? ""} onChange={(e) => setField("price", Number(e.target.value))} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Tipo</Label>
            <select
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.type ?? ""}
              onChange={(e) => setField("type", e.target.value as SpaceType)}
            >
              <option value="">Seleccionar</option>
              <option value="Espectacular">Espectacular</option>
              <option value="Muro">Muro</option>
              <option value="Parabus">Parabús</option>
            </select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Ancho (m)</Label>
            <Input type="number" value={form.width_m ?? ""} onChange={(e) => setField("width_m", Number(e.target.value))} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Alto (m)</Label>
            <Input type="number" value={form.height_m ?? ""} onChange={(e) => setField("height_m", Number(e.target.value))} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Descripción</Label>
            <Textarea value={form.description ?? ""} onChange={(e) => setField("description", e.target.value)} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Tiene luces</Label>
            <div className="flex w-full items-center justify-between rounded-md border px-4 py-3">
              <span className="text-sm text-muted-foreground">{form.has_lights ? "Sí" : "No"}</span>
              <Switch checked={form.has_lights} onCheckedChange={(v) => setField("has_lights", v)} />
            </div>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Tipo de vista</Label>
            <select
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.viewType ?? ""}
              onChange={(e) => setField("viewType", e.target.value as ViewType)}
            >
              <option value="">Seleccionar</option>
              <option value="Vista natural">Vista natural</option>
              <option value="Vista cruzada">Vista cruzada</option>
            </select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Nivel socioeconómico</Label>
            <select
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.socioeconomic_level ?? ""}
              onChange={(e) => setField("socioeconomic_level", e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="A/B">A/B</option>
              <option value="C+">C+</option>
              <option value="C">C</option>
              <option value="C-">C-</option>
              <option value="D+">D+</option>
              <option value="D">D</option>
              <option value="E">E</option>
            </select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Comentarios</Label>
            <Textarea value={form.comments ?? ""} onChange={(e) => setField("comments", e.target.value)} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Imágenes</Label>
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImagesChange}
              disabled={isSubmitting}
            />

            {imagePreviews.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {imagePreviews.map((src, idx) => (
                  <div key={src} className="relative overflow-hidden rounded-md border">
                    <img src={src} alt={`Imagen ${idx + 1}`} className="h-28 w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute right-2 top-2 rounded bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/80"
                    >
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            Cancelar
          </Button>

          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : finalSubmitText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}