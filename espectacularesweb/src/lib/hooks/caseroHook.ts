import React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { tokenStore } from "@/lib/auth"
import {
  createCasero,
  deleteCasero,
  getCaseros,
  updateCasero,
} from "@/lib/services/caseroService"
import type { CaseroFormValues } from "@/types/Casero"
import type { QueryParams } from "@/types/QueryParam"

export function useCaseros(params: QueryParams) {
  const access = tokenStore.getAccess()
  const paramsKey = React.useMemo(() => JSON.stringify(params), [params])

  return useQuery({
    queryKey: ["caseros", paramsKey],
    queryFn: () => getCaseros(params),
    enabled: !!access,
    staleTime: 10_000,
    placeholderData: (prev) => prev,
  })
}

export function useCreateCasero() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CaseroFormValues) => createCasero(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["caseros"] })
    },
  })
}

export function useUpdateCasero() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<CaseroFormValues> }) =>
      updateCasero(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["caseros"] })
    },
  })
}

export function useDeleteCasero() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteCasero(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["caseros"] })
    },
  })
}
