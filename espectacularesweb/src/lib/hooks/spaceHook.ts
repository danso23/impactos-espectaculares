import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useQuery } from "@tanstack/react-query"
import { createSpace, getSpaceCoords } from "@/lib/services/spaceService"
import { tokenStore } from "../auth"
import type { SpaceFormValues } from "@/types/Space"

export function useSpaceCoords() {
  const access = tokenStore.getAccess()

  return useQuery({
    queryKey: ["spaces", "coords"],
    queryFn: getSpaceCoords,
    enabled: !!access,
    staleTime: 30_000,
    retry: (count, err: any) => {
      // si es 401 no reintentes en loop
      const msg = String(err?.message ?? "")
      if (msg.includes("401")) return false
      return count < 2
    },
  })
}

export function useCreateSpace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SpaceFormValues & { images?: File[] }) =>
    createSpace(payload),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["spaces", "coords"],
      })
    },
  })
}