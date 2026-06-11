import React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { tokenStore } from "@/lib/auth"
import {
  createProvider,
  deleteProvider,
  getProviders,
  updateProvider,
} from "@/lib/services/providerService"
import type { ProviderFormValues } from "@/types/Provider"
import type { QueryParams } from "@/types/QueryParam"

export function useProviders(params: QueryParams) {
  const access = tokenStore.getAccess()
  const paramsKey = React.useMemo(() => JSON.stringify(params), [params])

  return useQuery({
    queryKey: ["providers", paramsKey],
    queryFn: () => getProviders(params),
    enabled: !!access,
    staleTime: 10_000,
    placeholderData: (prev) => prev,
  })
}

export function useCreateProvider() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ProviderFormValues) => createProvider(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["providers"] })
    },
  })
}

export function useUpdateProvider() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<ProviderFormValues> }) =>
      updateProvider(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["providers"] })
    },
  })
}

export function useDeleteProvider() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteProvider(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["providers"] })
    },
  })
}
