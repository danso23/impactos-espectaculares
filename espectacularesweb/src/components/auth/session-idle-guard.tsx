import * as React from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { env } from "@/config/env"
import { clearAuth, getToken } from "@/lib/auth"

const LAST_ACTIVITY_KEY = "espectaculares.session.last_activity"
const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  "pointerdown",
  "keydown",
  "scroll",
  "touchstart",
]
const AUTH_TOKEN_KEYS = new Set(["access_token", "token"])

function inactivityTimeoutMs() {
  const minutes = Number(env.inactivityTimeoutMinutes)
  return Math.max(1, Number.isFinite(minutes) ? minutes : 30) * 60_000
}

async function revokeSession() {
  const token = getToken()
  const refreshToken = localStorage.getItem("refresh_token")

  if (!token || !env.apiUrl) return

  await fetch(`${env.apiUrl.replace(/\/+$/, "")}/api/logout`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ refresh_token: refreshToken || null }),
  })
}

export function SessionIdleGuard() {
  const navigate = useNavigate()
  const timeoutRef = React.useRef<number | null>(null)
  const lastPersistedActivityRef = React.useRef(0)
  const closingRef = React.useRef(false)

  React.useEffect(() => {
    const timeout = inactivityTimeoutMs()

    const storedLastActivity = (fallback = Date.now()) => {
      const stored = Number(localStorage.getItem(LAST_ACTIVITY_KEY))
      return Number.isFinite(stored) && stored > 0 ? stored : fallback
    }

    const closeForInactivity = async () => {
      if (closingRef.current) return
      closingRef.current = true

      try {
        await revokeSession()
      } catch {
        // El cierre local no depende de que el servidor esté disponible.
      } finally {
        clearAuth()
        localStorage.removeItem(LAST_ACTIVITY_KEY)
        toast.info("Tu sesión se cerró por inactividad.")
        navigate("/login", { replace: true })
      }
    }

    const schedule = (lastActivity: number) => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)

      const remaining = timeout - (Date.now() - lastActivity)
      if (remaining <= 0) {
        void closeForInactivity()
        return
      }

      timeoutRef.current = window.setTimeout(() => {
        const latestActivity = storedLastActivity(lastActivity)
        if (Date.now() - latestActivity >= timeout) {
          void closeForInactivity()
          return
        }

        schedule(latestActivity)
      }, remaining)
    }

    const registerActivity = () => {
      if (closingRef.current || document.visibilityState === "hidden") return

      const now = Date.now()
      const previousActivity = storedLastActivity(now)

      // La primera interacción al volver de una pestaña suspendida no debe
      // revivir una sesión que ya superó el tiempo de inactividad.
      if (now - previousActivity >= timeout) {
        void closeForInactivity()
        return
      }

      if (now - lastPersistedActivityRef.current < 1_000) return

      lastPersistedActivityRef.current = now
      localStorage.setItem(LAST_ACTIVITY_KEY, String(now))
      schedule(now)
    }

    const verifyCurrentSession = () => {
      if (closingRef.current || document.visibilityState === "hidden") return

      const lastActivity = storedLastActivity()
      if (Date.now() - lastActivity >= timeout) {
        void closeForInactivity()
        return
      }

      schedule(lastActivity)
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === LAST_ACTIVITY_KEY && event.newValue) {
        const activity = Number(event.newValue)
        if (Number.isFinite(activity)) schedule(activity)
        return
      }

      // Si otra pestaña cerró sesión, esta pestaña también debe salir.
      if (event.key && AUTH_TOKEN_KEYS.has(event.key) && !event.newValue && !getToken()) {
        if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
        navigate("/login", { replace: true })
      }
    }

    const initialActivity = storedLastActivity()

    localStorage.setItem(LAST_ACTIVITY_KEY, String(initialActivity))
    lastPersistedActivityRef.current = initialActivity
    schedule(initialActivity)

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, registerActivity, { passive: true, capture: true })
    })
    window.addEventListener("storage", handleStorage)
    window.addEventListener("focus", verifyCurrentSession)
    window.addEventListener("pageshow", verifyCurrentSession)
    document.addEventListener("visibilitychange", verifyCurrentSession)

    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
      ACTIVITY_EVENTS.forEach((eventName) => window.removeEventListener(eventName, registerActivity, true))
      window.removeEventListener("storage", handleStorage)
      window.removeEventListener("focus", verifyCurrentSession)
      window.removeEventListener("pageshow", verifyCurrentSession)
      document.removeEventListener("visibilitychange", verifyCurrentSession)
    }
  }, [navigate])

  return null
}
