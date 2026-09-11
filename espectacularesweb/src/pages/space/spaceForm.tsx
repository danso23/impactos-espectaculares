import * as React from "react"
import type { LatLngLiteral } from "leaflet"
import { ArrowLeft, ArrowRight, ImagePlus, MapPin, RefreshCw, Ruler, Save, Trash2, Undo2, X } from "lucide-react"
import { toast } from "sonner"

import { HeatmapLayer } from "@/components/maps/heatmap-layer"
import { MapPicker } from "@/components/maps/map-picker"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NumericInput } from "@/components/ui/numeric-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useSpaceCoords } from "@/lib/hooks/spaceHook"
import { prepareSpaceImages } from "@/lib/images/prepare-space-images"
import type { SpaceFormPayload, SpaceFormValues } from "@/types/Space"

export type SpaceType = "Espectacular" | "Muro" | "Parabus"
export type ViewType = "Vista natural" | "Vista cruzada" | "Natural/Cruzada"

const EMPTY_SELECT_VALUE = "__none__"
const MAX_SPACE_IMAGES = 10

type SpaceCoord = {
  id?: number
  title?: string
  latitude: string | number
  longitude: string | number
}

type SpaceFormProps = {
  mode?: "create" | "edit"
  initialValues?: Partial<SpaceFormValues>
  existingImages?: Array<{
    id: number
    url: string
    isCover?: boolean
  }>
  isSubmitting?: boolean
  onSubmit: (payload: SpaceFormPayload) => Promise<void> | void
  onSaved?: (payload: SpaceFormPayload) => void
  onCancel?: () => void
}

const baseForm: SpaceFormValues = {
  active: true,
  is_rotating: false,
  blocked_from: "",
  blocked_until: "",
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
  socioeconomic_level: undefined,
  viewType: undefined,
  comments: "",
}

