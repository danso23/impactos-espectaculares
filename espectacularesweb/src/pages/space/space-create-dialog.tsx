import * as React from "react";
import type { LatLngLiteral } from "leaflet";
import type { SpaceFormValues } from "@/types/Space";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

import { MapPicker } from "@/components/maps/map-picker";
import { HeatmapLayer } from "@/components/maps/heatmap-layer";
import { useSpaceCoords, useCreateSpace } from "@/lib/hooks/spaceHook";

type Props = {
  onCreated?: (values: SpaceFormValues) => void;
};

export function SpaceCreateDialog({ onCreated }: Props) {
  const [open, setOpen] = React.useState(false);
  const [showHeat, setShowHeat] = React.useState(true);
  const [selectedExistingId, setSelectedExistingId] = React.useState<
    number | null
  >(null);
  const [images, setImages] = React.useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = React.useState<string[]>([]);

  const coordsQuery = useSpaceCoords();
  const coordsData = coordsQuery.data?.data ?? [];

  const createSpaceMutation = useCreateSpace();

  React.useEffect(() => {
    if (!open) return;
    coordsQuery.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  React.useEffect(() => {
    // crear previews
    const urls = images.map((f) => URL.createObjectURL(f));
    setImagePreviews(urls);
    // limpiar objectURLs
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [images]);

  const [form, setForm] = React.useState<SpaceFormValues>({
    faces: undefined,
    latitude: undefined,
    longitude: undefined,
    idAsignado: "",
    title: "",
    price: undefined,
    type: undefined,
    width_m: undefined,
    height_m: undefined,
    description: "",
    hasLights: false,
    viewType: undefined,
    comments: "",
  });

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const onlyImages = files.filter((f) => f.type.startsWith("image/"));
    const merged = [...images, ...onlyImages].slice(0, 5);

    setImages(merged);

    e.target.value = "";
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const coords: LatLngLiteral | undefined =
    form.latitude !== undefined && form.longitude !== undefined
      ? { lat: form.latitude, lng: form.longitude }
      : undefined;

  const heatPoints = React.useMemo(
    () =>
      coordsData.map((p) => ({
        lat: Number(p.latitude),
        lng: Number(p.longitude),
        weight: 1,
      })),
    [coordsData],
  );

  const setField = <K extends keyof SpaceFormValues>(
    key: K,
    value: SpaceFormValues[K],
  ) => {
    setForm((p) => ({ ...p, [key]: value }));
  };

  const handlePick = (c: LatLngLiteral) => {
    setField("latitude", c.lat);
    setField("longitude", c.lng);
  };

  const handleSubmit = async () => {
    console.log(form);
    if (form.faces === undefined || form.faces === null || form.faces <= 0) {
      toast.error("Falta el número de caras", {
        description: "Ingresa un número válido.",
      });
      return;
    }

    if (form.price === undefined || form.price === null || form.price <= 0) {
      toast.error("Falta el precio", {
        description: "Ingresa un precio válido.",
      });
      return;
    }

    if (!form.type) {
      toast.error("Falta el tipo", { description: "Selecciona un tipo." });
      return;
    }

    if (form.width_m === undefined || form.width_m === null || form.width_m <= 0) {
      toast.error("Falta el ancho", {
        description: "Ingresa un ancho válido.",
      });
      return;
    }

    if (form.height_m === undefined || form.height_m === null || form.height_m <= 0) {
      toast.error("Falta el alto", { description: "Ingresa un alto válido." });
      return;
    }

    if (!form.viewType) {
      toast.error("Falta el tipo de vista", {
        description: "Selecciona un tipo de vista.",
      });
      return;
    }

    if (!form.title.trim()) {
      toast.error("Falta el título", {
        description: "El título es requerido.",
      });
      return;
    }
    if (form.latitude === undefined || form.longitude === undefined) {
      toast.error("Falta la ubicación", {
        description: "Selecciona una ubicación en el mapa.",
      });
      return;
    }
    try {
      const payload = { ...form, images };
      await createSpaceMutation.mutateAsync(payload);
      toast.success("Espacio creado", {
        description: "Se guardó correctamente.",
      });
      onCreated?.(payload);

      resetForm();
      setOpen(false);
    } catch (err: any) {
      toast.error("No se pudo guardar", {
        description: err?.message ?? "Intenta nuevamente.",
      });
    }
  };

  const existingMarkers = React.useMemo(() => {
    return coordsData.map((p: any, idx: number) => ({
      id: Number(p.id ?? idx + 1),
      title: String(p.title ?? `Espacio ${p.id ?? idx + 1}`),
      position: { lat: Number(p.latitude), lng: Number(p.longitude) },
    }));
  }, [coordsData]);

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      comments: "",
      latitude: undefined,
      longitude: undefined,
    });
    setShowHeat(true);
    setImages([]);
    setImagePreviews([]);
    setSelectedExistingId(null);
  };

  const handleCancel = () => {
    resetForm();
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (createSpaceMutation.isPending) return;
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button>Agregar</Button>
      </DialogTrigger>

      {/* Scroll dentro del modal */}
      <DialogContent
        className="sm:max-w-3xl max-h-[85vh] overflow-y-auto pr-1"
        style={{ padding: "30px" }}
      >
        <DialogHeader>
          <DialogTitle>Nuevo espacio</DialogTitle>
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

          {/* Header de mapa + switch heat */}
          <div className="flex items-center justify-between gap-3 sm:col-span-2">
            <Label>Ubicación en el mapa</Label>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Ver calor</span>
              <Switch checked={showHeat} onCheckedChange={setShowHeat} />
            </div>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[320px_1fr]">
              {/* LISTA IZQUIERDA */}
              <div className="h-[320px] overflow-auto rounded-md border bg-background">
                {existingMarkers.map((m) => {
                  const active = m.id === selectedExistingId;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedExistingId(m.id)}
                      className={[
                        "w-full text-left px-3 py-2 border-b",
                        active
                          ? "bg-green-50 border-l-4 border-l-green-600"
                          : "hover:bg-muted",
                      ].join(" ")}
                    >
                      <div className="text-sm font-medium">{m.title}</div>
                      <div className="text-xs opacity-70">
                        {m.position.lat.toFixed(5)}, {m.position.lng.toFixed(5)}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* MAPA */}
              <MapPicker
                height={320}
                value={coords}
                onChange={handlePick}
                existingMarkers={existingMarkers}
                selectedMarkerId={selectedExistingId}
                onSelectMarker={(id) => setSelectedExistingId(id)}
                focusMarkerId={selectedExistingId}
                pickOnMarkerClick={false} // ponlo en true si quieres copiar coords al seleccionar existente
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
            </div>

            <p className="text-xs text-muted-foreground">
              Click en un pin existente para activar su item en la lista. Click
              en un item para centrarlo. Click en el mapa para elegir la
              ubicación del nuevo espacio.
            </p>
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
            <Input
              value={form.idAsignado ?? ""}
              onChange={(e) => setField("idAsignado", e.target.value)}
              placeholder="ESP-001"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Título</Label>
            <Input
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="Ej. Espacio Norte 1"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Precio</Label>
            <Input
              type="number"
              value={form.price ?? ""}
              onChange={(e) => setField("price", Number(e.target.value))}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Tipo</Label>
            <select
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.type ?? ""}
              onChange={(e) => setField("type", e.target.value as any)}
            >
              <option value="">Seleccionar</option>
              <option value="Espectacular">Espectacular</option>
              <option value="Muro">Muro</option>
              <option value="Parabus">Parabús</option>
            </select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Ancho (en metros)</Label>
            <Input
              type="number"
              value={form.width_m ?? ""}
              onChange={(e) => setField("width_m", Number(e.target.value))}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Alto (en metros)</Label>
            <Input
              type="number"
              value={form.height_m ?? ""}
              onChange={(e) => setField("height_m", Number(e.target.value))}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Descripción</Label>
            <Textarea
              value={form.description ?? ""}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Descripción pública (opcional)"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Tiene luces</Label>

            <div className="flex w-full items-center justify-between rounded-md border px-4 py-3">
              <span className="text-sm text-muted-foreground">
                {form.hasLights ? "Sí" : "No"}
              </span>

              <Switch
                checked={form.hasLights}
                onCheckedChange={(v) => setField("hasLights", v)}
              />
            </div>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Tipo de vista</Label>
            <select
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.viewType ?? ""}
              onChange={(e) => setField("viewType", e.target.value as any)}
            >
              <option value="">Seleccionar</option>
              <option value="Vista natural">Vista natural</option>
              <option value="Vista cruzada">Vista cruzada</option>
            </select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Comentarios</Label>
            <Textarea
              value={form.comments ?? ""}
              onChange={(e) => setField("comments", e.target.value)}
              placeholder="Notas internas (opcional)"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Imágenes</Label>

            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImagesChange}
              disabled={createSpaceMutation.isPending}
            />

            <p className="text-xs text-muted-foreground">
              Puedes subir hasta 5 imágenes (JPG/PNG/WebP).
            </p>

            {imagePreviews.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {imagePreviews.map((src, idx) => (
                  <div
                    key={src}
                    className="relative overflow-hidden rounded-md border"
                  >
                    <img
                      src={src}
                      alt={`Imagen ${idx + 1}`}
                      className="h-28 w-full object-cover"
                    />
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
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={createSpaceMutation.isPending}
          >
            Cancelar
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={createSpaceMutation.isPending}
          >
            {createSpaceMutation.isPending ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
