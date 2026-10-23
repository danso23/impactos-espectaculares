import { apiFetch } from "@/lib/services/clientService"
import type { CollaboratorFormValues, CollaboratorResponse, CollaboratorsResponse } from "@/types/Collaborator"
import type { QueryParams } from "@/types/QueryParam"

function queryString(params?: QueryParams) {
  if (!params) return ""
  const search = new URLSearchParams(Object.fromEntries(Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => [key, String(value)])))
  return search.size ? `?${search}` : ""
}

export const getCollaborators = (params?: QueryParams) =>
  apiFetch<CollaboratorsResponse>(`/api/collaborators${queryString(params)}`)

export const createCollaborator = (payload: CollaboratorFormValues) =>
  apiFetch<CollaboratorResponse>("/api/collaborators", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  })

export const updateCollaborator = (id: number, payload: Partial<CollaboratorFormValues>) =>
  apiFetch<CollaboratorResponse>(`/api/collaborators/${id}`, {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  })

export const deleteCollaborator = (id: number) =>
  apiFetch<{ message: string }>(`/api/collaborators/${id}`, { method: "DELETE" })
