import { apiFetch } from "@/lib/services/clientService"
import type {
  ClientFormValues,
  ClientResponse,
  ClientsResponse,
  ConvertLeadToClientResponse,
  LeadCatalogsResponse,
  LeadFormValues,
  LeadResponse,
  LeadsResponse,
} from "@/types/Crm"
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

export function getLeadCatalogs() {
  return apiFetch<LeadCatalogsResponse>("/api/lead-catalogs")
}

export function getLeads(params?: QueryParams) {
  return apiFetch<LeadsResponse>(`/api/leads${toQueryString(params)}`)
}

export function createLead(payload: LeadFormValues) {
  return apiFetch<LeadResponse>("/api/leads", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
}

export function convertLeadToClient(id: number) {
  return apiFetch<ConvertLeadToClientResponse>(`/api/leads/${id}/convert-to-client`, {
    method: "POST",
  })
}

export function getClients(params?: QueryParams) {
  return apiFetch<ClientsResponse>(`/api/clientes${toQueryString(params)}`)
}

export function createClient(payload: ClientFormValues) {
  return apiFetch<ClientResponse>("/api/clientes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
}
