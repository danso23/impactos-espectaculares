import { Routes, Route, NavLink, Outlet, Navigate } from "react-router-dom"
import {
  Menu,
  PanelsTopLeft,
  MapPin,
  HandCoins,
  Users,
  BadgeDollarSign,
  UserCog,
  Contact2,
  Building2,
  Settings,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { LogoutButton } from "./components/auth/logout-button"
import { LoginPage } from "./pages/auth/login"
import { ProtectedRoute } from "@/routes/ProtectedRoute"
import { getUser } from "@/lib/auth"
import UsersPage from "@/pages/userPage"
import SpacePage from "./pages/space/spacePage"


function cn(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ")
}

const NAV = [
  { to: "/espacios", label: "Espacios", icon: PanelsTopLeft },
  { to: "/rentas", label: "Rentas", icon: BadgeDollarSign },
  { to: "/usuarios", label: "Usuarios", icon: UserCog },
  { to: "/pagos", label: "Pagos", icon: HandCoins },
  { to: "/prospectos", label: "Prospectos", icon: Users },
  { to: "/clientes", label: "Clientes", icon: Contact2 },
  { to: "/proveedores", label: "Proveedores", icon: Building2 },
  { to: "/caseros", label: "Caseros", icon: MapPin },
  { to: "/servicios", label: "Servicios", icon: Settings },
  { to: "/colaboradores", label: "Colaboradores", icon: Users },
] as const

function RouteStub({ title }: { title: string }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <div className="mt-4 rounded-lg border border-gray-200 p-6 text-sm text-gray-600">
        Contenido de <span className="font-medium text-gray-900">{title}</span>.
      </div>
    </div>
  )
}

function AppLayout() {
  const user = getUser()
  const displayName = user?.name || user?.username || "Usuario"
  const displayEmail = user?.email || ""

  return (
    <div className="h-dvh bg-background text-foreground">
      <div className="flex h-full">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-border md:flex md:flex-col">
          {/* Header usuario */}
          <div className="border-b border-border p-4">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium leading-tight">{displayName}</div>
                <div className="text-xs text-muted-foreground">{displayEmail}</div>
              </div>
            </div>
          </div>

          {/* Nav scrollable */}
          <ScrollArea className="flex-1 p-2">
            <nav className="space-y-1">
              {NAV.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm",
                      isActive
                        ? "bg-muted font-semibold text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className="border-t border-border p-4">
            <LogoutButton />
          </div>
        </aside>

        {/* Right panel */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Topbar fijo */}
          <div className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center justify-between px-3 sm:px-4">
              <div className="flex items-center gap-2">
                {/* Mobile menu trigger */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden"
                      aria-label="Abrir menú"
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-72 p-0">
                    <SheetHeader>
                      <VisuallyHidden>
                        <SheetTitle>Menú principal</SheetTitle>
                      </VisuallyHidden>
                    </SheetHeader>

                  </SheetContent>
                </Sheet>

                <div className="text-lg font-medium">Espectaculares</div>
              </div>
            </div>
          </div>

          {/* Scroll del contenido */}
          <div className="min-h-0 flex-1 overflow-y-auto bg-muted/30">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AppRoot() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="espacios" element={<SpacePage />} />
          <Route path="rentas" element={<RouteStub title="Rentas" />} />
          <Route path="usuarios" element={<UsersPage />} />
          <Route path="pagos" element={<RouteStub title="Pagos" />} />
          <Route path="prospectos" element={<RouteStub title="Prospectos" />} />
          <Route path="clientes" element={<RouteStub title="Clientes" />} />
          <Route path="proveedores" element={<RouteStub title="Proveedores" />} />
          <Route path="caseros" element={<RouteStub title="Caseros" />} />
          <Route path="servicios" element={<RouteStub title="Servicios" />} />
          <Route path="colaboradores" element={<RouteStub title="Colaboradores" />} />
          <Route path="*" element={<RouteStub title="No encontrado" />} />
        </Route>
      </Route>

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
