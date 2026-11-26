import type { ApiResponse } from "@/types/Api"

export type GroundRentPayment = {
  id: number
  installment_number: number
  period_start: string
  period_end: string
  due_date: string
  amount: number | string
  status: "pending" | "paid" | "overdue" | "cancelled"
  paid_at?: string | null
  reference?: string | null
}

export type GroundRentContract = {
  id: number
  contract_number?: string | null
  starts_at: string
  first_payment_date: string
  payment_frequency: "monthly" | "quarterly" | "semiannual" | "annual"
  payment_count: number
  payment_amount: number | string
  status: "active" | "completed" | "cancelled"
  notes?: string | null
  payments: GroundRentPayment[]
}

export type GroundProperty = {
  id: number
  casero_id: number
  name: string
  address?: string | null
  notes?: string | null
  active: boolean
  spaces: Array<{
    id: number
    title: string
    assigned_id?: string | null
    type?: string | null
    view_type?: string | null
    has_lights?: boolean | null
    width_m?: number | string | null
    height_m?: number | string | null
  }>
  contracts: GroundRentContract[]
}

export type GroundRentalsResponse = ApiResponse<GroundProperty[]>

export type GroundRentReportRow = {
  id: number
  month: string
  due_date: string
  period_start: string
  period_end: string
  installment_number: number
  payment_count?: number | null
  amount: number
  status: GroundRentPayment["status"]
  paid_at?: string | null
  reference?: string | null
  contract_id?: number | null
  contract_number?: string | null
  payment_frequency?: GroundRentContract["payment_frequency"] | null
  property_name?: string | null
  property_address?: string | null
  casero_id?: number | null
  casero_name?: string | null
  spaces: Array<{ id: number; assigned_id?: string | null; title: string }>
}

export type GroundRentReportMonth = { month: string; count: number; total: number; paid: number; pending: number }

export type GroundRentReportResponse = {
  data: GroundRentReportRow[]
  months: GroundRentReportMonth[]
  totals: { count: number; total: number; paid: number; pending: number }
}

export type GroundRentReportParams = { from?: string; to?: string; status?: GroundRentPayment["status"]; casero_id?: number }
