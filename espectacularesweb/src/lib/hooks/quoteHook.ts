import React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { tokenStore } from "@/lib/auth"
import {
  changeQuoteStatus,
  convertQuoteToRental,
  createQuote,
  getQuoteHistory,
  getQuoteCatalogs,
  updateQuoteConfiguration,
  getQuotes,
  previewQuote,
  searchQuoteCustomers,
} from "@/lib/services/quoteService"
import type {
  QuoteCreateRequest,
  QuoteListParams,
  QuotePayload,
  QuoteConfigurationUpdatePayload,
  QuoteConvertToRentalPayload,
  QuoteStatusChangePayload,
  SearchableCustomerType,
} from "@/types/Quote"

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
  const searchQuery = deferredQuery.length >= 2 ? deferredQuery : ""

  return useQuery({
    queryKey: ["quotes", "customers", type, searchQuery],
    queryFn: () => searchQuoteCustomers({ q: searchQuery, type }),
    enabled: enabled && !!access && (searchQuery.length === 0 || searchQuery.length >= 2),
    staleTime: 15_000,
  })
}

export function useQuotePreview() {
  return useMutation({
    mutationFn: (payload: QuotePayload) => previewQuote(payload),
  })
}

export function useQuoteHistory(id: number | null, enabled = true) {
  const access = tokenStore.getAccess()

  return useQuery({
    queryKey: ["quotes", "history", id],
    queryFn: () => getQuoteHistory(id as number),
    enabled: enabled && !!access && !!id,
    staleTime: 10_000,
  })
}

export function useCreateQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: QuoteCreateRequest) => createQuote(request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["quotes"] })
    },
  })
}

export function useUpdateQuoteConfiguration() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: QuoteConfigurationUpdatePayload) => updateQuoteConfiguration(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["quotes", "catalogs"] })
    },
  })
}

export function useChangeQuoteStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: QuoteStatusChangePayload }) =>
      changeQuoteStatus(id, payload),
    onSuccess: async (_response, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["quotes"] }),
        queryClient.invalidateQueries({ queryKey: ["quotes", "history", Number(variables.id)] }),
      ])
    },
  })
}

export function useConvertQuoteToRental() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload?: QuoteConvertToRentalPayload }) =>
      convertQuoteToRental(id, payload),
    onSuccess: async (_response, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["quotes"] }),
        queryClient.invalidateQueries({ queryKey: ["quotes", "history", Number(variables.id)] }),
      ])
    },
  })
}
