import { Button } from "@/components/ui/button"

export default function UsersPage() {
    return (
        <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Usuarios</h1>
                <Button onClick={() => console.log("TODO: abrir modal crear usuario")}>
                Nuevo usuario
                </Button>
            </div>

            <div className="rounded-lg border border-gray-200">
                <div className="border-b border-gray-200 p-3 text-sm text-gray-500">
                {/* filtros / buscador (stub) */}
                <input
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
                    placeholder="Buscar por nombre, correo..."
                />
                </div>

                {/* tabla stub */}
                <div className="p-3">
                <div className="grid grid-cols-4 gap-2 border-b border-gray-200 p-2 text-xs font-medium text-gray-500">
                    <div>Nombre</div>
                    <div>Email</div>
                    <div>Rol</div>
                    <div className="text-right">Acciones</div>
                </div>

                {/* fila muestra */}
                <div className="grid grid-cols-4 gap-2 p-2 text-sm">
                    <div>Jane Doe</div>
                    <div>jane@example.com</div>
                    <div>Admin</div>
                    <div className="text-right">
                    <Button variant="ghost" onClick={() => console.log("editar")}>Editar</Button>
                    </div>
                </div>
                </div>
            </div>
        </div>
    )
}