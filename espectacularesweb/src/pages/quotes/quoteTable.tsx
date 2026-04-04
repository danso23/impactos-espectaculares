import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { FileDown } from "lucide-react"

import { createActionsColumn } from "@/components/generic/create-actions-column"
import type { QuoteRecord, QuoteStatus } from "@/types/Quote"

function formatDate(value?: string | null) {
  if (!value) return "—"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
  }).format(date)
}

function formatCurrency(value?: number | null) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value ?? 0)
}

function toneClass(status?: QuoteStatus | null) {
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

export function useQuoteTable({
  onDownload,
}: {
  onDownload: (quote: QuoteRecord) => Promise<void> | void
}) {
  return React.useMemo<ColumnDef<QuoteRecord>[]>(
    () => [
      {
        accessorKey: "folio",
        header: "Folio",
        cell: ({ row }) => (
          <div className="space-y-1">
            <div className="font-medium">{row.original.folio}</div>
            <div className="text-xs text-muted-foreground">
              Versión {row.original.version}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "customer",
        header: "Cliente",
        cell: ({ row }) => {
          const customer = row.original.customer

          return (
            <div className="space-y-1">
              <div className="font-medium">{customer?.display_name || "—"}</div>
              <div className="text-xs text-muted-foreground">
                {customer?.contact_name || customer?.email || "Sin contacto"}
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: "company",
        header: "Empresa",
        cell: ({ row }) => row.original.company?.name || "—",
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
        accessorKey: "valid_until",
        header: "Vigencia",
        cell: ({ row }) => formatDate(row.original.valid_until),
      },
      {
        accessorKey: "totals.total",
        header: "Total",
        cell: ({ row }) => formatCurrency(row.original.totals.total),
      },
      {
        accessorKey: "created_at",
        header: "Alta",
        cell: ({ row }) => formatDate(row.original.created_at),
      },
      createActionsColumn<QuoteRecord>({
        actions: [
          {
            key: "download-pdf",
            label: "Descargar PDF",
            icon: <FileDown className="h-4 w-4" />,
            onClick: onDownload,
          },
        ],
      }),
    ],
    [onDownload]
  )
}
