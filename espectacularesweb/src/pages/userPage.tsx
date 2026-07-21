import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { userService } from "@/lib/services/userService"
import type { Role } from "@/lib/services/userService"
import type { AuthUser } from "@/types/AuthUser"
import { Plus, Pencil, Trash2 } from "lucide-react"
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { Can } from "@/components/auth/Can"
import { DeleteConfirmDialog } from "@/components/generic/delete-confirm-dialog"

type UserWithRoles = AuthUser & { roles_array: string[] }

export default function UsersPage() {
  const [users, setUsers] = useState<UserWithRoles[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserWithRoles | null>(null)
  const [loading, setLoading] = useState(false)

  // Deletion state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<UserWithRoles | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    roles: [] as string[],
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [usersData, rolesData] = await Promise.all([
        userService.getUsers(),
        userService.getRoles(),
      ])
      setUsers(usersData)
      setRoles(rolesData)
    } catch {
      toast.error("Error al cargar datos")
    }
  }

  const handleOpenModal = (user?: UserWithRoles) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        name: user.name || "",
        username: user.username || "",
        email: user.email || "",
        password: "",
        roles: user.roles_array || [],
      })
    } else {
      setEditingUser(null)
      setFormData({
        name: "",
        username: "",
        email: "",
        password: "",
        roles: [],
      })
    }
    setIsModalOpen(true)
  }

  const handleToggleRole = (roleName: string) => {
    setFormData((prev) => {
      const isSelected = prev.roles.includes(roleName)
      if (isSelected) {
        return { ...prev, roles: prev.roles.filter((r) => r !== roleName) }
      } else {
        return { ...prev, roles: [...prev.roles, roleName] }
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...formData,
        username: formData.username.trim() === "" ? null : formData.username.trim(),
      }

      if (editingUser) {
        await userService.updateUser(editingUser.id, payload)
        toast.success("Usuario actualizado correctamente")
      } else {
        await userService.createUser(payload)
        toast.success("Usuario creado correctamente")
      }
      setIsModalOpen(false)
      loadData()
    } catch (error: unknown) {
      const err = error as { 
        response?: { 
          data?: { 
            message?: string; 
            errors?: Record<string, string[] | string>; 
          }; 
        }; 
      };
      console.error(err);
      const message = err.response?.data?.message || "Error al guardar usuario";
      const errors = err.response?.data?.errors;
      
      if (errors && typeof errors === 'object') {
        // Mostrar el primer error de validación encontrado
        const firstErrorKey = Object.keys(errors)[0];
        const firstErrorVal = errors[firstErrorKey];
        const firstErrorMessage = Array.isArray(firstErrorVal) 
          ? firstErrorVal[0] 
          : firstErrorVal;
        
        toast.error(`${message}: ${firstErrorMessage}`);
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (user: UserWithRoles) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!userToDelete) return

    try {
      setIsDeleting(true)
      await userService.deleteUser(userToDelete.id)
      toast.success("Usuario desactivado")
      setDeleteDialogOpen(false)
      loadData()
    } catch {
      toast.error("Error al desactivar")
    } finally {
      setIsDeleting(false)
      setUserToDelete(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Usuarios</h1>
          <p className="text-gray-600">Gestiona los usuarios y sus roles en el sistema.</p>
        </div>
        <Can role="admin">
           <Button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-6 py-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border-none"
          >
            <Plus className="w-5 h-5" />
            <span>Nuevo usuario</span>
          </Button>
        </Can>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <Table>
          <TableHeader className="bg-gradient-to-r from-purple-600 to-indigo-600">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="px-6 py-4 text-white font-semibold uppercase tracking-wider text-xs">Nombre</TableHead>
              <TableHead className="px-6 py-4 text-white font-semibold uppercase tracking-wider text-xs">Usuario</TableHead>
              <TableHead className="px-6 py-4 text-white font-semibold uppercase tracking-wider text-xs">Email</TableHead>
              <TableHead className="px-6 py-4 text-white font-semibold uppercase tracking-wider text-xs">Roles</TableHead>
              <TableHead className="px-6 py-4 text-right text-white font-semibold uppercase tracking-wider text-xs">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100">
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center text-gray-500 italic">
                  No hay usuarios registrados.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow 
                  key={user.id}
                  className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 transition-colors"
                >
                  <TableCell className="px-6 py-4 font-semibold text-gray-800">{user.name}</TableCell>
                  <TableCell className="px-6 py-4 text-gray-600">{user.username}</TableCell>
                  <TableCell className="px-6 py-4 text-gray-600">{user.email}</TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {user.roles_array.map((role) => (
                        <span
                          key={role}
                          className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700 border border-purple-200"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Can role="admin">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenModal(user)}
                          className="text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Pencil className="w-5 h-5" />
                        </Button>
                        {user.username !== 'admin' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            onClick={() => handleDeleteClick(user)}
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        )}
                      </Can>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
              </DialogTitle>
              <DialogDescription>
                Completa los datos para gestionar el acceso del usuario.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold text-gray-700">Nombre completo</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-semibold text-gray-700">Nombre de usuario</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                  Contraseña {editingUser && "(opcional)"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                />
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700">Asignar Roles</Label>
                <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 shadow-inner">
                  {roles.map((role) => (
                    <div key={role.id} className="flex items-center space-x-3 bg-white p-2 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors">
                      <Checkbox
                        id={`role-${role.id}`}
                        checked={formData.roles.includes(role.name)}
                        onCheckedChange={() => handleToggleRole(role.name)}
                      />
                      <label
                        htmlFor={`role-${role.id}`}
                        className="text-sm font-medium text-gray-700 cursor-pointer select-none"
                      >
                        {role.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
              >
                {loading ? "Guardando..." : "Guardar Usuario"}
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
        title="Desactivar usuario"
        itemName={userToDelete?.name}
        loading={isDeleting}
      />
    </div>
  )
}
