import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2 } from "lucide-react"

import { createActionsColumn } from "@/components/generic/create-actions-column"
import type { CaseroRecord } from "@/types/Casero"

function formatDate(value?: string | null) {
  if (!value) return "—"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
  }).format(date)
}

function formatCurrency(value?: number | null) {
  if (value === null || value === undefined) return "—"

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value)
}

export function useCaseroTable({
  onEdit,
  onDelete,
}: {
  onEdit: (row: CaseroRecord) => void
  onDelete: (row: CaseroRecord) => Promise<void> | void
}) {
  return React.useMemo<ColumnDef<CaseroRecord>[]>(
    () => [
      {
        accessorKey: "nombre",
        header: "Casero",
        cell: ({ row }) => {
          const c = row.original
          const fullName = [c.nombre, c.apellido_paterno, c.apellido_materno]
            .filter(Boolean)
            .join(" ")

          return (
            <div className="space-y-1">
              <div className="font-medium">{fullName}</div>
              {c.ciudad && (
                <div className="text-xs text-muted-foreground">{c.ciudad}, {c.estado || ""}</div>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: "telefono",
        header: "Teléfono",
        cell: ({ row }) => row.original.telefono || "—",
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => row.original.email || "—",
      },
      {
        accessorKey: "rfc",
        header: "RFC",
        cell: ({ row }) => row.original.rfc || "—",
      },
      {
        accessorKey: "monto_renta",
        header: "Renta",
        cell: ({ row }) => formatCurrency(row.original.monto_renta),
      },
      {
        accessorKey: "active",
        header: "Estatus",
        cell: ({ row }) => {
          const active = row.original.active
          return (
            <span
              className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${
                active !== false
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-50 text-slate-500"
              }`}
            >
              {active !== false ? "Activo" : "Inactivo"}
            </span>
          )
        },
      },
      {
        accessorKey: "created_at",
        header: "Alta",
        cell: ({ row }) => formatDate(row.original.created_at),
      },
      createActionsColumn<CaseroRecord>({
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
