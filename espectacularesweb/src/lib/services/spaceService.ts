import { apiFetch } from "@/lib/services/clientService"
import type { Space, SpaceFormValues, SpaceApi } from "@/types/Space"
import type { ApiListResponse, ApiResponse } from "@/types/Api"

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

export function getSpaces(params?: Record<string, any>) {
  const qs = params ? `?${new URLSearchParams(params as any).toString()}` : ""
  return apiFetch<ApiListResponse<SpaceApi>>(`/api/spaces${qs}`)
}

export function createSpace(payload: SpaceFormValues & { images?: File[] }) {
  const fd = new FormData()

  fd.append("title", payload.title)
  if (payload.description) fd.append("description", payload.description)
  if (payload.comments) fd.append("comments", payload.comments)

  if (payload.latitude !== undefined) fd.append("latitude", String(payload.latitude))
  if (payload.longitude !== undefined) fd.append("longitude", String(payload.longitude))

  // images[]:
  ;(payload.images ?? []).forEach((file) => fd.append("images[]", file))

  return apiFetch<ApiResponse<Space>>("/api/spaces", {
    method: "POST",
    body: fd,
  })
}
