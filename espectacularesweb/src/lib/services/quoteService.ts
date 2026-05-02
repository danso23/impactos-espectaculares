import { apiFetch } from "@/lib/services/clientService"
import type {
  QuoteCatalogsResponse,
  QuoteCustomerSearchResponse,
  QuoteListParams,
  QuoteListResponse,
  QuotePayload,
  QuotePreviewResponse,
  QuoteResponse,
  QuoteConvertToRentalPayload,
  QuoteStatusChangePayload,
  QuoteStatusHistoryResponse,
  SearchableCustomerType,
} from "@/types/Quote"

export function getQuoteCatalogs() {
  return apiFetch<QuoteCatalogsResponse>("/api/quote-catalogs")
}

export function getQuotes(params: QuoteListParams = {}) {
  const qs = new URLSearchParams()

  if (params.page) qs.set("page", String(params.page))
  if (params.per_page) qs.set("per_page", String(params.per_page))
  if (params.q) qs.set("q", params.q)
  if (params.status !== undefined && params.status !== null && params.status !== "") {
    qs.set("status", String(params.status))
  }

  const query = qs.toString()

  return apiFetch<QuoteListResponse>(`/api/quotes${query ? `?${query}` : ""}`)
}

export function getQuote(id: number | string) {
  return apiFetch<QuoteResponse>(`/api/quotes/${id}`)
}

export function getQuoteHistory(id: number | string) {
  return apiFetch<QuoteStatusHistoryResponse>(`/api/quotes/${id}/history`)
}

export function searchQuoteCustomers(params: {
  q: string
  type: SearchableCustomerType
}) {
  const qs = new URLSearchParams({
    q: params.q,
    type: params.type,
  }).toString()

  return apiFetch<QuoteCustomerSearchResponse>(`/api/customers/search?${qs}`)
}

export function previewQuote(payload: QuotePayload) {
  return apiFetch<QuotePreviewResponse>("/api/quotes/preview", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
}

export function createQuote(payload: QuotePayload) {
  return apiFetch<QuoteResponse>("/api/quotes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
}

export function changeQuoteStatus(id: number | string, payload: QuoteStatusChangePayload) {
  return apiFetch<QuoteResponse>(`/api/quotes/${id}/status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
}

export function convertQuoteToRental(id: number | string, payload?: QuoteConvertToRentalPayload) {
  return apiFetch<QuoteResponse>(`/api/quotes/${id}/convert-to-rental`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload ?? {}),
  })
}
