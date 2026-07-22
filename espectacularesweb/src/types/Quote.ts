import type { ApiListResponse, ApiResponse } from "@/types/Api"

export type CustomerType = "lead" | "cliente" | "sin_cliente"
export type SearchableCustomerType = Exclude<CustomerType, "sin_cliente">
export type QuoteItemType = "rental" | "service"
export type QuoteAmountType = "none" | "percent" | "fixed"

export type QuoteCatalogCompany = {
  id: number
  key: string
  name: string
  legal_name: string
  rfc?: string | null
  default_terms_html?: string | null
}

export type QuoteCatalogLetterhead = {
  id: number
  company_id: number
  name: string
  code?: string | null
  template_key: string
  is_default: boolean
}

export type QuoteCatalogAgency = {
  id: number
  name: string
  discount_type: QuoteAmountType
  discount_value: string | number
  commission_type: QuoteAmountType
  commission_value: string | number
}

export type QuoteCatalogService = {
  id: number
  key: string
  name: string
  description?: string | null
  base_price: string | number
  tax_rate: string | number
}

export type QuoteCatalogConfiguration = {
  id?: number | null
  price_per_square_meter: string | number
}

export type QuoteConfigurationResponse = ApiResponse<QuoteCatalogConfiguration>

export type QuoteConfigurationUpdatePayload = {
  price_per_square_meter: number
}

export type QuoteStatus = {
  id: number
  key: string
  name: string
  color?: string | null
}

export type QuoteStatusActor = {
  id: number
  name?: string | null
  username?: string | null
  email?: string | null
}

export type QuoteImage = {
  id: number
  disk?: string | null
  path: string
  filename?: string | null
  original_name?: string | null
  mime_type?: string | null
  size?: number | null
  is_cover?: boolean
  sort_order?: number
}

export type QuoteRentalSummary = {
  id: number
  status: string
  starts_at?: string | null
  ends_at?: string | null
  total: number
}

export type QuoteCatalogs = {
  companies: QuoteCatalogCompany[]
  letterheads: QuoteCatalogLetterhead[]
  agencies: QuoteCatalogAgency[]
  services: QuoteCatalogService[]
  configuration?: QuoteCatalogConfiguration | null
  statuses: QuoteStatus[]
}

export type QuoteCatalogsResponse = ApiResponse<QuoteCatalogs>

export type QuoteCustomer = {
  type: CustomerType
  id: number | null
  display_name: string
  contact_name?: string | null
  email?: string | null
  phone?: string | null
  rfc?: string | null
}

export type QuoteCustomerSearchResponse = {
  data: QuoteCustomer[]
}

export type QuoteItemInput = {
  item_type: QuoteItemType
  space_id?: number | null
  service_id?: number | null
  concept?: string
  description?: string | null
  start_date?: string | null
  end_date?: string | null
  qty: number
  square_meters?: number
  unit_price: number
  faces?: number | null
  production_cost?: number | null
  notes?: string | null
  sort_order?: number
  discount_applies?: boolean
  tax_rate?: number
}

export type QuotePayload = {
  customer: {
    type: CustomerType
    id?: number | null
  }
  issuer_company_id: number
  letterhead_id?: number | null
  agency_id?: number | null
  valid_until?: string | null
  includes_tax: boolean
  tax_rate: number
  discount: {
    type: QuoteAmountType
    value: number
  }
  commission: {
    type: QuoteAmountType
    value: number
  }
  terms_html?: string | null
  notes?: string | null
  items: QuoteItemInput[]
}

export type QuoteCreateRequest = {
  payload: QuotePayload
  images?: File[]
}

export type QuotePreviewItem = QuoteItemInput & {
  subtotal: number
  discount_allocated: number
  tax_amount: number
  total: number
}

export type QuoteTotals = {
  rentals_subtotal: number
  services_subtotal: number
  subtotal: number
  discount_base: number
  discount_type: QuoteAmountType
  discount_value: number
  discount_amount: number
  commission_base: number
  commission_type: QuoteAmountType
  commission_value: number
  commission_amount: number
  tax: number
  total: number
}

export type QuotePreviewData = {
  customer: QuoteCustomer
  company: QuoteCatalogCompany
  letterhead?: QuoteCatalogLetterhead | null
  agency?: QuoteCatalogAgency | null
  items: QuotePreviewItem[]
  totals: QuoteTotals
  resolved: {
    includes_tax: boolean
    tax_rate: number
    discount: {
      type: QuoteAmountType
      value: number
    }
    commission: {
      type: QuoteAmountType
      value: number
    }
    terms_html?: string | null
  }
}

export type QuotePreviewResponse = ApiResponse<QuotePreviewData>

export type QuoteRecord = {
  id: number
  folio: string
  version: number
  customer_type?: CustomerType | null
  customer_id?: number | null
  customer?: QuoteCustomer | null
  status?: QuoteStatus | null
  company?: QuoteCatalogCompany | null
  letterhead?: QuoteCatalogLetterhead | null
  agency?: QuoteCatalogAgency | null
  includes_tax: boolean
  tax_rate: number
  totals: QuoteTotals
  accepted_at?: string | null
  accepted_by?: QuoteStatusActor | null
  converted_to_rental_at?: string | null
  converted_to_rental_by?: QuoteStatusActor | null
  rental?: QuoteRentalSummary | null
  valid_until?: string | null
  notes?: string | null
  terms_html?: string | null
  pdf_path?: string | null
  pdf_generated_at?: string | null
  created_at?: string | null
  updated_at?: string | null
  items: QuotePreviewItem[]
  images?: QuoteImage[]
}

export type QuoteResponse = ApiResponse<QuoteRecord>

export type QuoteStatusHistoryEntry = {
  id: number
  changed_at?: string | null
  reason?: string | null
  notes?: string | null
  from_status?: QuoteStatus | null
  to_status: QuoteStatus | null
  changed_by?: QuoteStatusActor | null
  meta?: Record<string, unknown> | null
}

export type QuoteStatusHistoryResponse = {
  data: QuoteStatusHistoryEntry[]
}

export type QuoteStatusChangePayload = {
  to_status: string | number
  reason?: string | null
  notes?: string | null
}

export type QuoteConvertToRentalPayload = {
  customer?: {
    type: SearchableCustomerType
    id: number
  } | null
  rental: {
    starts_at: string
    ends_at: string
  }
  payment: {
    frequency: import("@/types/Rental").PaymentFrequency
    first_payment_date: string
  }
}

export type QuoteListParams = {
  page?: number
  per_page?: number
  q?: string
  status?: string | number
}

export type QuoteListResponse = ApiListResponse<QuoteRecord>

export type QuoteCreatePageSpaceSeed = {
  id: number | string
  title: string
  price: number | string
  faces?: number | null
}
