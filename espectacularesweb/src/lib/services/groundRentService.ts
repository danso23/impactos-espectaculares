import { apiFetch } from "@/lib/services/clientService"
import type { GroundProperty, GroundRentContract, GroundRentPayment, GroundRentalsResponse } from "@/types/GroundRent"

export function getGroundRentals(caseroId: number) {
  return apiFetch<GroundRentalsResponse>(`/api/caseros/${caseroId}/ground-rentals`)
}

export function getAvailableGroundRentSpaces() {
  return apiFetch<{ data: Array<{ id: number; title: string }> }>("/api/ground-rent-available-spaces")
}

export function createGroundProperty(caseroId: number, payload: { name: string; address?: string; notes?: string; space_ids: number[] }) {
  return apiFetch<{ data: GroundProperty }>(`/api/caseros/${caseroId}/ground-properties`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
}

export function createGroundRentContract(payload: { ground_property_id: number; contract_number: string; starts_at: string; first_payment_date: string; payment_frequency: "monthly" | "quarterly" | "semiannual" | "annual"; payment_count: number; payment_amount: number; notes?: string }) {
  return apiFetch<{ data: GroundRentContract }>("/api/ground-rent-contracts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
}

export function markGroundRentPaymentPaid(id: number, payload?: { paid_at?: string; reference?: string }) {
  return apiFetch<{ data: GroundRentPayment }>(`/api/ground-rent-payments/${id}/mark-paid`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload ?? {}) })
}
