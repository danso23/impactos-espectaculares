import { apiFetch } from "@/lib/services/clientService"
import type { QueryParams } from "@/types/QueryParam"
import type { RentalFormValues, RentalResponse, RentalsResponse } from "@/types/Rental"

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

export function getRentals(params?: QueryParams) {
  return apiFetch<RentalsResponse>(`/api/rentals${toQueryString(params)}`)
}

export function createRental(payload: RentalFormValues) {
  return apiFetch<RentalResponse>("/api/rentals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

export function updateRental(id: number, payload: Partial<RentalFormValues>) {
  return apiFetch<RentalResponse>(`/api/rentals/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

export function deleteRental(id: number) {
  return apiFetch<{ message: string }>(`/api/rentals/${id}`, {
    method: "DELETE",
  })
}
