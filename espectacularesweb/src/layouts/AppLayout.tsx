import { NavLink, Outlet } from "react-router-dom"
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
import { LogoutButton } from "@/components/auth/logout-button"
import { getUser } from "@/lib/auth"

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

export default function AppLayout() {
    const user = getUser()
    const displayName = user?.name || user?.username || "Usuario"
    const displayEmail = user?.email || ""

    return (
        <div className="h-dvh bg-background text-foreground">
            <div className="flex h-full">
                <aside className="hidden w-64 shrink-0 border-r border-border md:flex md:flex-col">
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

                    <div className="border-t border-border p-4">
                        <LogoutButton />
                    </div>
                </aside>

                <div className="flex min-w-0 flex-1 flex-col">
                    <div className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                        <div className="flex h-14 items-center justify-between px-3 sm:px-4">
                            <div className="flex items-center gap-2">
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

                    <div className="min-h-0 flex-1 overflow-y-auto bg-muted/30">
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    )
}