import React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { tokenStore } from "@/lib/auth"
import { getReceivables, registerPayment } from "@/lib/services/paymentService"
import type { QueryParams } from "@/types/QueryParam"
import type { RegisterPaymentPayload } from "@/types/Payment"

export function useReceivables(params: QueryParams) {
  const access = tokenStore.getAccess()
  const paramsKey = React.useMemo(() => JSON.stringify(params), [params])

  return useQuery({
    queryKey: ["payments", "receivables", paramsKey],
    queryFn: () => getReceivables(params),
    enabled: !!access,
    staleTime: 10_000,
    placeholderData: (previous) => previous,
  })
}

export function useRegisterPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ invoiceId, payload }: { invoiceId: number; payload: RegisterPaymentPayload }) => (
      registerPayment(invoiceId, payload)
    ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["payments"] })
      void queryClient.invalidateQueries({ queryKey: ["rentals"] })
    },
  })
}
