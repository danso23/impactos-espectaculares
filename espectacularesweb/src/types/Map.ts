import type { LatLngLiteral } from "leaflet"

export type ExistingMarker = {
  id: number
  position: LatLngLiteral
  title?: string
}

export type ExistingSpacePoint = {
    latitude: number
    longitude: number
    weight?: number
};