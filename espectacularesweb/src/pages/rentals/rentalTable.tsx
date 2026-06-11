import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2 } from "lucide-react"

import { createActionsColumn } from "@/components/generic/create-actions-column"
import type { RentalRecord } from "@/types/Rental"

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

export function useRentalTable({
  onEdit,
  onDelete,
}: {
  onEdit: (row: RentalRecord) => void
  onDelete: (row: RentalRecord) => Promise<void> | void
}) {
  return React.useMemo<ColumnDef<RentalRecord>[]>(
    () => [
      {
        accessorKey: "quote_id",
        header: "Quote ID",
        cell: ({ row }) => row.original.quote_id ?? "—",
      },
      {
        accessorKey: "customer_type",
        header: "Cliente",
        cell: ({ row }) => row.original.customer_type ?? "—",
      },
      {
        accessorKey: "status",
        header: "Estatus",
        cell: ({ row }) => row.original.status ?? "—",
      },
      {
        accessorKey: "starts_at",
        header: "Inicio",
        cell: ({ row }) => formatDate(row.original.starts_at),
      },
      {
        accessorKey: "ends_at",
        header: "Fin",
        cell: ({ row }) => formatDate(row.original.ends_at),
      },
      {
        accessorKey: "total",
        header: "Total",
        cell: ({ row }) => formatCurrency(row.original.total),
      },
      {
        accessorKey: "created_at",
        header: "Alta",
        cell: ({ row }) => formatDate(row.original.created_at),
      },
      createActionsColumn<RentalRecord>({
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
