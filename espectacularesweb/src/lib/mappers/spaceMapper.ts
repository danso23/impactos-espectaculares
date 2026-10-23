import type { FilterValues } from "@/types/Filter"
import type { Space, SpaceApi } from "@/types/Space"
import type { QueryParams } from "@/types/QueryParam"
import { env } from "@/config/env"
import { asViewType } from "../helpers/viewTypeHelper"

function resolveSpaceImageUrl(spaceId: number, imageId?: number | null, path?: string | null) {
  const apiBase = env.apiUrl?.replace(/\/+$/, "") ?? ""
  if (apiBase && imageId) return `${apiBase}/api/spaces/${spaceId}/images/${imageId}`
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path

  const cleanPath = path.replace(/^\/+/, "")

  return apiBase ? `${apiBase}/storage/${cleanPath}` : `/storage/${cleanPath}`
}

export function apiToUiStatus(
  active?: boolean | number | string | null,
  isBlockedNow?: boolean | number | string | null
): Space["status"] {
  if (isBlockedNow !== null && isBlockedNow !== undefined) {
    const blocked =
      isBlockedNow === true ||
      isBlockedNow === 1 ||
      isBlockedNow === "1" ||
      isBlockedNow === "true"
    return blocked ? "Bloqueado" : "Disponible"
  }

  const isActive = active === true || active === 1 || active === "1" || active === "true"
  return isActive ? "Disponible" : "Bloqueado"
}

export function apiToUiSpace(r: SpaceApi): Space {
  const images = Array.isArray(r.images) ? r.images : []
  const coverImage = images.find((image) => image.is_cover) ?? images[0] ?? null
  const imageUrls = images
    .map((image) => resolveSpaceImageUrl(r.id, image.id, image.path))
    .filter((url): url is string => Boolean(url))

  return {
    id: r.id,
    title: r.title,
    price: r.price != null ? Number(r.price) : undefined,

    coords: {
      lat: r.latitude != null ? Number(r.latitude) : 0,
      lng: r.longitude != null ? Number(r.longitude) : 0,
    },
    latitude: r.latitude != null ? Number(r.latitude) : null,
    longitude: r.longitude != null ? Number(r.longitude) : null,

    status: apiToUiStatus(r.active, r.is_blocked_now),
    active:
      r.active === true ||
      r.active === 1 ||
      r.active === "1" ||
      r.active === "true",
    is_rotating:
      r.is_rotating === true ||
      r.is_rotating === 1 ||
      r.is_rotating === "1" ||
      r.is_rotating === "true",
    createdAt: r.created_at ? r.created_at.slice(0, 10) : "",
    blocked_from: r.blocked_from?.slice(0, 10) ?? null,
    blocked_until: r.blocked_until?.slice(0, 10) ?? null,
    is_blocked_now:
      r.is_blocked_now === true ||
      r.is_blocked_now === 1 ||
      r.is_blocked_now === "1" ||
      r.is_blocked_now === "true",

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
    imageUrls,
    coverImageUrl: resolveSpaceImageUrl(r.id, coverImage?.id, coverImage?.path),
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

  const rotativo = filters.checks?.rotativo
  if (rotativo !== undefined) params.is_rotating = rotativo ? 1 : 0

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
