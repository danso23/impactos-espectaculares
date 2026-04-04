import type { FilterValues } from "@/types/Filter"
import type { Space, SpaceApi } from "@/types/Space"
import type { QueryParams } from "@/types/QueryParam"
import { env } from "@/config/env"
import { asViewType } from "../helpers/viewTypeHelper"

function resolveSpaceImageUrl(path?: string | null) {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path

  const apiBase = env.apiUrl?.replace(/\/+$/, "") ?? ""
  const cleanPath = path.replace(/^\/+/, "")

  return apiBase ? `${apiBase}/storage/${cleanPath}` : `/storage/${cleanPath}`
}

export function apiToUiStatus(active?: boolean | number | string | null): Space["status"] {
  const isActive = active === true || active === 1 || active === "1" || active === "true"
  return isActive ? "Disponible" : "Bloqueado"
}

export function apiToUiSpace(r: SpaceApi): Space {
  const images = Array.isArray(r.images) ? r.images : []
  const coverImage = images.find((image) => image.is_cover) ?? images[0] ?? null

  return {
    id: r.id,
    title: r.title,
    price: r.price != null ? Number(r.price) : undefined,

    coords: {
      lat: r.latitude != null ? Number(r.latitude) : 0,
      lng: r.longitude != null ? Number(r.longitude) : 0,
    },

    status: apiToUiStatus(r.active),
    createdAt: r.created_at ? r.created_at.slice(0, 10) : "",

    type: r.type ?? null,
    socioeconomic_level: r.socioeconomic_level ?? null,
    width_m: r.width_m != null ? Number(r.width_m) : undefined,
    height_m: r.height_m != null ? Number(r.height_m) : undefined,
    description: r.description ?? null,
    comments: r.comments ?? null,

    assigned_id: r.assigned_id != null ? String(r.assigned_id) : undefined,
    faces: r.faces != null ? Number(r.faces) : undefined,

    has_lights:
      r.has_lights === true ||
      r.has_lights === 1 ||
      r.has_lights === "1",

    viewType: asViewType(r.view_type),
    images,
    coverImageUrl: resolveSpaceImageUrl(coverImage?.path),
  }
}

export function buildSpacesParams(
  filters: FilterValues,
  page: number,
  perPage: number,
  search?: string
) {
  const params: QueryParams = {
    page,
    per_page: perPage,
  }

  // Search (server-side)
  if (search?.trim()) params.q = search.trim()

  // Date range
  if (filters.dateFrom) params.date_from = filters.dateFrom
  if (filters.dateTo) params.date_to = filters.dateTo

  // Dropdowns
  const tipo = filters.selects?.tipo
  if (tipo) params.type = tipo

  const conLuz = filters.selects?.conLuz
  if (conLuz === "1" || conLuz === "0") params.has_lights = conLuz

  const estatus = filters.selects?.estatus
  if (estatus === "disponible") params.active = 1
  else if (estatus === "bloqueado") params.active = 0
  else {
    const activo = filters.checks?.activo
    if (activo === true) params.active = 1
    else if (activo === false) params.active = 0
  }

  // Checkboxes
  const activo = filters.checks?.activo
  if (activo === true) params.active = 1

  return params
}
