import { apiFetch } from "@/lib/services/clientService"
import type { AuthUser } from "../../types/AuthUser"

export type Role = {
    id: number
    name: string
}

export type UserResponse<T> = {
    success: boolean
    message: string
    data: T
}

export const userService = {
    async getUsers() {
        const response = await apiFetch<UserResponse<(AuthUser & { roles_array: string[] })[]>>('/api/users')
        return response.data
    },

    async getUser(id: number) {
        const response = await apiFetch<UserResponse<AuthUser & { roles_array: string[] }>>(`/api/users/${id}`)
        return response.data
    },

    async createUser(data: Record<string, unknown>) {
        const response = await apiFetch<UserResponse<AuthUser>>('/api/users', {
            method: 'POST',
            body: JSON.stringify(data)
        })
        return response.data
    },

    async updateUser(id: number, data: Record<string, unknown>) {
        const response = await apiFetch<UserResponse<AuthUser>>(`/api/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        })
        return response.data
    },

    async deleteUser(id: number) {
        return apiFetch<UserResponse<unknown>>(`/api/users/${id}`, {
            method: 'DELETE'
        })
    },

    async getRoles() {
        const response = await apiFetch<UserResponse<Role[]>>('/api/roles')
        return response.data
    }
}