export function SpaceForm({
  mode = "create",
  initialValues,
  existingImages = [],
  isSubmitting = false,
  onSubmit,
  onSaved,
  onCancel,
}: SpaceFormProps) {
  const isCreate = mode === "create"
  const [showHeat, setShowHeat] = React.useState(true)
  const [selectedExistingId, setSelectedExistingId] = React.useState<number | null>(null)
  const [images, setImages] = React.useState<File[]>([])
  const [removedImageIds, setRemovedImageIds] = React.useState<number[]>([])
  const [existingImageOrder, setExistingImageOrder] = React.useState<number[]>(() =>
    existingImages.map((image) => image.id)
  )
  const [replacementImageId, setReplacementImageId] = React.useState<number | null>(null)
  const [imagePreviews, setImagePreviews] = React.useState<string[]>([])
  const [isPreparingImages, setIsPreparingImages] = React.useState(false)
  const replacementInputRef = React.useRef<HTMLInputElement>(null)
  const [form, setForm] = React.useState<SpaceFormValues>(() => ({
    ...baseForm,
    ...initialValues,
  }))

  const coordsQuery = useSpaceCoords()
  const coordsData = React.useMemo<SpaceCoord[]>(
    () => (coordsQuery.data?.data ?? []) as SpaceCoord[],
    [coordsQuery.data]
  )

  React.useEffect(() => {
    setForm({ ...baseForm, ...initialValues })
    setImages([])
    setRemovedImageIds([])
    setExistingImageOrder(existingImages.map((image) => image.id))
    setReplacementImageId(null)
    setSelectedExistingId(null)
    setShowHeat(true)
  }, [initialValues, existingImages])

  React.useEffect(() => {
    const urls = images.map((file) => URL.createObjectURL(file))
    setImagePreviews(urls)
    return () => urls.forEach((url) => URL.revokeObjectURL(url))
  }, [images])

  const setField = <K extends keyof SpaceFormValues>(
    key: K,
    value: SpaceFormValues[K]
  ) => setForm((current) => ({ ...current, [key]: value }))

  const coords: LatLngLiteral | undefined =
    form.latitude !== undefined && form.longitude !== undefined
      ? { lat: form.latitude, lng: form.longitude }
      : undefined

  const heatPoints = React.useMemo(
    () =>
      coordsData.map((point) => ({
        lat: Number(point.latitude),
        lng: Number(point.longitude),
        weight: 1,
      })),
    [coordsData]
  )

  const existingMarkers = React.useMemo(
    () =>
      coordsData.map((point, index) => ({
        id: Number(point.id ?? index + 1),
        title: String(point.title ?? `Espacio ${point.id ?? index + 1}`),
        position: {
          lat: Number(point.latitude),
          lng: Number(point.longitude),
        },
      })),
    [coordsData]
  )

  const orderedExistingImages = existingImageOrder
    .map((imageId) => existingImages.find((image) => image.id === imageId))
    .filter((image): image is NonNullable<typeof image> => Boolean(image))
  const retainedExistingImages = orderedExistingImages.filter(
    (image) => !removedImageIds.includes(image.id)
  )
  const availableImageSlots = Math.max(
    0,
    MAX_SPACE_IMAGES - retainedExistingImages.length - images.length
  )

  const handleImagesChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []).slice(0, availableImageSlots)

    event.target.value = ""
    if (!selectedFiles.length) return

    setIsPreparingImages(true)
    try {
      const prepared = await prepareSpaceImages(selectedFiles)
      setImages((current) => [...current, ...prepared].slice(0, MAX_SPACE_IMAGES))
      toast.success("Imágenes optimizadas", {
        description: "Se corrigió su orientación y tamaño para la carga.",
      })
    } catch (error) {
      toast.error("No se pudieron preparar las imágenes", {
        description: error instanceof Error ? error.message : "Revisa los archivos seleccionados.",
      })
    } finally {
      setIsPreparingImages(false)
    }
  }

  const requestImageReplacement = (imageId: number) => {
    setReplacementImageId(imageId)
    replacementInputRef.current?.click()
  }

  const restoreExistingImage = (imageId: number) => {
    if (retainedExistingImages.length + images.length >= MAX_SPACE_IMAGES) {
      toast.error("No hay espacio para restaurar esta imagen", {
        description: `Cada espacio puede tener como máximo ${MAX_SPACE_IMAGES} imágenes.`,
      })
      return
    }

    setRemovedImageIds((current) =>
      current.filter((currentImageId) => currentImageId !== imageId)
    )
  }

  const moveNewImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return

    setImages((current) => {
      const reordered = [...current]
      const [image] = reordered.splice(fromIndex, 1)
      reordered.splice(toIndex, 0, image)
      return reordered
    })
  }

  const moveExistingImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= existingImageOrder.length) return

    setExistingImageOrder((current) => {
      const reordered = [...current]
      const [imageId] = reordered.splice(fromIndex, 1)
      reordered.splice(toIndex, 0, imageId)
      return reordered
    })
  }

  const handleReplacementChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    event.target.value = ""

    if (!selectedFile || replacementImageId === null) {
      setReplacementImageId(null)
      return
    }

    setIsPreparingImages(true)
    try {
      const [prepared] = await prepareSpaceImages([selectedFile])
      if (!prepared) return

      setRemovedImageIds((current) =>
        current.includes(replacementImageId) ? current : [...current, replacementImageId]
      )
      setImages((current) => [...current, prepared])
      toast.success("Imagen preparada para sustituirse", {
        description: "El cambio se aplicará cuando guardes el espacio.",
      })
    } catch (error) {
      toast.error("No se pudo preparar la imagen", {
        description: error instanceof Error ? error.message : "Revisa el archivo seleccionado.",
      })
    } finally {
      setReplacementImageId(null)
      setIsPreparingImages(false)
    }
  }

  const validate = () => {
    if (!form.title.trim()) return "Falta el título"
    if (!form.faces || form.faces <= 0) return "Falta el número de caras"
    if (!form.price || form.price <= 0) return "Falta el precio"
    if (form.active === false && !form.blocked_from) return "Falta la fecha de inicio del bloqueo"
    if (form.active === false && !form.blocked_until) return "Falta la fecha de fin del bloqueo"
    if (
      form.active === false &&
      form.blocked_from &&
      form.blocked_until &&
      form.blocked_until < form.blocked_from
    ) return "La fecha final del bloqueo no puede ser menor a la inicial"
    if (!form.type) return "Falta el tipo"
    if (!form.width_m || form.width_m <= 0) return "Falta el ancho"
    if (!form.height_m || form.height_m <= 0) return "Falta el alto"
    if (!form.viewType) return "Falta el tipo de vista"
    if (form.latitude === undefined || form.longitude === undefined) return "Falta la ubicación"
    return null
  }

  const handleSubmit = async () => {
    const validationMessage = validate()
    if (validationMessage) {
      toast.error(validationMessage)
      return
    }

    try {
      const payload: SpaceFormPayload = {
        ...form,
        images,
        ...(isCreate || removedImageIds.length === 0
          ? {}
          : { remove_image_ids: removedImageIds }),
        ...(!isCreate
          ? { image_order_ids: retainedExistingImages.map((image) => image.id) }
          : {}),
      }
      await onSubmit(payload)
      toast.success(isCreate ? "Espacio creado" : "Espacio actualizado", {
        description: "Se guardó correctamente.",
      })
      onSaved?.(payload)
    } catch (error) {
      toast.error("No se pudo guardar", {
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(420px,0.85fr)]">
        <Card className="overflow-hidden border-violet-100 shadow-lg shadow-violet-950/5 xl:sticky xl:top-6">
          <CardHeader className="border-b border-violet-100 bg-violet-50/40">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5 text-violet-600" />
                  Ubicación
                </CardTitle>
                <CardDescription>Selecciona el punto exacto del espacio en el mapa.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Mapa de calor</span>
                <Switch checked={showHeat} onCheckedChange={setShowHeat} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            <MapPicker
              height={500}
              value={coords}
              onChange={(position) => {
                setField("latitude", position.lat)
                setField("longitude", position.lng)
              }}
              existingMarkers={existingMarkers}
              selectedMarkerId={selectedExistingId}
              onSelectMarker={setSelectedExistingId}
              focusMarkerId={selectedExistingId}
              pickOnMarkerClick={false}
            >
              {showHeat && heatPoints.length > 0 ? (
                <HeatmapLayer
                  points={heatPoints}
                  radius={28}
                  blur={18}
                  maxZoom={17}
                  minOpacity={0.35}
                />
              ) : null}
            </MapPicker>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Latitud</Label>
                <Input value={form.latitude ?? ""} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Longitud</Label>
                <Input value={form.longitude ?? ""} readOnly />
              </div>
            </div>

            {existingMarkers.length ? (
              <div className="max-h-40 overflow-y-auto rounded-xl border border-violet-100">
                {existingMarkers.map((marker) => (
                  <button
                    key={marker.id}
                    type="button"
                    onClick={() => setSelectedExistingId(marker.id)}
                    className={`flex w-full items-center justify-between border-b border-violet-50 px-3 py-2 text-left text-sm last:border-0 hover:bg-violet-50 ${
                      marker.id === selectedExistingId ? "bg-violet-50 text-violet-800" : ""
                    }`}
                  >
                    <span className="truncate font-medium">{marker.title}</span>
                    <span className="ml-3 shrink-0 text-xs text-muted-foreground">
                      {marker.position.lat.toFixed(4)}, {marker.position.lng.toFixed(4)}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-violet-100 shadow-lg shadow-violet-950/5">
            <CardHeader>
              <CardTitle className="text-lg">Información general</CardTitle>
              <CardDescription>Identificación y datos comerciales del espacio.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className={`flex items-center justify-between rounded-xl border px-4 py-3 sm:col-span-2 ${
                form.active === false
                  ? "border-amber-200 bg-amber-50"
                  : "border-emerald-200 bg-emerald-50"
              }`}>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Disponibilidad comercial</p>
                  <p className="text-xs text-muted-foreground">
                    {form.active === false
                      ? "Bloqueado: no podrá agregarse a nuevas cotizaciones o rentas."
                      : "Disponible para nuevas cotizaciones y rentas."}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold ${
                    form.active === false ? "text-amber-700" : "text-emerald-700"
                  }`}>
                    {form.active === false ? "Bloqueado" : "Disponible"}
                  </span>
                  <Switch
                    checked={form.active !== false}
                    onCheckedChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        active: value,
                        blocked_from: value ? "" : current.blocked_from,
                        blocked_until: value ? "" : current.blocked_until,
                      }))
                    }
                    aria-label="Disponibilidad comercial del espacio"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-violet-200 bg-violet-50/60 px-4 py-3 sm:col-span-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Espacio rotativo</p>
                  <p className="text-xs text-muted-foreground">
                    Marca esta opción para identificar y filtrar casos internos especiales.
                  </p>
                </div>
                <Switch
                  checked={Boolean(form.is_rotating)}
                  onCheckedChange={(value) => setField("is_rotating", value)}
                  aria-label="Marcar espacio como rotativo"
                />
              </div>
              {form.active === false ? (
                <div className="grid gap-4 rounded-xl border border-amber-200 bg-amber-50/70 p-4 sm:col-span-2 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Inicio del bloqueo</Label>
                    <Input
                      type="date"
                      value={form.blocked_from ?? ""}
                      onChange={(event) => setField("blocked_from", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fin del bloqueo</Label>
                    <Input
                      type="date"
                      min={form.blocked_from || undefined}
                      value={form.blocked_until ?? ""}
                      onChange={(event) => setField("blocked_until", event.target.value)}
                    />
                  </div>
                  <p className="text-xs text-amber-800 sm:col-span-2">
                    El espacio solo aparecerá bloqueado durante este periodo y volverá a estar disponible al finalizar.
                  </p>
                </div>
              ) : null}
              <div className="space-y-2">
                <Label>ID asignado</Label>
                <Input
                  value={form.assigned_id ?? ""}
                  onChange={(event) => setField("assigned_id", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>No. de caras</Label>
                <NumericInput
                  value={form.faces ?? ""}
                  onValueChange={(value) => setField("faces", value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Título</Label>
                <Input
                  value={form.title}
                  onChange={(event) => setField("title", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={form.type ?? EMPTY_SELECT_VALUE}
                  onValueChange={(value) =>
                    setField("type", value === EMPTY_SELECT_VALUE ? undefined : value as SpaceType)
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={EMPTY_SELECT_VALUE}>Seleccionar</SelectItem>
                    <SelectItem value="Espectacular">Espectacular</SelectItem>
                    <SelectItem value="Muro">Muro</SelectItem>
                    <SelectItem value="Parabus">Parabús</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Precio</Label>
                <NumericInput
                  value={form.price ?? ""}
                  onValueChange={(value) => setField("price", value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-violet-100 shadow-lg shadow-violet-950/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Ruler className="h-5 w-5 text-violet-600" />
                Características
              </CardTitle>
              <CardDescription>Dimensiones, visibilidad y equipamiento.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Ancho (m)</Label>
                <NumericInput
                  value={form.width_m ?? ""}
                  onValueChange={(value) => setField("width_m", value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Alto (m)</Label>
                <NumericInput
                  value={form.height_m ?? ""}
                  onValueChange={(value) => setField("height_m", value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de vista</Label>
                <Select
                  value={form.viewType ?? EMPTY_SELECT_VALUE}
                  onValueChange={(value) =>
                    setField("viewType", value === EMPTY_SELECT_VALUE ? undefined : value as ViewType)
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={EMPTY_SELECT_VALUE}>Seleccionar</SelectItem>
                    <SelectItem value="Vista natural">Vista natural</SelectItem>
                    <SelectItem value="Vista cruzada">Vista cruzada</SelectItem>
                    <SelectItem value="Natural/Cruzada">Ambas vistas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nivel socioeconómico</Label>
                <Select
                  value={form.socioeconomic_level ?? EMPTY_SELECT_VALUE}
                  onValueChange={(value) =>
                    setField("socioeconomic_level", value === EMPTY_SELECT_VALUE ? undefined : value)
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={EMPTY_SELECT_VALUE}>Seleccionar</SelectItem>
                    {[
                      "A/B", "C+", "C", "C-", "D+", "D", "E",
                    ].map((level) => <SelectItem key={level} value={level}>{level}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-violet-100 bg-violet-50/40 px-4 py-3 sm:col-span-2">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Iluminación</p>
                  <p className="text-xs text-muted-foreground">Indica si el espacio cuenta con luces.</p>
                </div>
                <Switch
                  checked={form.has_lights}
                  onCheckedChange={(value) => setField("has_lights", value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Descripción</Label>
                <Textarea
                  value={form.description ?? ""}
                  onChange={(event) => setField("description", event.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-violet-100 shadow-lg shadow-violet-950/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ImagePlus className="h-5 w-5 text-violet-600" />
                Notas e imágenes
              </CardTitle>
              <CardDescription>Información adicional y material visual.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Comentarios</Label>
                <Textarea
                  value={form.comments ?? ""}
                  onChange={(event) => setField("comments", event.target.value)}
                />
              </div>

              {!isCreate && existingImages.length ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label>Imágenes actuales</Label>
                    <span className="text-xs text-muted-foreground">
                      {retainedExistingImages.length} conservadas
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {orderedExistingImages.map((image, index) => {
                      const removed = removedImageIds.includes(image.id)
                      const visiblePosition = retainedExistingImages.findIndex(
                        (retainedImage) => retainedImage.id === image.id
                      ) + 1

                      return (
                        <div
                          key={image.id}
                          className={`relative overflow-hidden rounded-xl border transition ${
                            removed
                              ? "border-red-200 bg-red-50 opacity-70"
                              : "border-violet-100"
                          }`}
                        >
                          <img
                            src={image.url}
                            alt={`Imagen actual ${index + 1}`}
                            className="h-32 w-full object-cover"
                          />
                          {!removed ? (
                            <span className="absolute left-2 top-2 rounded-full bg-violet-700 px-2 py-1 text-[10px] font-semibold text-white shadow">
                              {visiblePosition === 1
                                ? "Principal 1 · Portada"
                                : visiblePosition <= 4
                                  ? `Principal ${visiblePosition}`
                                  : `Imagen ${visiblePosition}`}
                            </span>
                          ) : null}

                          {!removed ? (
                            <div className="absolute right-2 top-2 flex gap-1">
                              <button
                                type="button"
                                onClick={() => moveExistingImage(index, index - 1)}
                                disabled={index === 0 || isSubmitting || isPreparingImages}
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/95 text-violet-700 shadow hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                                aria-label={`Mover imagen actual ${index + 1} a la izquierda`}
                              >
                                <ArrowLeft className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveExistingImage(index, index + 1)}
                                disabled={index === orderedExistingImages.length - 1 || isSubmitting || isPreparingImages}
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/95 text-violet-700 shadow hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                                aria-label={`Mover imagen actual ${index + 1} a la derecha`}
                              >
                                <ArrowRight className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : null}

                          {removed ? (
                            <button
                              type="button"
                              onClick={() => restoreExistingImage(image.id)}
                              className="absolute inset-x-2 bottom-2 flex items-center justify-center gap-1 rounded-lg bg-white px-2 py-2 text-xs font-semibold text-slate-700 shadow hover:bg-slate-50"
                            >
                              <Undo2 className="h-3.5 w-3.5" />
                              Deshacer eliminación
                            </button>
                          ) : (
                            <div className="absolute inset-x-2 bottom-2 flex gap-2">
                              <button
                                type="button"
                                onClick={() => requestImageReplacement(image.id)}
                                disabled={isSubmitting || isPreparingImages}
                                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-white/95 px-2 py-2 text-xs font-semibold text-violet-700 shadow hover:bg-white disabled:opacity-50"
                              >
                                <RefreshCw className="h-3.5 w-3.5" />
                                Sustituir
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setRemovedImageIds((current) => [...current, image.id])
                                }
                                disabled={isSubmitting || isPreparingImages}
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-white shadow hover:bg-red-700 disabled:opacity-50"
                                aria-label={`Eliminar imagen actual ${index + 1}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <input
                    ref={replacementInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleReplacementChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    Ordena las imágenes con las flechas. Las posiciones 1 a 4 se mostrarán en el catálogo y PDF; las eliminaciones, sustituciones y cambios de orden se aplicarán al guardar.
                  </p>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label>{isCreate ? "Imágenes" : "Agregar imágenes"}</Label>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImagesChange}
                  disabled={isSubmitting || isPreparingImages || availableImageSlots === 0}
                />
                <p className="text-xs text-muted-foreground">
                  {isPreparingImages
                    ? "Optimizando imágenes..."
                    : `Puedes agregar hasta ${MAX_SPACE_IMAGES} imágenes y ordenarlas. Quedan ${availableImageSlots} espacios; la primera será la portada y el PDF mostrará la portada más las siguientes tres.`}
                </p>
              </div>

              {imagePreviews.length ? (
                <div className="space-y-2">
                  <Label>Imágenes nuevas por guardar</Label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {imagePreviews.map((source, index) => {
                    const finalPosition = retainedExistingImages.length + index + 1

                    return (
                    <div key={source} className="relative overflow-hidden rounded-xl border border-violet-100">
                      <img src={source} alt={`Imagen ${finalPosition}`} className="h-28 w-full object-cover" />
                      <span className="absolute left-2 top-2 rounded-full bg-violet-700 px-2 py-1 text-[10px] font-semibold text-white shadow">
                        {finalPosition === 1
                          ? "Principal 1 · Portada"
                          : finalPosition <= 4
                            ? `Principal ${finalPosition}`
                            : `Imagen ${finalPosition}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => setImages((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                        className="absolute right-2 top-2 rounded-lg bg-slate-950/70 p-1.5 text-white hover:bg-slate-950"
                        aria-label={`Quitar imagen ${index + 1}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <div className="absolute inset-x-2 bottom-2 flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => moveNewImage(index, index - 1)}
                          disabled={index === 0}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/95 text-violet-700 shadow hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`Mover imagen ${index + 1} a la izquierda`}
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveNewImage(index, index + 1)}
                          disabled={index === images.length - 1}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/95 text-violet-700 shadow hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`Mover imagen ${index + 1} a la derecha`}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    )
                  })}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="sticky bottom-0 z-20 flex flex-col-reverse gap-3 rounded-2xl border border-violet-100 bg-white/95 p-4 shadow-[0_-12px_32px_-20px_rgba(76,29,149,0.45)] backdrop-blur sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting || isPreparingImages}>
          Cancelar
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={isSubmitting || isPreparingImages}>
          <Save className="h-4 w-4" />
          {isPreparingImages ? "Procesando imágenes..." : isSubmitting ? "Guardando..." : isCreate ? "Guardar espacio" : "Guardar cambios"}
        </Button>
      </div>
    </div>
  )
}
