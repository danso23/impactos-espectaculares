import * as React from "react"
import { SortHeader, type SortDirection } from "@/components/generic/sort-header"
import type { ColumnDef } from "@tanstack/react-table"
import { CircleCheckBig, CreditCard, Pencil, Trash2 } from "lucide-react"

import { createActionsColumn } from "@/components/generic/create-actions-column"
import type { RentalRecord } from "@/types/Rental"
import type { TableAction } from "@/types/TableAction"
import { useRoles } from "@/hooks/useRoles"
import { excelDate } from "@/lib/exportExcel"

function formatDate(value?: string | null) {
  if (!value) return "—"

  // "YYYY-MM-DD" se interpreta como medianoche UTC y en México se mostraba un
  // día antes; las fechas sin hora se leen como fecha local.
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value)
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
  if (value === "annual") return "Anual"
  return "Sin plan"
}

export function useRentalTable({
  onEdit,
  onDelete,
  onViewPayments,
  onConfirm,
  sortDirection = "desc",
  onToggleSort,
}: {
  onEdit: (row: RentalRecord) => void
  onDelete: (row: RentalRecord) => Promise<void> | void
  onViewPayments: (row: RentalRecord) => void
  onConfirm: (row: RentalRecord) => void
  sortDirection?: SortDirection
  onToggleSort?: () => void
}) {
  const { can } = useRoles()

  return React.useMemo<ColumnDef<RentalRecord>[]>(
    () => {
      const actions: TableAction<RentalRecord>[] = [
        {
          key: "payments",
          label: "Ver plan de pagos",
          icon: <CreditCard className="h-4 w-4" />,
          onClick: onViewPayments,
        },
      ]
      if (can("rentals.edit")) actions.push(
        {
          key: "confirm",
          label: "Confirmar renta",
          icon: <CircleCheckBig className="h-4 w-4" />,
          onClick: onConfirm,
          visible: (row) => row.status === "draft",
        },
        {
          key: "edit",
          label: "Editar",
          icon: <Pencil className="h-4 w-4" />,
          onClick: onEdit,
        },
      )
      if (can("rentals.delete")) actions.push({
        key: "delete",
        label: "Eliminar",
        icon: <Trash2 className="h-4 w-4" />,
        onClick: onDelete,
        variant: "destructive",
      })

      return [
      {
        accessorKey: "id",
        header: () => onToggleSort
          ? <SortHeader label="ID" direction={sortDirection} onToggle={onToggleSort} />
          : "ID",
        cell: ({ row }) => row.original.id,
      },
      {
        accessorKey: "customer_name",
        header: "Cliente",
        cell: ({ row }) => <div className="font-medium">{row.original.customer_name || "—"}</div>,
        meta: { exportValue: (rental) => rental.customer_name ?? "" },
      },
      {
        id: "customer_type",
        header: "Tipo de cliente",
        accessorFn: (rental) => formatCustomerType(rental.customer_type),
        cell: ({ row }) => formatCustomerType(row.original.customer_type),
      },
      {
        id: "space_ids",
        header: "ID anuncio",
        accessorFn: (rental) => (rental.spaces ?? []).map((space) => space.assigned_id || "—").join(", "),
        cell: ({ row }) => {
          const spaces = row.original.spaces ?? []
          if (!spaces.length) return <span className="text-muted-foreground">—</span>
          return (
            <div className="space-y-1">
              {spaces.map((space) => (
                <div key={space.id} className="font-semibold text-violet-700">{space.assigned_id || "—"}</div>
              ))}
            </div>
          )
        },
      },
      {
        id: "space_titles",
        header: "Anuncio",
        accessorFn: (rental) => (rental.spaces ?? []).map((space) => space.title || "—").join(", "),
        cell: ({ row }) => {
          const spaces = row.original.spaces ?? []
          if (!spaces.length) return <span className="text-muted-foreground">—</span>
          return (
            <div className="space-y-1">
              {spaces.map((space) => <div key={space.id}>{space.title || "—"}</div>)}
            </div>
          )
        },
      },
      {
        id: "space_rents",
        header: "Renta contratada (sin IVA)",
        accessorFn: (rental) => (rental.spaces ?? [])
          .map((space) => `${space.assigned_id || space.title || "—"}: ${formatCurrency(space.rent ?? null)}`)
          .join("; "),
        meta: {
          // Con un solo anuncio se exporta como número para poder sumarlo en Excel.
          exportValue: (rental) => {
            const spaces = rental.spaces ?? []
            if (spaces.length === 1) return Number(spaces[0].rent ?? 0)
            return spaces.map((space) => `${space.assigned_id || space.title || "—"}: ${formatCurrency(space.rent ?? null)}`).join("; ")
          },
        },
        cell: ({ row }) => {
          const spaces = row.original.spaces ?? []
          if (!spaces.length) return <span className="text-muted-foreground">—</span>
          return (
            <div className="space-y-1">
              {spaces.map((space) => <div key={space.id}>{formatCurrency(space.rent ?? null)}</div>)}
            </div>
          )
        },
      },
      {
        accessorKey: "manual_invoice_id",
        header: "ID factura",
        cell: ({ row }) => row.original.manual_invoice_id || "—",
      },
      {
        accessorKey: "status",
        header: "Estatus",
        meta: { exportValue: (rental) => statusLabel(rental.status) },
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
        accessorKey: "is_rotating",
        header: "Rotativa",
        meta: { exportValue: (rental) => rental.is_rotating === true || rental.is_rotating === 1 || rental.is_rotating === "1" },
        cell: ({ row }) => {
          const rotating = row.original.is_rotating === true || row.original.is_rotating === 1 || row.original.is_rotating === "1"
          return (
            <span className={rotating ? "font-semibold text-violet-700" : "text-muted-foreground"}>
              {rotating ? "Sí" : "No"}
            </span>
          )
        },
      },
      {
        accessorKey: "payment_frequency",
        header: "Plan de pagos",
        meta: {
          exportValue: (rental) => `${paymentFrequencyLabel(rental.payment_frequency)} · ${rental.payment_installments ?? rental.invoices?.length ?? 0} pago(s)`,
        },
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
        meta: { exportValue: (rental) => excelDate(rental.starts_at) },
        cell: ({ row }) => formatDate(row.original.starts_at),
      },
      {
        accessorKey: "ends_at",
        header: "Fin",
        meta: { exportValue: (rental) => excelDate(rental.ends_at) },
        cell: ({ row }) => formatDate(row.original.ends_at),
      },
      {
        accessorKey: "total",
        header: "Total",
        meta: { exportValue: (rental) => Number(rental.total ?? 0) },
        cell: ({ row }) => formatCurrency(row.original.total),
      },
      {
        accessorKey: "created_at",
        header: "Alta",
        meta: { exportValue: (rental) => excelDate(rental.created_at) },
        cell: ({ row }) => formatDate(row.original.created_at),
      },
      createActionsColumn<RentalRecord>({
        actions,
      }),
    ]},
    [onConfirm, onDelete, onEdit, onViewPayments, can, sortDirection, onToggleSort]
  )
}
