import type { ApiListResponse, ApiResponse } from "@/types/Api"

export type PaymentFrequency = "single" | "weekly" | "biweekly" | "monthly"

export type RentalInvoice = {
  id: number
  rental_id: number
  folio?: string | null
  status: "draft" | "issued" | "paid" | "overdue" | "cancelled" | string
  period_start: string
  period_end: string
  due_date?: string | null
  subtotal: number | string
  tax: number | string
  total: number | string
}

export type RentalRecord = {
  id: number
  quote_id?: number | null
  customer_type?: "lead" | "cliente" | "sin_cliente" | null
  customer_id?: number | null
  agency_id?: number | null
  issuer_company_id?: number | null
  created_by?: number | null
  status?: "draft" | "active" | "completed" | "cancelled" | string | null
  starts_at?: string | null
  ends_at?: string | null
  payment_frequency?: PaymentFrequency | null
  first_payment_date?: string | null
  payment_installments?: number | null
  subtotal?: number | null
  tax?: number | null
  total?: number | null
  notes?: string | null
  snapshot_json?: Record<string, unknown> | null
  created_at?: string | null
  updated_at?: string | null
  invoices?: RentalInvoice[]
}

export type RentalFormValues = {
  customer_type: "lead" | "cliente" | "sin_cliente"
  customer_id: string
  agency_id: string
  issuer_company_id: string
  created_by: string
  status: "draft" | "active" | "completed" | "cancelled"
  starts_at: string
  ends_at: string
  subtotal: string
  tax: string
  total: string
  notes: string
}

export type RentalCreateItem = {
  space_id: number
  concept: string
  qty: number
  unit_price: number
}

export type RentalCreatePayload = {
  customer: {
    type: "lead" | "cliente"
    id: number
  }
  issuer_company_id: number
  agency_id?: number | null
  status: "draft" | "active"
  starts_at: string
  ends_at: string
  includes_tax: boolean
  tax_rate: number
  notes?: string | null
  payment: {
    frequency: PaymentFrequency
    first_payment_date: string
  }
  items: RentalCreateItem[]
}

export type RentalsResponse = ApiListResponse<RentalRecord>
export type RentalResponse = ApiResponse<RentalRecord>
