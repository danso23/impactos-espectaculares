import { apiFetch } from "@/lib/services/clientService"
import type { QueryParams } from "@/types/QueryParam"
import type { ReceivableRecord, ReceivablesResponse, RegisterPaymentPayload } from "@/types/Payment"

function toQueryString(params?: QueryParams) {
  if (!params) return ""
  const searchParams = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null && value !== "")
        .map(([key, value]) => [key, String(value)])
    )
  )
  const query = searchParams.toString()
  return query ? `?${query}` : ""
}

export function getReceivables(params?: QueryParams) {
  return apiFetch<ReceivablesResponse>(`/api/payments${toQueryString(params)}`)
}

export function registerPayment(invoiceId: number, payload: RegisterPaymentPayload) {
  return apiFetch<{
    message: string
    data: { invoice: ReceivableRecord }
  }>(`/api/invoices/${invoiceId}/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}
