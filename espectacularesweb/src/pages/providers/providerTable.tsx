import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2 } from "lucide-react"

import { createActionsColumn } from "@/components/generic/create-actions-column"
import type { ProviderRecord } from "@/types/Provider"

function formatDate(value?: string | null) {
  if (!value) return "—"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
  }).format(date)
}

export function useProviderTable({
  onEdit,
  onDelete,
}: {
  onEdit: (row: ProviderRecord) => void
  onDelete: (row: ProviderRecord) => Promise<void> | void
}) {
  return React.useMemo<ColumnDef<ProviderRecord>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Proveedor",
        cell: ({ row }) => (
          <div className="space-y-1">
            <div className="font-medium">{row.original.name}</div>
            {row.original.contact_name ? (
              <div className="text-xs text-muted-foreground">{row.original.contact_name}</div>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "phone",
        header: "Teléfono",
        cell: ({ row }) => row.original.phone || "—",
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => row.original.email || "—",
      },
      {
        accessorKey: "address",
        header: "Dirección",
        cell: ({ row }) => row.original.address || "—",
      },
      {
        accessorKey: "active",
        header: "Estatus",
        cell: ({ row }) => (
          <span
            className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${
              row.original.active !== false
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-slate-50 text-slate-500"
            }`}
          >
            {row.original.active !== false ? "Activo" : "Inactivo"}
          </span>
        ),
      },
      {
        accessorKey: "created_at",
        header: "Alta",
        cell: ({ row }) => formatDate(row.original.created_at),
      },
      createActionsColumn<ProviderRecord>({
        actions: [
          {
            key: "edit",
            label: "Editar",
            icon: <Pencil className="h-4 w-4" />,
            onClick: onEdit,
          },
          {
            key: "delete",
            label: "Eliminar",
            icon: <Trash2 className="h-4 w-4" />,
            onClick: onDelete,
            variant: "destructive",
          },
        ],
      }),
    ],
    [onEdit, onDelete]
  )
}
