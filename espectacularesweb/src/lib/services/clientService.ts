import { tokenStore } from "@/lib/auth"
import { refreshAccessToken } from "../refreshToken"

const API_BASE = import.meta.env.VITE_API_URL ?? ""

let refreshPromise: Promise<string> | null = null

function isJsonResponse(res: Response) {
  return (res.headers.get("content-type") || "").includes("application/json")
}

function logoutHard() {
  tokenStore.clear()
  window.location.href = "/login"
}

async function parseBody(res: Response) {
  if (isJsonResponse(res)) return res.json()
  return res.text()
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`

  const doFetch = async (token?: string) => {
    const access = token ?? tokenStore.getAccess()

    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> ?? {}),
    }

    if (options.body && typeof options.body === "string" && !headers["Content-Type"] && !headers["content-type"]) {
      headers["Content-Type"] = "application/json"
    }

    if (access) {
      headers["Authorization"] = `Bearer ${access}`
    }

    return fetch(url, {
      ...options,
      headers,
    })
  }

  // 1) primer intento
  let res = await doFetch()

  if (res.status !== 401) {
    if (!res.ok) {
      const body = await parseBody(res).catch(() => "")
      throw new Error(body?.message ? body.message : String(body || `Request failed: ${res.status}`))
    }
    return (await parseBody(res)) as T
  }

  // 2) llegó 401 => todas las peticiones comparten la misma renovación.
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null
    })
  }

  let newToken: string
  try {
    newToken = await refreshPromise
  } catch (error) {
    logoutHard()
    throw error
  }

  // 3) reintentar una sola vez con el token renovado.
  res = await doFetch(newToken)
  if (!res.ok) {
    const body = await parseBody(res).catch(() => "")
    throw new Error(body?.message ? body.message : String(body || `Request failed: ${res.status}`))
  }

  return (await parseBody(res)) as T
}
