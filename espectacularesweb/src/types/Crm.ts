import type { ApiListResponse, ApiResponse } from "@/types/Api"

export type LeadPriority = 1 | 2 | 3

export type CrmUser = {
  id: number
  name?: string | null
  username?: string | null
  email?: string | null
}

export type LeadStatus = {
  id: number
  key: string
  name: string
  color?: string | null
  is_final?: boolean
}

export type LeadRecord = {
  id: number
  display_name: string
  full_name: string
  nombre: string
  apellido_paterno?: string | null
  apellido_materno?: string | null
  curp?: string | null
  rfc?: string | null
  negocio?: string | null
  razon_social?: string | null
  giro?: string | null
  email?: string | null
  telefono?: string | null
  telefono_2?: string | null
  direccion?: string | null
  colonia?: string | null
  ciudad?: string | null
  estado?: string | null
  cp?: string | null
  nombre_aval?: string | null
  telefono_aval?: string | null
  direccion_aval?: string | null
  source?: string | null
  priority: LeadPriority
  notes?: string | null
  status?: LeadStatus | null
  assigned_user?: CrmUser | null
  created_at?: string | null
  updated_at?: string | null
}

export type ClientRecord = {
  id: number
  lead_id?: number | null
  display_name: string
  full_name: string
  nombre: string
  apellido_paterno?: string | null
  apellido_materno?: string | null
  curp?: string | null
  rfc?: string | null
  negocio?: string | null
  razon_social?: string | null
  giro?: string | null
  email?: string | null
  telefono?: string | null
  telefono_2?: string | null
  direccion?: string | null
  colonia?: string | null
  ciudad?: string | null
  estado?: string | null
  cp?: string | null
  nombre_aval?: string | null
  telefono_aval?: string | null
  direccion_aval?: string | null
  source?: string | null
  notes?: string | null
  usuario?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export type CrmBaseFormValues = {
  nombre: string
  apellido_paterno: string
  apellido_materno: string
  curp: string
  rfc: string
  negocio: string
  razon_social: string
  giro: string
  email: string
  telefono: string
  telefono_2: string
  direccion: string
  colonia: string
  ciudad: string
  estado: string
  cp: string
  nombre_aval: string
  telefono_aval: string
  direccion_aval: string
  source: string
  notes: string
}

export type LeadFormValues = CrmBaseFormValues & {
  lead_status_id?: number | null
  assigned_to?: number | null
  priority?: LeadPriority
}

export type ClientFormValues = CrmBaseFormValues

export type LeadCatalogs = {
  statuses: LeadStatus[]
  users: CrmUser[]
}

export type LeadCatalogsResponse = ApiResponse<LeadCatalogs>
export type LeadsResponse = ApiListResponse<LeadRecord>
export type ClientsResponse = ApiListResponse<ClientRecord>
export type LeadResponse = ApiResponse<LeadRecord>
export type ClientResponse = ApiResponse<ClientRecord>

export type ConvertLeadToClientResponse = ApiResponse<{
  lead: LeadRecord
  client: ClientRecord
}>
