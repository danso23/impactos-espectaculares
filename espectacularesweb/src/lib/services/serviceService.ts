import { apiFetch } from "@/lib/services/clientService"
import type { QueryParams } from "@/types/QueryParam"
import type { ServiceFormValues, ServiceResponse, ServicesResponse } from "@/types/Service"

function queryString(params?: QueryParams) {
  if (!params) return ""
  const search = new URLSearchParams(Object.fromEntries(Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => [key, String(value)])))
  return search.size ? `?${search}` : ""
}

export const getServices = (params?: QueryParams) =>
  apiFetch<ServicesResponse>(`/api/services${queryString(params)}`)

export const createService = (payload: ServiceFormValues) =>
  apiFetch<ServiceResponse>("/api/services", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  })

export const updateService = (id: number, payload: Partial<ServiceFormValues>) =>
  apiFetch<ServiceResponse>(`/api/services/${id}`, {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  })

export const deleteService = (id: number) =>
  apiFetch<{ message: string }>(`/api/services/${id}`, { method: "DELETE" })
