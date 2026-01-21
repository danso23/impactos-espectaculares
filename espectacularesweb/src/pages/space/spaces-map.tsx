import * as React from "react"
import L from "leaflet"
import { MapContainer, Marker, Popup, TileLayer, LayersControl, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"

type Space = {
  id: number
  title: string
  price?: number
  coords: { lat: number; lng: number }
}

function FocusOnSelected({ selected }: { selected: Space | null }) {
  const map = useMap()

  React.useEffect(() => {
    if (!selected) return
    map.flyTo(selected.coords, Math.max(map.getZoom(), 15), { duration: 0.7 })
  }, [selected, map])

  return null
}

// Iconos simple: normal vs seleccionado
const iconNormal = new L.DivIcon({
  className: "marker-normal",
  html: `<div class="pin"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

const iconSelected = new L.DivIcon({
  className: "marker-selected",
  html: `<div class="pin"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

export function SpacesMap({
  spaces,
  selected,
  selectedId,
  onSelect,
}: {
  spaces: Space[]
  selected: Space | null
  selectedId: number | null
  onSelect: (id: number) => void
}) {
  const center = selected?.coords ?? { lat: 20.967, lng: -89.623 }

  return (
    <div className="h-[560px] overflow-hidden rounded-md border">
      <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%" }}>
        <FocusOnSelected selected={selected} />

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

        {spaces.map((s) => (
          <Marker
            key={s.id}
            position={s.coords}
            icon={s.id === selectedId ? iconSelected : iconNormal}
            eventHandlers={{
              click: () => onSelect(s.id),
            }}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-medium">{s.title}</div>
                {s.price ? <div>${s.price.toLocaleString()} MXN</div> : null}
                <div className="opacity-70">
                  {s.coords.lat.toFixed(5)}, {s.coords.lng.toFixed(5)}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* CSS rápido para el pin */}
      <style>{`
        .marker-normal .pin,
        .marker-selected .pin{
          width: 100%;
          height: 100%;
          border-radius: 9999px;
          border: 2px solid white;
          box-shadow: 0 6px 14px rgba(0,0,0,.25);
          background: #16a34a;
        }
        .marker-selected .pin{
          background: #dc2626;
          transform: scale(1.15);
        }
      `}</style>
    </div>
  )
}