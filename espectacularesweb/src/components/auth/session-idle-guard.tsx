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
        const stored = Number(localStorage.getItem(LAST_ACTIVITY_KEY) || lastActivity)
        schedule(Number.isFinite(stored) ? stored : lastActivity)
      }, remaining)
    }

    const registerActivity = () => {
      const now = Date.now()
      if (now - lastPersistedActivityRef.current < 1_000) return

      lastPersistedActivityRef.current = now
      localStorage.setItem(LAST_ACTIVITY_KEY, String(now))
      schedule(now)
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== LAST_ACTIVITY_KEY || !event.newValue) return
      const activity = Number(event.newValue)
      if (Number.isFinite(activity)) schedule(activity)
    }

    const storedActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY))
    const initialActivity = Number.isFinite(storedActivity) && storedActivity > 0
      ? storedActivity
      : Date.now()

    localStorage.setItem(LAST_ACTIVITY_KEY, String(initialActivity))
    lastPersistedActivityRef.current = initialActivity
    schedule(initialActivity)

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, registerActivity, { passive: true })
    })
    window.addEventListener("storage", handleStorage)
    window.addEventListener("focus", registerActivity)

    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
      ACTIVITY_EVENTS.forEach((eventName) => window.removeEventListener(eventName, registerActivity))
      window.removeEventListener("storage", handleStorage)
      window.removeEventListener("focus", registerActivity)
    }
  }, [navigate])

  return null
}
