import type { ApiListResponse, ApiResponse } from "@/types/Api"

export type CollaboratorRecord = {
  id: number
  name: string
  position?: string | null
  phone?: string | null
  email?: string | null
  notes?: string | null
  active: boolean
  created_at?: string | null
  updated_at?: string | null
}

export type CollaboratorFormValues = {
  name: string
  position: string
  phone: string
  email: string
  notes: string
  active: boolean
}

export type CollaboratorsResponse = ApiListResponse<CollaboratorRecord>
export type CollaboratorResponse = ApiResponse<CollaboratorRecord>
