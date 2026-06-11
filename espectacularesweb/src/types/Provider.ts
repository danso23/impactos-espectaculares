import type { ApiListResponse, ApiResponse } from "@/types/Api"

export type ProviderRecord = {
  id: number
  name: string
  contact_name?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  notes?: string | null
  active?: boolean
  created_at?: string | null
  updated_at?: string | null
}

export type ProviderFormValues = {
  name: string
  contact_name: string
  phone: string
  email: string
  address: string
  notes: string
  active: boolean
}

export type ProvidersResponse = ApiListResponse<ProviderRecord>
export type ProviderResponse = ApiResponse<ProviderRecord>
