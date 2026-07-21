import React, { useEffect, useState } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { roleService, type Role } from "@/lib/services/roleService"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Can } from "@/components/auth/Can"
import { DeleteConfirmDialog } from "@/components/generic/delete-confirm-dialog"
import { cn } from "@/lib/utils"

const RolePage = () => {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [openModal, setOpenModal] = useState(false)
  const [currentRole, setCurrentRole] = useState<Role | null>(null)
  const [roleName, setRoleName] = useState("")
  const [saving, setSaving] = useState(false)

  // Deletion state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchRoles = async () => {
    try {
      setLoading(true)
      const data = await roleService.getAll()
      setRoles(data)
    } catch {
      toast.error("No se pudieron cargar los roles.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoles()
  }, [])

  const handleOpenModal = (role: Role | null = null) => {
    setCurrentRole(role)
    setRoleName(role ? role.name : "")
    setOpenModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roleName.trim()) return

    try {
      setSaving(true)
      if (currentRole) {
        await roleService.update(currentRole.id, roleName)
        toast.success("Rol actualizado correctamente.")
      } else {
        await roleService.create(roleName)
        toast.success("Rol creado correctamente.")
      }
      setOpenModal(false)
      fetchRoles()
    } catch {
      toast.error("No se pudo guardar el rol.")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = (role: Role) => {
    setRoleToDelete(role)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!roleToDelete) return

    try {
      setIsDeleting(true)
      await roleService.delete(roleToDelete.id)
      toast.success("Rol eliminado correctamente.")
      setDeleteDialogOpen(false)
      fetchRoles()
    } catch {
      toast.error("No se pudo eliminar el rol.")
    } finally {
      setIsDeleting(false)
      setRoleToDelete(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header Estilo Figma */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Roles</h1>
          <p className="text-gray-600">Administra los roles disponibles en el sistema.</p>
        </div>
        <Can role="admin">
          <Button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-6 py-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border-none"
          >
            <Plus className="w-5 h-5" />
            <span>Nuevo rol</span>
          </Button>
        </Can>
      </div>

      {/* Tabla Estilo Figma */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <Table>
          <TableHeader className="bg-gradient-to-r from-purple-600 to-indigo-600">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="px-6 py-4 text-white font-semibold uppercase tracking-wider text-xs">ID</TableHead>
              <TableHead className="px-6 py-4 text-white font-semibold uppercase tracking-wider text-xs">Nombre del Rol</TableHead>
              <TableHead className="px-6 py-4 text-right text-white font-semibold uppercase tracking-wider text-xs">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100">
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="h-48 text-center text-gray-500 italic">
                  Cargando roles...
                </TableCell>
              </TableRow>
            ) : roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-48 text-center text-gray-500 italic">
                  No se encontraron roles registrados.
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role, index) => (
                <TableRow 
                  key={role.id}
                  className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 transition-colors"
                >
                  <td className="px-6 py-4 text-gray-600 font-medium font-mono text-sm">{role.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        index % 3 === 0 ? 'bg-green-500' : index % 3 === 1 ? 'bg-blue-500' : 'bg-purple-500'
                      )}></div>
                      <span className="text-gray-800 font-semibold">{role.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Can role="admin">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenModal(role)}
                          className="text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Pencil className="w-5 h-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          onClick={() => handleDeleteClick(role)}
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </Can>
                    </div>
                  </td>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal Estilo Shadcn Refinado */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-[425px]">
           <DialogHeader>
              <DialogTitle>
                {currentRole ? "Editar Rol" : "Nuevo Rol"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                  Nombre del rol
                </Label>
                <Input
                  id="name"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="Ej: Editor, Supervisor..."
                  required
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenModal(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={saving}
                >
                  {saving ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>

      {/* Dialogo de confirmación de eliminación */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        itemName={roleToDelete?.name}
        loading={isDeleting}
      />
    </div>
  )
}


export default RolePage
