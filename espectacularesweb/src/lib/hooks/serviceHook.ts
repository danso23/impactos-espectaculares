import React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { tokenStore } from "@/lib/auth"
import { createService, deleteService, getServices, updateService } from "@/lib/services/serviceService"
import type { QueryParams } from "@/types/QueryParam"
import type { ServiceFormValues } from "@/types/Service"

export function useServices(params: QueryParams) {
  const key = React.useMemo(() => JSON.stringify(params), [params])
  return useQuery({ queryKey: ["services", key], queryFn: () => getServices(params), enabled: !!tokenStore.getAccess(), staleTime: 10_000, placeholderData: (previous) => previous })
}

function useRefreshServices() {
  const client = useQueryClient()
  return () => client.invalidateQueries({ queryKey: ["services"] })
}

export function useCreateService() {
  const refresh = useRefreshServices()
  return useMutation({ mutationFn: createService, onSuccess: refresh })
}

export function useUpdateService() {
  const refresh = useRefreshServices()
  return useMutation({ mutationFn: ({ id, payload }: { id: number; payload: Partial<ServiceFormValues> }) => updateService(id, payload), onSuccess: refresh })
}

export function useDeleteService() {
  const refresh = useRefreshServices()
  return useMutation({ mutationFn: deleteService, onSuccess: refresh })
}
