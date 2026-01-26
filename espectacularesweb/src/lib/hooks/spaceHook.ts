import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useQuery } from "@tanstack/react-query"
import { createSpace, getSpaceCoords, getSpaces } from "@/lib/services/spaceService"
import { tokenStore } from "../auth"
import type { SpaceFormValues } from "@/types/Space"
import type { FilterValues } from "@/types/Filter"
import React from "react"

export function useSpaceCoords() {
  const access = tokenStore.getAccess()

  return useQuery({
    queryKey: ["spaces", "coords"],
    queryFn: getSpaceCoords,
    enabled: !!access,
    staleTime: 30_000,
    retry: (count, err: any) => {
      const msg = String(err?.message ?? "")
      if (msg.includes("401")) return false
      return count < 2
    },
  })
}

export function useCreateSpace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SpaceFormValues & { images?: File[] }) => createSpace(payload),
    
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["spaces"] })
      await queryClient.invalidateQueries({
        queryKey: ["spaces", "coords"],
      })
    },
  })
}

export function useSpaces(filters: FilterValues, page: number, perPage: number) {
    const access = tokenStore.getAccess()
    const params = React.useMemo(() => buildSpacesParams(filters, page, perPage), [filters, page, perPage])

    return useQuery({
      queryKey: ["spaces", "index", params],
      queryFn: () => getSpaces(params),
      enabled: !!access,
      staleTime: 10_000,
      placeholderData: (prev) => prev,
    })
}


function buildSpacesParams(filters: FilterValues, page: number, perPage: number) {
  const params: Record<string, string> = {
    page: String(page),
    perPage: String(perPage),
  }


  // si luego implementas filtros en backend, aquí se mandan:
  if (filters.dateFrom) params["date_from"] = filters.dateFrom
  if (filters.dateTo) params["date_to"] = filters.dateTo


  const tipo = filters.selects?.["tipo"]
  if (tipo) params["type"] = String(tipo)


  const ubicacion = filters.selects?.["ubicacion"]
  if (ubicacion) params["location"] = String(ubicacion)


  const activo = filters.checks?.["activo"]
  if (activo !== undefined) params["active"] = activo ? "1" : "0"


  const pagado = filters.checks?.["pagado"]
  if (pagado !== undefined) params["paid"] = pagado ? "1" : "0"


  return params
}