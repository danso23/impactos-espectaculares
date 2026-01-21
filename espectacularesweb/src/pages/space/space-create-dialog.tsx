import * as React from "react"
import type { LatLngLiteral } from "leaflet"
import type { SpaceFormValues } from "@/types/Space"
import type { ExistingSpacePoint } from "@/types/Map"

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


type Props = {
    existingPoints?: ExistingSpacePoint[]
    onCreated?: (values: SpaceFormValues) => void
};

export function SpaceCreateDialog({ existingPoints = [], onCreated }: Props) {
    const [open, setOpen] = React.useState(false)
    const [showHeat, setShowHeat] = React.useState(true)
    const [selectedExistingId, setSelectedExistingId] = React.useState<
        number | null
    >(null)

    const coordsQuery = useSpaceCoords()
    const coordsData = coordsQuery.data?.data ?? []

    React.useEffect(() => {
        if (open) {
            coordsQuery.refetch()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const [form, setForm] = React.useState<SpaceFormValues>({
        title: "",
        description: "",
        comments: "",
        latitude: undefined,
        longitude: undefined,
    })

    const existingSpaces = React.useMemo(
        () =>
            coordsData.map((p) => ({
                id: p.id, // <-- si tu API no trae id, usamos index (te lo dejo abajo)
                title: p.title ?? `Espacio #${p.id}`,
                coords: { lat: Number(p.latitude), lng: Number(p.longitude) },
                raw: p,
            })),
        [coordsData],
    )

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

    const setField = <K extends keyof SpaceFormValues>(
        key: K,
        value: SpaceFormValues[K],
    ) => {
        setForm((p) => ({ ...p, [key]: value }))
    }

    const handlePick = (c: LatLngLiteral) => {
        setField("latitude", c.lat)
        setField("longitude", c.lng)
    };

    const handleSubmit = () => {
        if (!form.title.trim()) {
            alert("El título es requerido.")
            return
        }

        if (form.latitude === undefined || form.longitude === undefined) {
            alert("Selecciona una ubicación en el mapa.")
            return
        }

        onCreated?.(form)

        // reset y cerrar
        setForm({
            title: "",
            description: "",
            comments: "",
            latitude: undefined,
            longitude: undefined,
        });
        setShowHeat(true)
        setOpen(false)
    };

    const handleCancel = () => {
        setOpen(false)
    };

    const existingMarkers = React.useMemo(() => {
        // si coordsData trae id y title úsalo; si no, usa index
        return coordsData.map((p: any, idx: number) => ({
            id: Number(p.id ?? idx + 1),
            title: String(p.title ?? `Espacio ${p.id ?? idx + 1}`),
            position: { lat: Number(p.latitude), lng: Number(p.longitude) },
        }))
    }, [coordsData])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Agregar</Button>
            </DialogTrigger>

            {/* Scroll dentro del modal */}
            <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto pr-1">
                <DialogHeader>
                    <DialogTitle>Nuevo espacio</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                        <Label>Título</Label>
                        <Input
                            value={form.title}
                            onChange={(e) => setField("title", e.target.value)}
                            placeholder="Ej. Espacio Norte 1"
                        />
                    </div>

                    {/* Header de mapa + switch heat */}
                    <div className="flex items-center justify-between gap-3 sm:col-span-2">
                        <Label>Ubicación en el mapa</Label>

                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                                Ver calor
                            </span>
                            <Switch
                                checked={showHeat}
                                onCheckedChange={setShowHeat}
                            />
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
                                            onClick={() =>
                                                setSelectedExistingId(m.id)
                                            }
                                            className={[
                                                "w-full text-left px-3 py-2 border-b",
                                                active
                                                    ? "bg-green-50 border-l-4 border-l-green-600"
                                                    : "hover:bg-muted",
                                            ].join(" ")}
                                        >
                                            <div className="text-sm font-medium">
                                                {m.title}
                                            </div>
                                            <div className="text-xs opacity-70">
                                                {m.position.lat.toFixed(5)},{" "}
                                                {m.position.lng.toFixed(5)}
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
                                onSelectMarker={(id) =>
                                    setSelectedExistingId(id)
                                }
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
                            Click en un pin existente para activar su item en la
                            lista. Click en un item para centrarlo. Click en el
                            mapa para elegir la ubicación del nuevo espacio.
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
                        <Label>Descripción</Label>
                        <Textarea
                            value={form.description ?? ""}
                            onChange={(e) =>
                                setField("description", e.target.value)
                            }
                            placeholder="Descripción pública (opcional)"
                        />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                        <Label>Comentarios</Label>
                        <Textarea
                            value={form.comments ?? ""}
                            onChange={(e) =>
                                setField("comments", e.target.value)
                            }
                            placeholder="Notas internas (opcional)"
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={handleCancel}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit}>Guardar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
