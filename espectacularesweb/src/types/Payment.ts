import type { ApiListMeta } from "@/types/Api"

export type PaymentMethod = "Efectivo" | "Transferencia" | "Tarjeta" | "Paypal" | "Otro"

export type PaymentEntry = {
  id: number
  amount: number
  method: PaymentMethod
  reference?: string | null
  paid_at: string
}

export type ReceivableRecord = {
  id: number
  rental_id: number
  rental_status?: string | null
  customer_type?: string | null
  customer_id?: number | null
  customer_name: string
  folio?: string | null
  status: "draft" | "issued" | "paid" | "overdue" | "cancelled" | string
  period_start: string
  period_end: string
  due_date?: string | null
  subtotal: number
  tax: number
  total: number
  paid: number
  balance: number
  payments: PaymentEntry[]
}

export type PaymentStats = {
  receivable: number
  overdue: number
  due_this_month: number
  collected_this_month: number
}

export type ReceivablesResponse = {
  data: ReceivableRecord[]
  meta: ApiListMeta
  stats: PaymentStats
}

export type RegisterPaymentPayload = {
  amount: number
  method: PaymentMethod
  reference?: string | null
  paid_at: string
}
