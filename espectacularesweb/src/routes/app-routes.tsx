import { Navigate, Route, Routes } from "react-router-dom"

import { LoginPage } from "@/pages/auth/login"
import UsersPage from "@/pages/userPage"
import SpacePage from "@/pages/space/spacePage"
import SpaceEditorPage from "@/pages/space/spaceEditorPage"
import ProviderPage from "@/pages/providers/providerPage"
import RentalPage from "@/pages/rentals/rentalPage"
import PaymentPage from "@/pages/payments/paymentPage"
import { ProtectedRoute } from "@/routes/ProtectedRoute"
import AppLayout from "@/layouts/AppLayout"

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

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                    <Route index element={<Navigate to="espacios" replace />} />

                    <Route path="espacios" element={<SpacePage />} />
                    <Route path="espacios/nuevo" element={<SpaceEditorPage />} />
                    <Route path="espacios/:id/editar" element={<SpaceEditorPage />} />
                    <Route path="rentas" element={<RentalPage />} />
                    <Route path="usuarios" element={<UsersPage />} />
                    <Route path="pagos" element={<PaymentPage />} />
                    <Route path="prospectos" element={<RouteStub title="Prospectos" />} />
                    <Route path="clientes" element={<RouteStub title="Clientes" />} />
                    <Route path="proveedores" element={<ProviderPage />} />
                    <Route path="caseros" element={<RouteStub title="Caseros" />} />
                    <Route path="servicios" element={<RouteStub title="Servicios" />} />
                    <Route path="colaboradores" element={<RouteStub title="Colaboradores" />} />
                    <Route path="*" element={<RouteStub title="No encontrado" />} />
                </Route>
            </Route>

            <Route path="*" element={<Navigate to="/espacios" replace />} />
        </Routes>
    )
}
