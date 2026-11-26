import type { ApiListResponse, ApiResponse } from "@/types/Api"

export type ServiceRecord = {
  id: number
  key?: string | null
  name: string
  description?: string | null
  base_price: number | string
  unit?: "pieza" | "m2" | null
  tax_rate: number | string
  is_active: boolean
  created_at?: string | null
  updated_at?: string | null
}

export type ServiceFormValues = {
  key: string
  name: string
  description: string
  base_price: number
  unit: "pieza" | "m2"
  tax_rate: number
  is_active: boolean
}

export type ServicesResponse = ApiListResponse<ServiceRecord>
export type ServiceResponse = ApiResponse<ServiceRecord>
