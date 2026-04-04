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

/** CREATE y UPDATE */
function buildSpaceFormData(payload: SpaceFormValues & { images?: File[] }) {
  const fd = new FormData()

  const keyMap: Partial<Record<keyof SpaceFormValues, string>> = {
    viewType: "view_type",
  }

  Object.entries(payload).forEach(([rawKey, value]) => {
    if (value === undefined || value === null) return

    const key = rawKey as keyof SpaceFormValues
    const apiKey = keyMap[key] ?? rawKey

    // imágenes
    if (rawKey === "images" && Array.isArray(value)) {
      value.forEach((file) => fd.append("images[]", file))
      return
    }

    // Booleans
    if (typeof value === "boolean") {
      fd.append(apiKey, value ? "1" : "0")
      return
    }

    // Números
    if (typeof value === "number") {
      fd.append(apiKey, value.toString())
      return
    }

    // Strings u otros
    fd.append(apiKey, String(value))
  })

  return fd
}

/** CREATE */
export function createSpace(payload: SpaceFormValues & { images?: File[] }) {
  const fd = buildSpaceFormData(payload)

  return apiFetch<ApiResponse<Space>>("/api/spaces", {
    method: "POST",
    body: fd,
  })
}

/** UPDATE */
export function updateSpace(
  id: number,
  payload: SpaceFormValues & { images?: File[] }
) {
  const fd = buildSpaceFormData(payload)

  fd.append("_method", "PUT")

  return apiFetch<ApiResponse<Space>>(`/api/spaces/${id}`, {
    method: "POST",
    body: fd,
  })
}