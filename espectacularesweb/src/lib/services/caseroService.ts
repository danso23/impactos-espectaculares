import { apiFetch } from "@/lib/services/clientService"
import type {
  CaseroFormValues,
  CaseroResponse,
  CaserosResponse,
} from "@/types/Casero"
import type { QueryParams } from "@/types/QueryParam"

function toQueryString(params?: QueryParams) {
  if (!params) return ""

  const searchParams = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null && value !== "")
        .map(([key, value]) => [key, String(value)])
    )
  )

  const qs = searchParams.toString()
  return qs ? `?${qs}` : ""
}

export function getCaseros(params?: QueryParams) {
  return apiFetch<CaserosResponse>(`/api/caseros${toQueryString(params)}`)
}

export function createCasero(payload: CaseroFormValues) {
  return apiFetch<CaseroResponse>("/api/caseros", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

export function updateCasero(id: number, payload: Partial<CaseroFormValues>) {
  return apiFetch<CaseroResponse>(`/api/caseros/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

export function deleteCasero(id: number) {
  return apiFetch<{ message: string }>(`/api/caseros/${id}`, {
    method: "DELETE",
  })
}
