import React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { tokenStore } from "@/lib/auth"
import { createCollaborator, deleteCollaborator, getCollaborators, updateCollaborator } from "@/lib/services/collaboratorService"
import type { CollaboratorFormValues } from "@/types/Collaborator"
import type { QueryParams } from "@/types/QueryParam"

export function useCollaborators(params: QueryParams) {
  const key = React.useMemo(() => JSON.stringify(params), [params])
  return useQuery({ queryKey: ["collaborators", key], queryFn: () => getCollaborators(params), enabled: !!tokenStore.getAccess(), staleTime: 10_000, placeholderData: (previous) => previous })
}

function useRefreshCollaborators() {
  const client = useQueryClient()
  return () => client.invalidateQueries({ queryKey: ["collaborators"] })
}

export function useCreateCollaborator() {
  const refresh = useRefreshCollaborators()
  return useMutation({ mutationFn: createCollaborator, onSuccess: refresh })
}

export function useUpdateCollaborator() {
  const refresh = useRefreshCollaborators()
  return useMutation({ mutationFn: ({ id, payload }: { id: number; payload: Partial<CollaboratorFormValues> }) => updateCollaborator(id, payload), onSuccess: refresh })
}

export function useDeleteCollaborator() {
  const refresh = useRefreshCollaborators()
  return useMutation({ mutationFn: deleteCollaborator, onSuccess: refresh })
}
