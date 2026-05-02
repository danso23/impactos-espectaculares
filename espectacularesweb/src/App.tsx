import * as React from "react";
import { Routes, Route, NavLink, Outlet, Navigate } from "react-router-dom";
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
  PanelLeftClose,
  PanelLeftOpen,
  ReceiptText,
  Shield,
  UserCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LogoutButton } from "./components/auth/logout-button";
import { LoginPage } from "./pages/auth/login";
import { Can } from "@/components/auth/Can";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { getUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import UsersPage from "@/pages/userPage";
import SpacePage from "./pages/space/spacePage";
import QuoteCreatePage from "@/pages/quotes/quoteCreatePage";
import QuotesPage from "@/pages/quotes/quotesPage";
import LeadsPage from "@/pages/crm/leadsPage";
import ClientsPage from "@/pages/crm/clientsPage";
import RolePage from "./pages/rolePage";

type NavItem = {
  to: string;
  label: string;
  icon: React.ElementType;
  roles?: string[];
};

const NAV: readonly NavItem[] = [
  { to: "/espacios", label: "Espacios", icon: PanelsTopLeft },
  { to: "/cotizaciones", label: "Cotizaciones", icon: ReceiptText },
  { to: "/rentas", label: "Rentas", icon: BadgeDollarSign },
  { to: "/usuarios", label: "Usuarios", icon: UserCog, roles: ["admin"] },
  { to: "/roles", label: "Roles", icon: Shield, roles: ["admin"] },
  { to: "/pagos", label: "Pagos", icon: HandCoins },
  { to: "/prospectos", label: "Prospectos", icon: Users },
  { to: "/clientes", label: "Clientes", icon: Contact2 },
  { to: "/proveedores", label: "Proveedores", icon: Building2 },
  { to: "/caseros", label: "Caseros", icon: MapPin },
  { to: "/servicios", label: "Servicios", icon: Settings },
  { to: "/colaboradores", label: "Colaboradores", icon: Users },
] as const;

const SIDEBAR_STORAGE_KEY = "espectaculares.sidebar.collapsed";

function RouteStub({ title }: { title: string }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <div className="mt-4 rounded-lg border border-gray-200 p-6 text-sm text-gray-600">
        Contenido de <span className="font-medium text-gray-900">{title}</span>.
      </div>
    </div>
  );
}

function AppLayout() {
  const user = getUser();
  const displayName = user?.name || user?.username || "Usuario";
  const displayEmail = user?.email || "";
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  React.useEffect(() => {
    const storedValue = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (!storedValue) return;
    setSidebarCollapsed(storedValue === "1");
  }, []);

  React.useEffect(() => {
    window.localStorage.setItem(
      SIDEBAR_STORAGE_KEY,
      sidebarCollapsed ? "1" : "0",
    );
  }, [sidebarCollapsed]);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  return (
    <div className="h-dvh bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 text-foreground overflow-hidden">
      <div className="flex h-full">
        {/* Sidebar */}
        <aside
          className={cn(
            "hidden shrink-0 border-r border-gray-200 bg-white transition-[width] duration-200 md:flex md:flex-col shadow-lg z-50",
            sidebarCollapsed ? "w-20" : "w-64",
          )}
        >
          {/* Header usuario con degradado */}
          <div
            className={cn(
              "bg-gradient-to-r from-purple-600 to-indigo-600 p-6",
              sidebarCollapsed ? "px-3 py-6" : "p-6",
            )}
          >
            <div
              className={cn(
                "flex items-center",
                sidebarCollapsed ? "justify-center" : "gap-3",
              )}
            >
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-purple-600 font-semibold shadow-md shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
              {!sidebarCollapsed ? (
                <div className="min-w-0">
                  <div className="truncate font-semibold text-white leading-tight">
                    {displayName}
                  </div>
                  <div className="truncate text-xs text-purple-100">
                    {displayEmail}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Nav scrollable */}
          <ScrollArea className="flex-1 py-4">
            <nav className="space-y-0.5">
              {NAV.map((item) => {
                const { to, label, icon: Icon, roles } = item;
                
                return (
                  <Can key={to} roles={roles} fallback={null}>
                    <NavLink
                      to={to}
                      title={label}
                      end={to !== "/cotizaciones"}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center py-3 text-sm transition-all border-l-4",
                          sidebarCollapsed
                            ? "justify-center px-2"
                            : "gap-3 px-6",
                          isActive
                            ? "bg-gradient-to-r from-purple-100 to-indigo-100 border-purple-600 text-purple-700 font-medium"
                            : "border-transparent text-gray-600 hover:bg-purple-50 hover:text-purple-600",
                        )
                      }
                    >
                      <Icon className="h-5 w-5" />
                      {!sidebarCollapsed ? <span>{label}</span> : null}
                    </NavLink>
                  </Can>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className={cn("p-4 bg-gray-50 border-t border-gray-200", sidebarCollapsed ? "p-3" : "p-4")}>
            <LogoutButton compact={sidebarCollapsed} fullWidth={!sidebarCollapsed} />
          </div>
        </aside>

        {/* Right panel */}
        <div className="flex min-w-0 flex-1 flex-col relative">
          {/* Topbar fijo tipo Figma */}
          <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => {}} // Handle mobile menu elsewhere via Sheet
                >
                  <Menu className="h-5 w-5 text-gray-600" />
                </Button>
                
                <div className="hidden md:flex items-center gap-3">
                   <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                    <UserCircle className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Espectaculares
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden md:inline-flex ml-4"
                  onClick={toggleSidebar}
                >
                  {sidebarCollapsed ? (
                    <PanelLeftOpen className="h-5 w-5 text-gray-500" />
                  ) : (
                    <PanelLeftClose className="h-5 w-5 text-gray-500" />
                  )}
                </Button>
              </div>

              {/* Mobile title only */}
              <span className="md:hidden text-lg font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Espectaculares
              </span>
            </div>
          </div>

          {/* Contenido principal con scroll */}
          <main className="flex-1 overflow-y-auto">
            <div className="p-8 h-full">
               <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default function AppRoot() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/espacios" replace />} />
          <Route path="espacios" element={<SpacePage />} />
          <Route path="cotizaciones" element={<QuotesPage />} />
          <Route path="cotizaciones/nueva" element={<QuoteCreatePage />} />
          <Route path="rentas" element={<RouteStub title="Rentas" />} />
          <Route path="usuarios" element={<UsersPage />} />
          <Route path="roles" element={<RolePage />} />
          <Route path="pagos" element={<RouteStub title="Pagos" />} />
          <Route path="prospectos" element={<LeadsPage />} />
          <Route path="clientes" element={<ClientsPage />} />
          <Route
            path="proveedores"
            element={<RouteStub title="Proveedores" />}
          />
          <Route path="caseros" element={<RouteStub title="Caseros" />} />
          <Route path="servicios" element={<RouteStub title="Servicios" />} />
          <Route
            path="colaboradores"
            element={<RouteStub title="Colaboradores" />}
          />
          <Route path="*" element={<RouteStub title="No encontrado" />} />
        </Route>
      </Route>

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
