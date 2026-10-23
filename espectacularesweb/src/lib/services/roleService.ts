import { apiFetch } from "@/lib/services/clientService"

export interface Role {
  id: number
  name: string
  permissions: string[]
}

export type PermissionAction = "view" | "edit" | "delete"

export interface PermissionModule {
  key: string
  label: string
  permissions: Record<PermissionAction, string>
}

export interface PermissionCatalog {
  actions: Record<PermissionAction, string>
  modules: PermissionModule[]
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

  async getPermissionCatalog() {
    const res = await apiFetch<RoleResponse<PermissionCatalog>>("/api/role-permissions")
    return res.data
  },

  async create(name: string, permissions: string[]) {
    return await apiFetch<RoleResponse<Role>>("/api/roles", {
      method: "POST",
      body: JSON.stringify({ name, permissions }),
    })
  },

  async update(id: number, name: string, permissions: string[]) {
    return await apiFetch<RoleResponse<Role>>(`/api/roles/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name, permissions }),
    })
  },

  async delete(id: number) {
    return await apiFetch<RoleResponse<unknown>>(`/api/roles/${id}`, {
      method: "DELETE",
    })
  },
}
