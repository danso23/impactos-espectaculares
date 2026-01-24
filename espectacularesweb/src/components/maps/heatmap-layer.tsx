import * as React from "react"
import { useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet.heat"

type HeatPoint = {
  lat: number
  lng: number
  weight?: number
}

type Props = {
  points: HeatPoint[]
  radius?: number
  blur?: number
  maxZoom?: number
  minOpacity?: number
}

export function HeatmapLayer({
  points,
  radius = 25,
  blur = 15,
  maxZoom = 17,
  minOpacity = 0.3,
}: Props) {
  const map = useMap()

  React.useEffect(() => {
    if (!map) return
    if (!points?.length) return

    // leaflet.heat acepta: [lat, lng, intensity]
    const heatPoints = points.map((p) => [p.lat, p.lng, p.weight ?? 1] as any)

    const heatLayer = (L as any).heatLayer(heatPoints, {
      radius,
      blur,
      maxZoom,
      minOpacity,
    })

    heatLayer.addTo(map)

    return () => {
      map.removeLayer(heatLayer)
    }
  }, [map, points, radius, blur, maxZoom, minOpacity])

  return null
}