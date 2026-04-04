import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowRightLeft } from "lucide-react"

import { createActionsColumn } from "@/components/generic/create-actions-column"
import type { ClientRecord, LeadRecord, LeadStatus } from "@/types/Crm"

function formatDate(value?: string | null) {
  if (!value) return "—"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
  }).format(date)
}

function priorityLabel(priority: number) {
  if (priority === 1) return "Alta"
  if (priority === 3) return "Baja"
  return "Media"
}

function toneClass(status?: LeadStatus | null) {
  switch (status?.color) {
    case "green":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
    case "blue":
      return "border-sky-200 bg-sky-50 text-sky-700"
    case "purple":
      return "border-violet-200 bg-violet-50 text-violet-700"
    case "red":
      return "border-rose-200 bg-rose-50 text-rose-700"
    default:
      return "border-slate-200 bg-slate-50 text-slate-700"
  }
}

export function useLeadTable({
  onConvert,
}: {
  onConvert: (row: LeadRecord) => Promise<void> | void
}) {
  return React.useMemo<ColumnDef<LeadRecord>[]>(
    () => [
      {
        accessorKey: "display_name",
        header: "Prospecto",
        cell: ({ row }) => {
          const lead = row.original

          return (
            <div className="space-y-1">
              <div className="font-medium">{lead.display_name}</div>
              <div className="text-xs text-muted-foreground">{lead.full_name || "Sin contacto"}</div>
            </div>
          )
        },
      },
      {
        accessorKey: "status",
        header: "Estatus",
        cell: ({ row }) => {
          const status = row.original.status

          return status ? (
            <span
              className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${toneClass(status)}`}
            >
              {status.name}
            </span>
          ) : (
            "—"
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
        accessorKey: "source",
        header: "Fuente",
        cell: ({ row }) => row.original.source || "—",
      },
      {
        accessorKey: "priority",
        header: "Prioridad",
        cell: ({ row }) => priorityLabel(row.original.priority),
      },
      {
        accessorKey: "assigned_user",
        header: "Asignado",
        cell: ({ row }) =>
          row.original.assigned_user?.name || row.original.assigned_user?.username || "—",
      },
      {
        accessorKey: "created_at",
        header: "Alta",
        cell: ({ row }) => formatDate(row.original.created_at),
      },
      createActionsColumn<LeadRecord>({
        actions: [
          {
            key: "convert",
            label: "Convertir a cliente",
            icon: <ArrowRightLeft className="h-4 w-4" />,
            onClick: onConvert,
            visible: (row) => row.status?.key !== "won",
          },
        ],
      }),
    ],
    [onConvert]
  )
}

export function useClientTable() {
  return React.useMemo<ColumnDef<ClientRecord>[]>(
    () => [
      {
        accessorKey: "display_name",
        header: "Cliente",
        cell: ({ row }) => {
          const client = row.original

          return (
            <div className="space-y-1">
              <div className="font-medium">{client.display_name}</div>
              <div className="text-xs text-muted-foreground">{client.full_name || "Sin contacto"}</div>
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
        accessorKey: "source",
        header: "Fuente",
        cell: ({ row }) => row.original.source || "—",
      },
      {
        accessorKey: "usuario",
        header: "Registrado por",
        cell: ({ row }) => row.original.usuario || "—",
      },
      {
        accessorKey: "created_at",
        header: "Alta",
        cell: ({ row }) => formatDate(row.original.created_at),
      },
    ],
    []
  )
}
