import React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { tokenStore } from "@/lib/auth"
import {
  createQuote,
  getQuoteCatalogs,
  getQuotes,
  previewQuote,
  searchQuoteCustomers,
} from "@/lib/services/quoteService"
import type { QuoteListParams, QuotePayload, SearchableCustomerType } from "@/types/Quote"

export function useQuoteCatalogs() {
  const access = tokenStore.getAccess()

  return useQuery({
    queryKey: ["quotes", "catalogs"],
    queryFn: getQuoteCatalogs,
    enabled: !!access,
    staleTime: 60_000,
  })
}

export function useQuotes(params: QuoteListParams) {
  const access = tokenStore.getAccess()

  return useQuery({
    queryKey: ["quotes", "list", params],
    queryFn: () => getQuotes(params),
    enabled: !!access,
    staleTime: 30_000,
  })
}

export function useQuoteCustomerSearch(
  query: string,
  type: SearchableCustomerType,
  enabled = true
) {
  const access = tokenStore.getAccess()
  const deferredQuery = React.useDeferredValue(query.trim())

  return useQuery({
    queryKey: ["quotes", "customers", type, deferredQuery],
    queryFn: () => searchQuoteCustomers({ q: deferredQuery, type }),
    enabled: enabled && !!access && deferredQuery.length >= 2,
    staleTime: 15_000,
  })
}

export function useQuotePreview() {
  return useMutation({
    mutationFn: (payload: QuotePayload) => previewQuote(payload),
  })
}

export function useCreateQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: QuotePayload) => createQuote(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["quotes"] })
    },
  })
}
