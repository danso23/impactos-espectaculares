import type { ApiListResponse, ApiResponse } from "@/types/Api"

export type CaseroRecord = {
  id: number
  nombre: string
  apellido_paterno?: string | null
  apellido_materno?: string | null
  telefono?: string | null
  telefono_2?: string | null
  email?: string | null
  rfc?: string | null
  curp?: string | null
  direccion?: string | null
  colonia?: string | null
  ciudad?: string | null
  estado?: string | null
  cp?: string | null
  monto_renta?: number | null
  periodicidad?: string | null
  metodo_pago?: string | null
  banco?: string | null
  cuenta_banco?: string | null
  clabe?: string | null
  notes?: string | null
  active?: boolean
  created_at?: string | null
  updated_at?: string | null
}

export type CaseroFormValues = {
  nombre: string
  apellido_paterno: string
  apellido_materno: string
  telefono: string
  telefono_2: string
  email: string
  rfc: string
  curp: string
  direccion: string
  colonia: string
  ciudad: string
  estado: string
  cp: string
  monto_renta: string
  periodicidad: string
  metodo_pago: string
  banco: string
  cuenta_banco: string
  clabe: string
  notes: string
  active: boolean
}

export type CaserosResponse = ApiListResponse<CaseroRecord>
export type CaseroResponse = ApiResponse<CaseroRecord>
