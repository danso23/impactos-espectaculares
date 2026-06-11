import type { ApiListResponse, ApiResponse } from "@/types/Api"

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
  subtotal?: number | null
  tax?: number | null
  total?: number | null
  notes?: string | null
  snapshot_json?: Record<string, unknown> | null
  created_at?: string | null
  updated_at?: string | null
}

export type RentalFormValues = {
  quote_id: string
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

export type RentalsResponse = ApiListResponse<RentalRecord>
export type RentalResponse = ApiResponse<RentalRecord>
