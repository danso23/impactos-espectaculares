import {
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
import { PATHS } from "./paths"

export const NAV = [
    { to: PATHS.espacios, label: "Espacios", icon: PanelsTopLeft },
    { to: PATHS.rentas, label: "Rentas", icon: BadgeDollarSign },
    { to: PATHS.usuarios, label: "Usuarios", icon: UserCog },
    { to: PATHS.pagos, label: "Pagos", icon: HandCoins },
    { to: PATHS.prospectos, label: "Prospectos", icon: Users },
    { to: PATHS.clientes, label: "Clientes", icon: Contact2 },
    { to: PATHS.proveedores, label: "Proveedores", icon: Building2 },
    { to: PATHS.caseros, label: "Caseros", icon: MapPin },
    { to: PATHS.servicios, label: "Servicios", icon: Settings },
    { to: PATHS.colaboradores, label: "Colaboradores", icon: Users },
] as const