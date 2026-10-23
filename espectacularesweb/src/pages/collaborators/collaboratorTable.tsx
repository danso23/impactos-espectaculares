import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2 } from "lucide-react"
import { createActionsColumn } from "@/components/generic/create-actions-column"
import { useRoles } from "@/hooks/useRoles"
import type { CollaboratorRecord } from "@/types/Collaborator"

export function useCollaboratorTable({ onEdit, onDelete }: { onEdit: (row: CollaboratorRecord) => void; onDelete: (row: CollaboratorRecord) => void }) {
  const { can } = useRoles()
  return React.useMemo<ColumnDef<CollaboratorRecord>[]>(() => {
    const actions = []
    if (can("collaborators.edit")) actions.push({ key: "edit", label: "Editar", icon: <Pencil className="h-4 w-4" />, onClick: onEdit })
    if (can("collaborators.delete")) actions.push({ key: "delete", label: "Eliminar", icon: <Trash2 className="h-4 w-4" />, onClick: onDelete, variant: "destructive" as const })
    return [
      { accessorKey: "name", header: "Colaborador", cell: ({ row }) => <div><div className="font-medium">{row.original.name}</div><div className="text-xs text-muted-foreground">{row.original.position || "Sin puesto"}</div></div> },
      { accessorKey: "phone", header: "Teléfono", cell: ({ row }) => row.original.phone || "—" },
      { accessorKey: "email", header: "Email", cell: ({ row }) => row.original.email || "—" },
      { accessorKey: "notes", header: "Notas", cell: ({ row }) => row.original.notes || "—" },
      { accessorKey: "active", header: "Estatus", cell: ({ row }) => <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${row.original.active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>{row.original.active ? "Activo" : "Inactivo"}</span> },
      createActionsColumn<CollaboratorRecord>({ actions }),
    ]
  }, [can, onDelete, onEdit])
}
