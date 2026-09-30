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
