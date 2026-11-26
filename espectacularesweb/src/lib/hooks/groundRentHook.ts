import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { GroundRentReportParams } from "@/types/GroundRent"
import { createGroundProperty, createGroundRentContract, getAvailableGroundRentSpaces, getGroundRentals, getGroundRentPaymentsReport, markGroundRentPaymentPaid, updateGroundRentPaymentAmount } from "@/lib/services/groundRentService"

const key = (caseroId: number) => ["caseros", caseroId, "ground-rentals"] as const

export function useGroundRentals(caseroId: number | null) {
  return useQuery({ queryKey: caseroId ? key(caseroId) : ["caseros", "ground-rentals"], queryFn: () => getGroundRentals(caseroId as number), enabled: caseroId !== null })
}

export function useAvailableGroundRentSpaces(enabled: boolean) {
  return useQuery({ queryKey: ["ground-rent-available-spaces"], queryFn: getAvailableGroundRentSpaces, enabled, staleTime: 60_000 })
}

export function useCreateGroundProperty(caseroId: number) {
  const client = useQueryClient()
  return useMutation({ mutationFn: (payload: { name: string; address?: string; notes?: string; space_ids: number[] }) => createGroundProperty(caseroId, payload), onSuccess: async () => { await client.invalidateQueries({ queryKey: key(caseroId) }); await client.invalidateQueries({ queryKey: ["ground-rent-available-spaces"] }); await client.invalidateQueries({ queryKey: ["spaces"] }) } })
}

export function useCreateGroundRentContract(caseroId: number) {
  const client = useQueryClient()
  return useMutation({ mutationFn: createGroundRentContract, onSuccess: () => client.invalidateQueries({ queryKey: key(caseroId) }) })
}

export function useMarkGroundRentPaymentPaid(caseroId: number) {
  const client = useQueryClient()
  return useMutation({ mutationFn: ({ id, paid_at, reference }: { id: number; paid_at?: string; reference?: string }) => markGroundRentPaymentPaid(id, { paid_at, reference }), onSuccess: async () => { await client.invalidateQueries({ queryKey: key(caseroId) }); await client.invalidateQueries({ queryKey: ["caseros", "ground-rent-report"] }) } })
}

export function useUpdateGroundRentPaymentAmount(caseroId: number) {
  const client = useQueryClient()
  return useMutation({ mutationFn: ({ id, amount, apply_to_following }: { id: number; amount: number; apply_to_following?: boolean }) => updateGroundRentPaymentAmount(id, { amount, apply_to_following }), onSuccess: async () => { await client.invalidateQueries({ queryKey: key(caseroId) }); await client.invalidateQueries({ queryKey: ["caseros", "ground-rent-report"] }) } })
}

export function useGroundRentPaymentsReport(params: GroundRentReportParams, enabled: boolean) {
  return useQuery({ queryKey: ["caseros", "ground-rent-report", params], queryFn: () => getGroundRentPaymentsReport(params), enabled, placeholderData: keepPreviousData })
}
