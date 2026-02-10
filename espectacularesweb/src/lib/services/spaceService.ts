import { apiFetch } from "@/lib/services/clientService"
import type { Space, SpaceFormValues, SpaceApi } from "@/types/Space"
import type { ApiListResponse, ApiResponse } from "@/types/Api"
import type { QueryParams } from "@/types/QueryParam"

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

export function getSpaces(params?: QueryParams) {
  const qs = params
    ? `?${new URLSearchParams(
        Object.fromEntries(
          Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== null)
            .map(([k, v]) => [k, String(v)])
        )
      ).toString()}`
    : ""
  return apiFetch<ApiListResponse<SpaceApi>>(`/api/spaces${qs}`)
}

export function createSpace(payload: SpaceFormValues) {
  const fd = new FormData()

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return

    // imágenes
    if (key === "images" && Array.isArray(value)) {
      value.forEach((file) => fd.append("images[]", file))
      return
    }

    // Booleans → 1 / 0
    if (typeof value === "boolean") {
      fd.append(key, value ? "1" : "0")
      return
    }

    // Números string
    if (typeof value === "number") {
      fd.append(key, value.toString())
      return
    }

    // Strings u otros
    fd.append(key, String(value))
  })

  return apiFetch<ApiResponse<Space>>("/api/spaces", {
    method: "POST",
    body: fd,
  })
}
