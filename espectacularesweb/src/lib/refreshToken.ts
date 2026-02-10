import { tokenStore } from "@/lib/auth"

const API_BASE = import.meta.env.VITE_API_URL ?? ""

export async function refreshAccessToken(): Promise<string> {
  const refresh = tokenStore.getRefresh()
  if (!refresh) throw new Error("No refresh_token")

  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ refresh_token: refresh }),
  })

  if (!res.ok) {
    let msg = "Refresh failed"
    try {
      const data = await res.json()
      msg = data?.message ?? msg
    } catch (e){console.log(e)}
    throw new Error(msg)
  }

  const data = await res.json()

  if (data?.access_token) tokenStore.setAccess(data.access_token)
  if (data?.refresh_token) tokenStore.setRefresh(data.refresh_token)

  return data.access_token as string
}