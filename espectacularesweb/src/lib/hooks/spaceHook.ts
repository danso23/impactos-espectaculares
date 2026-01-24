import { useQuery } from "@tanstack/react-query"
import { getSpaceCoords } from "@/lib/services/spaceService"
import { tokenStore } from "../auth"

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