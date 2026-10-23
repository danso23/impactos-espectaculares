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
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ModuleHeader } from "@/components/generic/module-header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LogoutButton } from "./components/auth/logout-button";
import { SessionIdleGuard } from "./components/auth/session-idle-guard";
import { LoginPage } from "./pages/auth/login";
import { Can } from "@/components/auth/Can";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { getUser } from "@/lib/auth";
import { useRoles } from "@/hooks/useRoles";
import { cn } from "@/lib/utils";
import UsersPage from "@/pages/userPage";
import SpacePage from "./pages/space/spacePage";
import SpaceEditorPage from "./pages/space/spaceEditorPage";
import QuoteCreatePage from "@/pages/quotes/quoteCreatePage";
import QuotesPage from "@/pages/quotes/quotesPage";
import LeadsPage from "@/pages/crm/leadsPage";
import ClientsPage from "@/pages/crm/clientsPage";
import RolePage from "./pages/rolePage";
import CaseroPage from "./pages/caseros/caseroPage";
import ProviderPage from "@/pages/providers/providerPage";
import RentalPage from "@/pages/rentals/rentalPage";
import PaymentPage from "@/pages/payments/paymentPage";
import PublicCatalogPage from "@/pages/public/PublicCatalogPage";
import ServicePage from "@/pages/services/servicePage";
import CollaboratorPage from "@/pages/collaborators/collaboratorPage";

type NavItem = {
  to: string;
  label: string;
  icon: React.ElementType;
  permission: string;
};

const NAV: readonly NavItem[] = [
  { to: "/espacios", label: "Espacios", icon: PanelsTopLeft, permission: "spaces.view" },
  { to: "/cotizaciones", label: "Cotizaciones", icon: ReceiptText, permission: "quotes.view" },
  { to: "/rentas", label: "Rentas", icon: BadgeDollarSign, permission: "rentals.view" },
  { to: "/usuarios", label: "Usuarios", icon: UserCog, permission: "users.view" },
  { to: "/roles", label: "Roles", icon: Shield, permission: "roles.view" },
  { to: "/pagos", label: "Pagos", icon: HandCoins, permission: "payments.view" },
  { to: "/prospectos", label: "Prospectos", icon: Users, permission: "leads.view" },
  { to: "/clientes", label: "Clientes", icon: Contact2, permission: "clients.view" },
  { to: "/proveedores", label: "Proveedores", icon: Building2, permission: "providers.view" },
  { to: "/caseros", label: "Caseros", icon: MapPin, permission: "caseros.view" },
  { to: "/servicios", label: "Servicios", icon: Settings, permission: "services.view" },
  { to: "/colaboradores", label: "Colaboradores", icon: Users, permission: "collaborators.view" },
] as const;

const SIDEBAR_STORAGE_KEY = "espectaculares.sidebar.collapsed";

function RouteStub({
  title,
  badge = "Módulo del sistema",
  description,
  icon = Settings,
}: {
  title: string;
  badge?: string;
  description?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500">
      <ModuleHeader
        title={title}
        badge={badge}
        description={description ?? `Administra la información del módulo de ${title.toLowerCase()}.`}
        icon={icon}
      />
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600">
        Contenido de <span className="font-medium text-gray-900">{title}</span>.
      </div>
    </div>
  );
}

function PermissionRoute({ permission, children }: { permission: string; children: React.ReactNode }) {
  const { can } = useRoles();

  if (!can(permission)) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
        <Shield className="mx-auto h-10 w-10 text-amber-600" />
        <h1 className="mt-4 text-xl font-semibold text-gray-800">Acceso restringido</h1>
        <p className="mt-2 text-sm text-gray-600">No tienes permiso para ver este módulo.</p>
      </div>
    );
  }

  return <>{children}</>;
}

function FirstAllowedRoute() {
  const { can } = useRoles();
  const destination = NAV.find((item) => can(item.permission))?.to ?? "/sin-acceso";
  return <Navigate to={destination} replace />;
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
      <SessionIdleGuard />
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
                const { to, label, icon: Icon, permission } = item;
                
                return (
                  <Can key={to} permission={permission} fallback={null}>
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
      <Route path="/catalogo/:token" element={<PublicCatalogPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<FirstAllowedRoute />} />
          <Route path="espacios" element={<PermissionRoute permission="spaces.view"><SpacePage /></PermissionRoute>} />
          <Route path="espacios/nuevo" element={<PermissionRoute permission="spaces.edit"><SpaceEditorPage /></PermissionRoute>} />
          <Route path="espacios/:id/editar" element={<PermissionRoute permission="spaces.edit"><SpaceEditorPage /></PermissionRoute>} />
          <Route path="cotizaciones" element={<PermissionRoute permission="quotes.view"><QuotesPage /></PermissionRoute>} />
          <Route path="cotizaciones/nueva" element={<PermissionRoute permission="quotes.edit"><QuoteCreatePage /></PermissionRoute>} />
          <Route path="rentas" element={<PermissionRoute permission="rentals.view"><RentalPage /></PermissionRoute>} />
          <Route path="usuarios" element={<PermissionRoute permission="users.view"><UsersPage /></PermissionRoute>} />
          <Route path="roles" element={<PermissionRoute permission="roles.view"><RolePage /></PermissionRoute>} />
          <Route path="pagos" element={<PermissionRoute permission="payments.view"><PaymentPage /></PermissionRoute>} />
          <Route path="prospectos" element={<PermissionRoute permission="leads.view"><LeadsPage /></PermissionRoute>} />
          <Route path="clientes" element={<PermissionRoute permission="clients.view"><ClientsPage /></PermissionRoute>} />
          <Route path="proveedores" element={<PermissionRoute permission="providers.view"><ProviderPage /></PermissionRoute>} />
          <Route path="caseros" element={<PermissionRoute permission="caseros.view"><CaseroPage /></PermissionRoute>} />
          <Route path="servicios" element={<PermissionRoute permission="services.view"><ServicePage /></PermissionRoute>} />
          <Route
            path="colaboradores"
            element={<PermissionRoute permission="collaborators.view"><CollaboratorPage /></PermissionRoute>}
          />
          <Route path="sin-acceso" element={<PermissionRoute permission="__none__"><span /></PermissionRoute>} />
          <Route path="*" element={<RouteStub title="No encontrado" />} />
        </Route>
      </Route>

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
