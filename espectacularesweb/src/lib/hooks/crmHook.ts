import React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { tokenStore } from "@/lib/auth"
import {
  convertLeadToClient,
  createClient,
  createLead,
  getClients,
  getLeadCatalogs,
  getLeads,
} from "@/lib/services/crmService"
import type { ClientFormValues, LeadFormValues } from "@/types/Crm"
import type { QueryParams } from "@/types/QueryParam"

export function useLeadCatalogs() {
  const access = tokenStore.getAccess()

  return useQuery({
    queryKey: ["crm", "lead-catalogs"],
    queryFn: getLeadCatalogs,
    enabled: !!access,
    staleTime: 60_000,
  })
}

export function useLeads(params: QueryParams) {
  const access = tokenStore.getAccess()
  const paramsKey = React.useMemo(() => JSON.stringify(params), [params])

  return useQuery({
    queryKey: ["crm", "leads", paramsKey],
    queryFn: () => getLeads(params),
    enabled: !!access,
    staleTime: 10_000,
    placeholderData: (prev) => prev,
  })
}

export function useClients(params: QueryParams) {
  const access = tokenStore.getAccess()
  const paramsKey = React.useMemo(() => JSON.stringify(params), [params])

  return useQuery({
    queryKey: ["crm", "clients", paramsKey],
    queryFn: () => getClients(params),
    enabled: !!access,
    staleTime: 10_000,
    placeholderData: (prev) => prev,
  })
}

export function useCreateLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: LeadFormValues) => createLead(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["crm", "leads"] })
      await queryClient.invalidateQueries({ queryKey: ["crm", "lead-catalogs"] })
    },
  })
}

export function useCreateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ClientFormValues) => createClient(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["crm", "clients"] })
    },
  })
}

export function useConvertLeadToClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => convertLeadToClient(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["crm", "leads"] })
      await queryClient.invalidateQueries({ queryKey: ["crm", "clients"] })
    },
  })
}
