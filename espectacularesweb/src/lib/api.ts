import { env } from "@/config/env"

let isRefreshing = false
let queue: Array<(newToken: string) => void> = []

async function parseJsonSafe(res: Response) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

async function refreshToken(): Promise<string> {
  const refresh = localStorage.getItem("refresh_token")
  if (!refresh) throw new Error("No refresh token")

  const res = await fetch(`${env.apiUrl}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ refresh_token: refresh }),
  })

  const data = await parseJsonSafe(res)

  if (!res.ok) throw new Error(data?.message ?? "Refresh failed")

  if (data?.access_token) localStorage.setItem("token", data.access_token)
  if (data?.refresh_token) localStorage.setItem("refresh_token", data.refresh_token)

  return data.access_token as string
}

function forceLogoutToLogin() {
  localStorage.removeItem("token")
  localStorage.removeItem("refresh_token")
  localStorage.removeItem("user")

  if (window.location.pathname !== "/login") {
    window.location.replace("/login")
  }
}

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const doFetch = async (overrideToken?: string) => {
    const token = overrideToken ?? localStorage.getItem("token") // access token

    const headers = new Headers(init.headers || {})
    headers.set("Accept", "application/json")

    if (init.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json")
    }

    if (token) headers.set("Authorization", `Bearer ${token}`)

    return fetch(input, { ...init, headers })
  }

  // 1) primer intento
  let res = await doFetch()

  if (res.status !== 401) return res

  // 2) 401 => intentar refresh (single-flight)
  if (!isRefreshing) {
    isRefreshing = true
    try {
      const newToken = await refreshToken()
      queue.forEach((cb) => cb(newToken))
      queue = []
    } catch (e) {
      queue = []
      forceLogoutToLogin()
      throw e
    } finally {
      isRefreshing = false
    }
  }

  // 3) esperar refresh y reintentar request original
  return await new Promise<Response>((resolve, reject) => {
    queue.push(async (newToken) => {
      try {
        res = await doFetch(newToken)
        if (res.status === 401) {
          forceLogoutToLogin()
          reject(new Error("Unauthorized"))
          return
        }
        resolve(res)
      } catch (err) {
        reject(err)
      }
    })
  })
}