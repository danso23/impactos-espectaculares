import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2 } from "lucide-react"
import { createActionsColumn } from "@/components/generic/create-actions-column"
import { useRoles } from "@/hooks/useRoles"
import type { ServiceRecord } from "@/types/Service"

const money = (value: number | string) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(value) || 0)

export function useServiceTable({ onEdit, onDelete }: { onEdit: (row: ServiceRecord) => void; onDelete: (row: ServiceRecord) => void }) {
  const { can } = useRoles()
  return React.useMemo<ColumnDef<ServiceRecord>[]>(() => {
    const actions = []
    if (can("services.edit")) actions.push({ key: "edit", label: "Editar", icon: <Pencil className="h-4 w-4" />, onClick: onEdit })
    if (can("services.delete")) actions.push({ key: "delete", label: "Eliminar", icon: <Trash2 className="h-4 w-4" />, onClick: onDelete, variant: "destructive" as const })
    return [
      { accessorKey: "name", header: "Servicio", cell: ({ row }) => <div><div className="font-medium">{row.original.name}</div><div className="text-xs text-muted-foreground">{row.original.key || "Sin clave"}</div></div> },
      { accessorKey: "description", header: "Descripción", cell: ({ row }) => row.original.description || "—" },
      { accessorKey: "base_price", header: "Precio base", cell: ({ row }) => money(row.original.base_price) },
      { accessorKey: "tax_rate", header: "IVA", cell: ({ row }) => `${Number(row.original.tax_rate) || 0}%` },
      { accessorKey: "is_active", header: "Estatus", cell: ({ row }) => <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${row.original.is_active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>{row.original.is_active ? "Activo" : "Inactivo"}</span> },
      createActionsColumn<ServiceRecord>({ actions }),
    ]
  }, [can, onDelete, onEdit])
}
