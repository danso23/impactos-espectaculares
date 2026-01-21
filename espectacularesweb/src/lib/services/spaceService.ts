import { apiFetch } from "@/lib/services/clientService"

export type SpaceCoord = {
  id: number
  title?: string
  type?: string | null
  active?: boolean
  latitude: string | number
  longitude: string | number
}

export type SpaceCoordsResponse = {
  data: SpaceCoord[]
}

export function getSpaceCoords() {
  return apiFetch<SpaceCoordsResponse>("/api/spaces/coords")
}

export type CreateSpaceInput = {
  title: string
  description?: string
  comments?: string
  latitude?: number
  longitude?: number
  price?: number
  type?: string
  socioeconomic_level?: string
  width_m?: number
  height_m?: number
  active?: boolean
}

export function createSpace(input: CreateSpaceInput) {
  return apiFetch<{ message: string; data: any }>("/api/spaces", {
    method: "POST",
    body: JSON.stringify(input),
  })
}
