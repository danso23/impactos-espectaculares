import React, { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, ShieldCheck } from "lucide-react"
import {
  roleService,
  type PermissionAction,
  type PermissionCatalog,
  type Role,
} from "@/lib/services/roleService"
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
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { Can } from "@/components/auth/Can"
import { DeleteConfirmDialog } from "@/components/generic/delete-confirm-dialog"
import { ModuleHeader } from "@/components/generic/module-header"
import { cn } from "@/lib/utils"

const RolePage = () => {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [openModal, setOpenModal] = useState(false)
  const [currentRole, setCurrentRole] = useState<Role | null>(null)
  const [roleName, setRoleName] = useState("")
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [permissionCatalog, setPermissionCatalog] = useState<PermissionCatalog | null>(null)
  const [saving, setSaving] = useState(false)

  // Deletion state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchRoles = async () => {
    try {
      setLoading(true)
      const [data, catalog] = await Promise.all([
        roleService.getAll(),
        roleService.getPermissionCatalog(),
      ])
      setRoles(data)
      setPermissionCatalog(catalog)
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
    setSelectedPermissions(role?.permissions ?? [])
    setOpenModal(true)
  }

  const handleTogglePermission = (
    permission: string,
    checked: boolean,
    action: PermissionAction,
    viewPermission: string,
    modulePermissions: string[],
  ) => {
    setSelectedPermissions((current) => {
      const next = new Set(current)

      if (checked) {
        next.add(permission)
        if (action !== "view") next.add(viewPermission)
      } else {
        next.delete(permission)
        if (action === "view") modulePermissions.forEach((item) => next.delete(item))
      }

      return Array.from(next)
    })
  }

  const actionSelectionState = (action: PermissionAction): boolean | "indeterminate" => {
    const permissions = permissionCatalog?.modules.map(
      (module) => module.permissions[action],
    ) ?? []
    const selectedCount = permissions.filter((permission) =>
      selectedPermissions.includes(permission),
    ).length

    if (permissions.length > 0 && selectedCount === permissions.length) return true
    if (selectedCount > 0) return "indeterminate"
    return false
  }

  const handleToggleActionPermissions = (action: PermissionAction, checked: boolean) => {
    if (!permissionCatalog) return

    setSelectedPermissions((current) => {
      const next = new Set(current)

      permissionCatalog.modules.forEach((module) => {
        if (checked) {
          next.add(module.permissions[action])
          if (action !== "view") next.add(module.permissions.view)
          return
        }

        next.delete(module.permissions[action])
        if (action === "view") {
          next.delete(module.permissions.edit)
          next.delete(module.permissions.delete)
        }
      })

      return Array.from(next)
    })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roleName.trim()) return

    try {
      setSaving(true)
      if (currentRole) {
        await roleService.update(currentRole.id, roleName.trim(), selectedPermissions)
        toast.success("Rol actualizado correctamente.")
      } else {
        await roleService.create(roleName.trim(), selectedPermissions)
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
      <ModuleHeader
        title="Roles"
        badge="Control de permisos"
        description="Administra los roles disponibles en el sistema."
        icon={ShieldCheck}
        actions={<Can permission="roles.edit">
          <Button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-6 py-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border-none"
          >
            <Plus className="w-5 h-5" />
            <span>Nuevo rol</span>
          </Button>
        </Can>}
      />

      {/* Tabla Estilo Figma */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <Table>
          <TableHeader className="bg-gradient-to-r from-purple-600 to-indigo-600">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="px-6 py-4 text-white font-semibold uppercase tracking-wider text-xs">ID</TableHead>
              <TableHead className="px-6 py-4 text-white font-semibold uppercase tracking-wider text-xs">Nombre del Rol</TableHead>
              <TableHead className="px-6 py-4 text-white font-semibold uppercase tracking-wider text-xs">Permisos</TableHead>
              <TableHead className="px-6 py-4 text-right text-white font-semibold uppercase tracking-wider text-xs">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100">
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-48 text-center text-gray-500 italic">
                  Cargando roles...
                </TableCell>
              </TableRow>
            ) : roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-48 text-center text-gray-500 italic">
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
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {(role.permissions?.length ?? 0) > 0 ? (
                      <span className="inline-flex rounded-full border border-purple-200 bg-purple-50 px-3 py-1 font-medium text-purple-700">
                        {role.permissions.length} asignados
                      </span>
                    ) : (
                      <span className="text-gray-400">Sin permisos</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Can permission="roles.edit">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenModal(role)}
                          className="text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Pencil className="w-5 h-5" />
                        </Button>
                        <Can permission="roles.delete">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            onClick={() => handleDeleteClick(role)}
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </Can>
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[760px]">
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
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-semibold text-gray-700">
                    Permisos por módulo
                  </Label>
                  <p className="mt-1 text-xs text-gray-500">
                    Editar o eliminar activa también el permiso para ver el módulo.
                  </p>
                </div>
                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <div className="grid grid-cols-[minmax(180px,1fr)_repeat(3,90px)] bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <span>Módulo</span>
                    {(Object.keys(permissionCatalog?.actions ?? {}) as PermissionAction[]).map((action) => (
                      <label
                        key={action}
                        htmlFor={`all-${action}`}
                        className="flex cursor-pointer flex-col items-center gap-2 text-center"
                      >
                        <span>{permissionCatalog?.actions[action]}</span>
                        <Checkbox
                          id={`all-${action}`}
                          checked={actionSelectionState(action)}
                          onCheckedChange={(value) =>
                            handleToggleActionPermissions(action, value === true)
                          }
                          aria-label={`Seleccionar todos los permisos para ${permissionCatalog?.actions[action]}`}
                        />
                      </label>
                    ))}
                  </div>
                  <div className="divide-y divide-gray-100">
                    {permissionCatalog?.modules.map((module) => {
                      const actions = Object.keys(permissionCatalog.actions) as PermissionAction[]
                      const modulePermissions = actions.map((action) => module.permissions[action])

                      return (
                        <div
                          key={module.key}
                          className="grid grid-cols-[minmax(180px,1fr)_repeat(3,90px)] items-center px-4 py-3 hover:bg-purple-50/50"
                        >
                          <span className="text-sm font-medium text-gray-700">{module.label}</span>
                          {actions.map((action) => {
                            const permission = module.permissions[action]
                            return (
                              <div key={permission} className="flex justify-center">
                                <Checkbox
                                  id={`${module.key}-${action}`}
                                  checked={selectedPermissions.includes(permission)}
                                  onCheckedChange={(value) =>
                                    handleTogglePermission(
                                      permission,
                                      value === true,
                                      action,
                                      module.permissions.view,
                                      modulePermissions,
                                    )
                                  }
                                  aria-label={`${permissionCatalog.actions[action]} ${module.label}`}
                                />
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                </div>
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
