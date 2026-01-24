import * as React from "react"
import { MapContainer, TileLayer, LayersControl } from "react-leaflet"
import type { LatLngLiteral } from "leaflet"
import { HeatmapLayer } from "@/components/maps/heatmap-layer"

type Space = {
  id: string
  latitude?: number
  longitude?: number
  // impressions?: number
}

type Props = {
  spaces: Space[]
  height?: number
  center?: LatLngLiteral
}

export function SpacesHeatmapMap({
  spaces,
  height = 420,
  center = { lat: 20.967, lng: -89.623 },
}: Props) {
  const points = React.useMemo(
    () =>
      spaces
        .filter((s) => s.latitude != null && s.longitude != null)
        .map((s) => ({
          lat: s.latitude as number,
          lng: s.longitude as number,
          weight: 1,
        })),
    [spaces],
  )

  return (
    <div style={{ height }} className="overflow-hidden rounded-md border">
      <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%" }}>
        <LayersControl position="topleft">
          <LayersControl.BaseLayer checked name="Mapa">
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Satélite">
            <TileLayer
              attribution='Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        <HeatmapLayer points={points} radius={28} blur={18} maxZoom={17} minOpacity={0.35} />
      </MapContainer>
    </div>
  )
}