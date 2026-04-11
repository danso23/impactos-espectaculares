// src/components/auth/logout-button.tsx
import * as React from "react"
import { useNavigate } from "react-router-dom"
import { LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { apiFetch } from "@/lib/api"
import { clearAuth } from "@/lib/auth"

type LogoutButtonProps = {
  className?: string
  variant?: React.ComponentProps<typeof Button>["variant"]
  fullWidth?: boolean
  compact?: boolean
}

function forceLocalLogout(navigate: ReturnType<typeof useNavigate>) {
  clearAuth();
  navigate("/login", { replace: true })
}

async function logoutRequest() {
  const refreshToken = localStorage.getItem("refresh_token")
  const res = await apiFetch(`${import.meta.env.VITE_API_URL}/api/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      refresh_token: refreshToken || null,
    }),
  })

  if (res.status === 204) return null

  try {
    return await res.json()
  } catch {
    return null
  }
}

export function LogoutButton({
  className,
  variant = "ghost",
  fullWidth = true,
  compact = false,
}: LogoutButtonProps) {
  const navigate = useNavigate()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleConfirm = async () => {
    setError(null)
    setLoading(true)

    try {
      await logoutRequest()

      forceLocalLogout(navigate)
    } catch (e) {
      console.log(e);
      forceLocalLogout(navigate)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          className={[
            fullWidth ? "w-full justify-start" : "",
            compact ? "justify-center px-2" : "",
            className ?? "",
          ].join(" ")}
          disabled={loading}
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
        >
          <LogOut className={compact ? "h-4 w-4" : "mr-2 h-4 w-4"} />
          {compact ? null : loading ? "Cerrando..." : "Cerrar sesión"}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
          <AlertDialogDescription>
            Se cerrará tu sesión actual y tendrás que volver a iniciar sesión.
          </AlertDialogDescription>

          {error ? (
            <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={loading}>
            {loading ? "Cerrando..." : "Sí, cerrar sesión"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
