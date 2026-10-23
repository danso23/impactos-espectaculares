import React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { tokenStore } from "@/lib/auth"
import {
  createRental,
  confirmRental,
  deleteRental,
  getRentals,
  updateRental,
} from "@/lib/services/rentalService"
import type { RentalCreatePayload, RentalFormValues } from "@/types/Rental"
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

export function useConfirmRental() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => confirmRental(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["rentals"] })
      void queryClient.invalidateQueries({ queryKey: ["payments"] })
    },
  })
}

export function useCreateRental() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: RentalCreatePayload) => createRental(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["rentals"] })
    },
  })
}

export function useUpdateRental() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<RentalFormValues> }) =>
      updateRental(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["rentals"] })
    },
  })
}

export function useDeleteRental() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteRental(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["rentals"] })
    },
  })
}
