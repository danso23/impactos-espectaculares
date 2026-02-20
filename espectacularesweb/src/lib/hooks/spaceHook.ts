import React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createSpace, getSpaceCoords, getSpaces } from "@/lib/services/spaceService"
import { tokenStore } from "../auth"
import type { SpaceFormValues } from "@/types/Space"
import type { QueryParams } from "@/types/QueryParam"
import { updateSpace } from "@/lib/services/spaceService"

export function useSpaceCoords() {
  const access = tokenStore.getAccess()

  return useQuery({
    queryKey: ["spaces", "coords"],
    queryFn: getSpaceCoords,
    enabled: !!access,
    staleTime: 30_000,
    retry: (count, err: unknown) => {
      const msg =
      err instanceof Error
        ? err.message
        : typeof err === "string"
          ? err
          : ""
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
      await queryClient.invalidateQueries({ queryKey: ["spaces", "coords"] })
    },
  })
}

/**
 * Hook de listado: recibe params ya listos (page, per_page, q, filtros...)
 */
export function useSpaces(params: QueryParams) {
  const access = tokenStore.getAccess()
  const paramsKey = React.useMemo(() => JSON.stringify(params), [params])

  return useQuery({
    queryKey: ["spaces", "index", paramsKey],
    queryFn: () => getSpaces(params),
    enabled: !!access,
    staleTime: 10_000,
    placeholderData: (prev) => prev,
  })
}

export function useUpdateSpace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: SpaceFormValues & { images?: File[] }
    }) => updateSpace(id, payload),

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["spaces"] })
      await queryClient.invalidateQueries({ queryKey: ["spaces", "coords"] })
    },
  })
}
