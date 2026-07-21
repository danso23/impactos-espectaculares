import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { CircleCheckBig, CreditCard, Pencil, Trash2 } from "lucide-react"

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

function formatCustomerType(value?: string | null) {
  if (!value) return "—"

  if (value === "lead") return "Lead"
  if (value === "cliente") return "Cliente"
  if (value === "sin_cliente") return "Sin cliente"

  return value
}

function statusClass(value?: string | null) {
  if (value === "active") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700"
  }

  if (value === "completed") {
    return "border-indigo-200 bg-indigo-50 text-indigo-700"
  }

  if (value === "cancelled") {
    return "border-rose-200 bg-rose-50 text-rose-700"
  }

  return "border-slate-200 bg-slate-50 text-slate-600"
}

function statusLabel(value?: string | null) {
  if (!value) return "—"

  if (value === "draft") return "Borrador"
  if (value === "active") return "Confirmada"
  if (value === "completed") return "Completada"
  if (value === "cancelled") return "Cancelada"

  return value
}

function paymentFrequencyLabel(value?: string | null) {
  if (value === "single") return "Pago único"
  if (value === "weekly") return "Semanal"
  if (value === "biweekly") return "Quincenal"
  if (value === "monthly") return "Mensual"
  return "Sin plan"
}

export function useRentalTable({
  onEdit,
  onDelete,
  onViewPayments,
  onConfirm,
}: {
  onEdit: (row: RentalRecord) => void
  onDelete: (row: RentalRecord) => Promise<void> | void
  onViewPayments: (row: RentalRecord) => void
  onConfirm: (row: RentalRecord) => void
}) {
  return React.useMemo<ColumnDef<RentalRecord>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => row.original.id,
      },
      {
        accessorKey: "customer_type",
        header: "Cliente",
        cell: ({ row }) => formatCustomerType(row.original.customer_type),
      },
      {
        accessorKey: "status",
        header: "Estatus",
        cell: ({ row }) => (
          <span
            className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${statusClass(
              row.original.status
            )}`}
          >
            {statusLabel(row.original.status)}
          </span>
        ),
      },
      {
        accessorKey: "payment_frequency",
        header: "Plan de pagos",
        cell: ({ row }) => (
          <div className="space-y-1">
            <div className="font-medium">{paymentFrequencyLabel(row.original.payment_frequency)}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.payment_installments ?? row.original.invoices?.length ?? 0} parcialidad(es)
            </div>
          </div>
        ),
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
            key: "confirm",
            label: "Confirmar renta",
            icon: <CircleCheckBig className="h-4 w-4" />,
            onClick: onConfirm,
            visible: (row) => row.status === "draft",
          },
          {
            key: "payments",
            label: "Ver plan de pagos",
            icon: <CreditCard className="h-4 w-4" />,
            onClick: onViewPayments,
          },
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
    [onConfirm, onDelete, onEdit, onViewPayments]
  )
}
