import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { FileDown, PencilLine, ReceiptText } from "lucide-react"

import { createActionsColumn } from "@/components/generic/create-actions-column"
import type { QuoteRecord } from "@/types/Quote"
import { canChangeQuoteStatus, canConvertQuoteToRental, toneClass } from "@/pages/quotes/quoteStatus"
import type { TableAction } from "@/types/TableAction"
import { useRoles } from "@/hooks/useRoles"

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

export function useQuoteTable({
  onDownload,
  onChangeStatus,
  onConvertToRental,
}: {
  onDownload: (quote: QuoteRecord) => Promise<void> | void
  onChangeStatus: (quote: QuoteRecord) => void
  onConvertToRental: (quote: QuoteRecord) => void
}) {
  const { can } = useRoles()

  return React.useMemo<ColumnDef<QuoteRecord>[]>(
    () => {
      const actions: TableAction<QuoteRecord>[] = [{
        key: "download-pdf",
        label: "Descargar PDF",
        icon: <FileDown className="h-4 w-4" />,
        onClick: onDownload,
      }]
      if (can("quotes.edit")) actions.push(
        {
          key: "change-status",
          label: "Cambiar estatus",
          icon: <PencilLine className="h-4 w-4" />,
          onClick: onChangeStatus,
          visible: canChangeQuoteStatus,
        },
        {
          key: "convert-to-rental",
          label: "Convertir a renta",
          icon: <ReceiptText className="h-4 w-4" />,
          onClick: onConvertToRental,
          visible: canConvertQuoteToRental,
        },
      )

      return [
      {
        accessorKey: "folio",
        header: "Folio",
        cell: ({ row }) => (
          <div className="space-y-1">
            <div className="font-medium">{row.original.folio}</div>
            <div className="text-xs text-muted-foreground">
              Versión {row.original.version}
            </div>
            {row.original.rental ? (
              <div className="text-xs text-emerald-700">
                Renta #{row.original.rental.id}
              </div>
            ) : null}
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
        accessorKey: "quote_kind",
        header: "Tipo",
        cell: ({ row }) => (
          <span className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-2 py-1 text-xs font-medium text-violet-700">
            {row.original.quote_kind === "advertisement" ? "Anuncio" : "Espacio"}
          </span>
        ),
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
        actions,
      }),
    ]},
    [onChangeStatus, onConvertToRental, onDownload, can]
  )
}
