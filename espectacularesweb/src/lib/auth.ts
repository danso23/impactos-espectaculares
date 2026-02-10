export type AuthUser = unknown

// --- Tokens  ---
export const tokenStore = {
  getAccess() {
    return localStorage.getItem("access_token") || ""
  },
  setAccess(token: string) {
    localStorage.setItem("access_token", token)
  },
  getRefresh() {
    return localStorage.getItem("refresh_token") || ""
  },
  setRefresh(token: string) {
    localStorage.setItem("refresh_token", token)
  },
  clear() {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("user")
    localStorage.removeItem("token") // legacy
  },
}

// --- Helpers usados por la app ---
export function isAuthenticated() {
  return !!(tokenStore.getAccess() || localStorage.getItem("token"))
}

export function getToken() {
  return tokenStore.getAccess() || localStorage.getItem("token") || ""
}

export function setToken(accessToken: string) {
  tokenStore.setAccess(accessToken)
  localStorage.setItem("token", accessToken)
}

export function getUser(): AuthUser | null {
  const raw = localStorage.getItem("user")
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function setUser(user: AuthUser) {
  localStorage.setItem("user", JSON.stringify(user))
}

export function clearAuth() {
  tokenStore.clear()
}