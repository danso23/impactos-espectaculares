import { apiFetch } from "@/lib/services/clientService"

export interface Role {
  id: number
  name: string
}

export type RoleResponse<T> = {
    success: boolean
    message: string
    data: T
}

export const roleService = {
  async getAll() {
    const res = await apiFetch<RoleResponse<Role[]>>("/api/roles")
    return res.data
  },

  async create(name: string) {
    return await apiFetch<RoleResponse<Role>>("/api/roles", {
      method: "POST",
      body: JSON.stringify({ name }),
    })
  },

  async update(id: number, name: string) {
    return await apiFetch<RoleResponse<Role>>(`/api/roles/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name }),
    })
  },

  async delete(id: number) {
    return await apiFetch<RoleResponse<unknown>>(`/api/roles/${id}`, {
      method: "DELETE",
    })
  },
}
