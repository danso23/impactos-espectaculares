import React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createSpace, deleteSpace, getSpace, getSpaceCoords, getSpaces, updateSpace } from "@/lib/services/spaceService"
import { tokenStore } from "../auth"
import type { SpaceFormPayload, SpaceFormValues } from "@/types/Space"
import type { QueryParams } from "@/types/QueryParam"

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

export function useSpace(id: number | null) {
  const access = tokenStore.getAccess()

  return useQuery({
    queryKey: ["spaces", "detail", id],
    queryFn: () => getSpace(id as number),
    enabled: !!access && id !== null,
    staleTime: 10_000,
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
      payload: SpaceFormPayload
    }) => updateSpace(id, payload),

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["spaces"] })
      await queryClient.invalidateQueries({ queryKey: ["spaces", "coords"] })
    },
  })
}

export function useDeleteSpace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteSpace(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["spaces"] })
      await queryClient.invalidateQueries({ queryKey: ["spaces", "coords"] })
    },
  })
}
