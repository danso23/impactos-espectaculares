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

type HeatLatLngTuple = [number, number, number]

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
    const heatPoints: HeatLatLngTuple[] = points.map((p) => [
      p.lat,
      p.lng,
      p.weight ?? 1,
    ])
    
    const heatLayer = (
      L as unknown as {
        heatLayer: (
          points: HeatLatLngTuple[],
          options: {
            radius?: number
            blur?: number
            maxZoom?: number
            minOpacity?: number
          }
        ) => L.Layer
      }
    ).heatLayer(heatPoints, {
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