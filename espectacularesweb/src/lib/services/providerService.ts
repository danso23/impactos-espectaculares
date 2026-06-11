import { apiFetch } from "@/lib/services/clientService"
import type { QueryParams } from "@/types/QueryParam"
import type {
  ProviderFormValues,
  ProviderResponse,
  ProvidersResponse,
} from "@/types/Provider"

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

export function getProviders(params?: QueryParams) {
  return apiFetch<ProvidersResponse>(`/api/providers${toQueryString(params)}`)
}

export function createProvider(payload: ProviderFormValues) {
  return apiFetch<ProviderResponse>("/api/providers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

export function updateProvider(id: number, payload: Partial<ProviderFormValues>) {
  return apiFetch<ProviderResponse>(`/api/providers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

export function deleteProvider(id: number) {
  return apiFetch<{ message: string }>(`/api/providers/${id}`, {
    method: "DELETE",
  })
}
