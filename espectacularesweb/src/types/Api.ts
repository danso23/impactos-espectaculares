export type ApiMessage = {
  message?: string
}

export type ApiError = {
  message: string
  errors?: Record<string, string[]>
}

// "show" y "create/update"
export type ApiResponse<T> = {
message?: string
data: T
}

// listas paginadas (DataTable)
export type ApiListMeta = {
  page: number
  perPage: number
  total: number
  totalPages: number
}

export type ApiListResponse<T = unknown> = {
  data: T[]
  meta: ApiListMeta
}