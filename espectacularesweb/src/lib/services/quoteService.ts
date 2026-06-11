import { apiFetch } from "@/lib/services/clientService"
import type {
  QuoteCreateRequest,
  QuoteCatalogsResponse,
  QuoteConfigurationResponse,
  QuoteConfigurationUpdatePayload,
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

function appendFormData(fd: FormData, key: string, value: unknown) {
  if (value === undefined || value === null) return

  if (value instanceof File) {
    fd.append(key, value)
    return
  }

  if (typeof value === "boolean") {
    fd.append(key, value ? "1" : "0")
    return
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      appendFormData(fd, `${key}[${index}]`, entry)
    })
    return
  }

  if (typeof value === "object") {
    Object.entries(value as Record<string, unknown>).forEach(([childKey, childValue]) => {
      appendFormData(fd, `${key}[${childKey}]`, childValue)
    })
    return
  }

  fd.append(key, String(value))
}

function buildQuoteFormData(request: QuoteCreateRequest) {
  const fd = new FormData()
  const { payload, images } = request

  appendFormData(fd, "customer", payload.customer)
  appendFormData(fd, "issuer_company_id", payload.issuer_company_id)
  appendFormData(fd, "letterhead_id", payload.letterhead_id)
  appendFormData(fd, "agency_id", payload.agency_id)
  appendFormData(fd, "valid_until", payload.valid_until)
  appendFormData(fd, "includes_tax", payload.includes_tax)
  appendFormData(fd, "tax_rate", payload.tax_rate)
  appendFormData(fd, "discount", payload.discount)
  appendFormData(fd, "commission", payload.commission)
  appendFormData(fd, "terms_html", payload.terms_html)
  appendFormData(fd, "notes", payload.notes)
  appendFormData(fd, "items", payload.items)

  images?.forEach((file) => {
    fd.append("images[]", file)
  })

  return fd
}

export function getQuoteCatalogs() {
  return apiFetch<QuoteCatalogsResponse>("/api/quote-catalogs")
}

export function getQuoteConfiguration() {
  return apiFetch<QuoteConfigurationResponse>("/api/configuration")
}

export function updateQuoteConfiguration(payload: QuoteConfigurationUpdatePayload) {
  return apiFetch<QuoteConfigurationResponse>("/api/configuration", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
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

export function createQuote(request: QuoteCreateRequest) {
  const fd = buildQuoteFormData(request)

  return apiFetch<QuoteResponse>("/api/quotes", {
    method: "POST",
    body: fd,
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
