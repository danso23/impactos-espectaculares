import React from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { env } from "@/config/env"
import { isAuthenticated } from "@/lib/auth"
import type { LoginResponse } from "@/types/Login"


export function LoginPage() {
    const navigate = useNavigate()
    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    if (isAuthenticated()) {
        return <Navigate to="/" replace />
    }

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError(null)
        setLoading(true)

        const form = new FormData(e.currentTarget)
        const username = String(form.get("username") ?? "")
        const password = String(form.get("password") ?? "")

        try {
            const res = await fetch(`${env.apiUrl}/api/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            })

            const data = (await res.json()) as Partial<LoginResponse> & { message?: string }

            if (!res.ok) {
                throw new Error(data?.message || "No se pudo iniciar sesión")
            }

            // guarda token + user
            localStorage.setItem("access_token", data.access_token as string)
            if (data.refresh_token) localStorage.setItem("refresh_token", data.refresh_token as string)

            localStorage.setItem("token", data.access_token as string) // compat mientras migras
            localStorage.setItem("user", JSON.stringify(data.user))

            // redirige
            navigate("/")
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : "Error inesperado"
            setError(message)
        } finally {
            setLoading(false)
        }
    }
    return (
        <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
            <Card className="w-full max-w-md border-slate-200 shadow-xl">
                <CardHeader className="space-y-3 text-center">
                    <div className="flex justify-center">
                    <img src="/img/logo.png" alt="Impactos Espectaculares" className="h-14 w-auto object-contain" />
                    </div>
                    <CardTitle className="text-2xl">Iniciar sesión</CardTitle>
                    <CardDescription>Accede al panel de administración</CardDescription>
                </CardHeader>

                <CardContent>
                    <form className="space-y-5" onSubmit={onSubmit}>
                    <div className="grid gap-2">
                        <Label htmlFor="username">Usuario</Label>
                        <Input name="username" id="username" type="text" placeholder="admin" required />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password">Contraseña</Label>
                        <Input name="password" id="password" type="password" required />
                    </div>

                    {error && (
                        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-500 text-white hover:opacity-90"
                    >
                        {loading ? "Entrando..." : "Entrar"}
                    </Button>
                    </form>
                </CardContent>

                <CardFooter className="flex-col gap-4">
                    <p className="text-center text-xs text-slate-500">
                    API: <span className="font-mono">{env.apiUrl}</span>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
