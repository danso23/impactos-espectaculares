import * as React from "react"
import L from "leaflet"
import type { LatLngLiteral } from "leaflet"
import type { ExistingMarker } from "@/types/Map"
import {
  MapContainer,
  Marker,
  TileLayer,
  useMapEvents,
  LayersControl,
  useMap,
} from "react-leaflet"

import "leaflet/dist/leaflet.css"
import "leaflet-control-geocoder"
import "leaflet-control-geocoder/dist/Control.Geocoder.css"

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png"
import markerIcon from "leaflet/dist/images/marker-icon.png"
import markerShadow from "leaflet/dist/images/marker-shadow.png"

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

// iconos
const normalIcon = L.divIcon({
  className: "",
  html: `<div style="width:14px;height:14px;border-radius:9999px;background:#16a34a;border:3px solid #fff;box-shadow:0 6px 14px rgba(0,0,0,.20)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

const selectedIcon = L.divIcon({
  className: "",
  html: `<div style="width:18px;height:18px;border-radius:9999px;background:#dc2626;border:3px solid #fff;box-shadow:0 6px 14px rgba(0,0,0,.25)"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

type Props = {
  value?: LatLngLiteral
  onChange: (coords: LatLngLiteral) => void
  height?: number
  center?: LatLngLiteral
  zoom?: number
  showLayerToggle?: boolean
  markerDraggable?: boolean
  children?: React.ReactNode

  // para sincronizar lista ↔ mapa
  existingMarkers?: ExistingMarker[]
  selectedMarkerId?: number | null
  onSelectMarker?: (id: number) => void
  focusMarkerId?: number | null
  pickOnMarkerClick?: boolean
}

function ClickHandler({ onPick }: { onPick: (c: LatLngLiteral) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

function LeafletGeocoderControl({
  onSelect,
}: {
  onSelect: (coords: LatLngLiteral, address: string) => void
}) {
  const map = useMap()

  React.useEffect(() => {
    const AnyL = L as any

    if (!AnyL.Control?.Geocoder || !AnyL.Control?.geocoder) {
      console.error(
        "leaflet-control-geocoder NO se cargó (L.Control.Geocoder / L.Control.geocoder undefined). " +
          "Si usas Vite + pnpm, agrega optimizeDeps.include en vite.config.ts."
      )
      return
    }

    const ctrl = AnyL.Control.geocoder({
      geocoder: AnyL.Control.Geocoder.nominatim({
        geocodingQueryParams: { countrycodes: "mx" },
      }),
      placeholder: "Buscar dirección…",
      defaultMarkGeocode: false,
    }).on("markgeocode", (e: any) => {
      const { center, name, bbox } = e.geocode
      map.fitBounds(bbox || L.latLngBounds([center, center]).pad(0.5))
      onSelect({ lat: center.lat, lng: center.lng }, name)
    })

    ctrl.addTo(map)

    return () => {
      map.removeControl(ctrl)
    }
  }, [map, onSelect])

  return null
}

function FocusExistingMarker({ target }: { target?: LatLngLiteral }) {
  const map = useMap()

  React.useEffect(() => {
    if (!target) return
    map.flyTo(target, Math.max(map.getZoom(), 15), { duration: 0.6 })
  }, [target, map])

  return null
}

export function MapPicker({
  value,
  onChange,
  height = 320,
  center = { lat: 20.967, lng: -89.623 }, // Mérida
  zoom = 12,
  showLayerToggle = true,
  markerDraggable = true,
  children,

  existingMarkers = [],
  selectedMarkerId = null,
  onSelectMarker,
  focusMarkerId = null,
  pickOnMarkerClick = false,
}: Props) {
  const mapCenter = value ?? center

  // focus desde lista
  const focusTarget = React.useMemo(() => {
    if (!focusMarkerId) return undefined
    return existingMarkers.find((m) => m.id === focusMarkerId)?.position
  }, [focusMarkerId, existingMarkers])

  return (
    <div style={{ height }} className="overflow-hidden rounded-md border">
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
      >
        <FocusExistingMarker target={focusTarget} />

        {/* Buscador */}
        <LeafletGeocoderControl
          onSelect={(coords, address) => {
            onChange(coords)
            console.log("Dirección:", address)
          }}
        />

        {/* Capas */}
        {showLayerToggle ? (
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
        ) : (
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        )}

        {/* Click en mapa = coords */}
        <ClickHandler onPick={onChange} />

        {/* Markers EXISTENTES */}
        {existingMarkers.map((m) => (
          <Marker
            key={m.id}
            position={m.position}
            icon={m.id === selectedMarkerId ? selectedIcon : normalIcon}
            eventHandlers={{
              click: () => {
                onSelectMarker?.(m.id)
                if (pickOnMarkerClick) onChange(m.position)
              },
            }}
          />
        ))}

        {/* Marker NUEVO */}
        {value ? (
          <Marker
            position={value}
            draggable={markerDraggable}
            eventHandlers={{
              dragend: (e) => {
                const latlng = (e.target as any).getLatLng()
                onChange({ lat: latlng.lat, lng: latlng.lng })
              },
            }}
          />
        ) : null}

        {children}
      </MapContainer>
    </div>
  )
}