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
import { apiFetch } from "@/lib/api" // ✅ usa tu wrapper

type LogoutButtonProps = {
  className?: string
  variant?: React.ComponentProps<typeof Button>["variant"]
  fullWidth?: boolean
}

function forceLocalLogout(navigate: ReturnType<typeof useNavigate>) {
  localStorage.removeItem("token")
  localStorage.removeItem("user")
  navigate("/login", { replace: true })
}

async function logoutRequest() {
  // ✅ NO uses fetch directo. apiFetch mete Bearer y maneja 401.
  const res = await apiFetch(`${import.meta.env.VITE_API_URL}/api/logout`, {
    method: "POST",
  })

  // Algunos backends responden 204/empty, así que no forzamos json
  if (res.status === 204) return null

  // Si hay body json, lo intentamos
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
}: LogoutButtonProps) {
  const navigate = useNavigate()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleConfirm = async () => {
    setError(null)
    setLoading(true)

    try {
      await logoutRequest()

      // ✅ aunque haya sido OK, cerramos local y mandamos a login
      forceLocalLogout(navigate)
    } catch (e: any) {
      // ✅ Si fue 401, apiFetch ya limpió y pudo redirigir.
      // Pero por si no (o por otro error), forzamos logout local igual:
      forceLocalLogout(navigate)

      // Si quieres mostrar el error, comenta las 2 líneas de arriba y deja esto:
      // setError(e?.message ?? "Ocurrió un error al cerrar sesión.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          className={[fullWidth ? "w-full justify-start" : "", className ?? ""].join(" ")}
          disabled={loading}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {loading ? "Cerrando..." : "Cerrar sesión"}
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