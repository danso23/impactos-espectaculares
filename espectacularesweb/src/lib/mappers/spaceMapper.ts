import type { FilterValues } from "@/types/Filter"
import type { Space, SpaceApi } from "@/types/Space"

export function apiToUiStatus(active?: boolean | number | string | null): Space["status"] {
  const isActive = active === true || active === 1 || active === "1" || active === "true"
  return isActive ? "Disponible" : "Bloqueado"
}

export function apiToUiSpace(r: SpaceApi): Space {
  return {
    id: r.id,
    title: r.title,
    price: r.price ?? undefined,
    coords: { lat: Number(r.latitude ?? 0), lng: Number(r.longitude ?? 0) },
    status: apiToUiStatus(r.active as any),
    createdAt: (r.created_at ?? "").slice(0, 10),

    assigned_id: (r as any).assigned_id ?? undefined,
    faces: (r as any).faces ?? undefined,
    has_lights:
      (r as any).has_lights === true || (r as any).has_lights === 1 || (r as any).has_lights === "1",
    viewType: (r as any).view_type ?? undefined,
  }
}

export function buildSpacesParams(
  filters: FilterValues,
  page: number,
  perPage: number,
  search?: string
) {
  const params: Record<string, any> = {
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
  if (estatus === "bloqueado") params.active = 0

  // Checkboxes
  const activo = filters.checks?.activo
  if (activo === true) params.active = 1

  return params
}