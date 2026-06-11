import React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { tokenStore } from "@/lib/auth"
import {
  createRental,
  deleteRental,
  getRentals,
  updateRental,
} from "@/lib/services/rentalService"
import type { RentalFormValues } from "@/types/Rental"
import type { QueryParams } from "@/types/QueryParam"

export function useRentals(params: QueryParams) {
  const access = tokenStore.getAccess()
  const paramsKey = React.useMemo(() => JSON.stringify(params), [params])

  return useQuery({
    queryKey: ["rentals", paramsKey],
    queryFn: () => getRentals(params),
    enabled: !!access,
    staleTime: 10_000,
    placeholderData: (prev) => prev,
  })
}

export function useCreateRental() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: RentalFormValues) => createRental(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rentals"] })
    },
  })
}

export function useUpdateRental() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<RentalFormValues> }) =>
      updateRental(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rentals"] })
    },
  })
}

export function useDeleteRental() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteRental(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rentals"] })
    },
  })
}
