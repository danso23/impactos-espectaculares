import { apiFetch } from "@/lib/services/clientService"
import type { GroundProperty, GroundRentContract, GroundRentPayment, GroundRentReportParams, GroundRentReportResponse, GroundRentalsResponse } from "@/types/GroundRent"

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

export function updateGroundRentPaymentAmount(id: number, payload: { amount: number; apply_to_following?: boolean }) {
  return apiFetch<{ data: GroundRentPayment; updated: number; message: string }>(`/api/ground-rent-payments/${id}/amount`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
}

export function getGroundRentPaymentsReport(params: GroundRentReportParams) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== "") query.set(key, String(value)) })
  return apiFetch<GroundRentReportResponse>(`/api/ground-rent-payments/report?${query.toString()}`)
}
