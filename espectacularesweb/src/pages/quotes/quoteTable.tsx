import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Copy, Eye, FileDown, Pencil, PencilLine, ReceiptText } from "lucide-react"

import { createActionsColumn } from "@/components/generic/create-actions-column"
import type { QuoteRecord } from "@/types/Quote"
import { canChangeQuoteStatus, canConvertQuoteToRental, canDuplicateQuote, canEditQuote, toneClass } from "@/pages/quotes/quoteStatus"
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
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value ?? 0)
}

export function useQuoteTable({
  onView,
  onDownload,
  onChangeStatus,
  onConvertToRental,
  onDuplicate,
  onEdit,
}: {
  onView: (quote: QuoteRecord) => void
  onDownload: (quote: QuoteRecord) => Promise<void> | void
  onChangeStatus: (quote: QuoteRecord) => void
  onConvertToRental: (quote: QuoteRecord) => void
  onDuplicate: (quote: QuoteRecord) => void
  onEdit: (quote: QuoteRecord) => void
}) {
  const { can } = useRoles()

  return React.useMemo<ColumnDef<QuoteRecord>[]>(
    () => {
      const actions: TableAction<QuoteRecord>[] = [{
        key: "view",
        label: "Ver detalles",
        icon: <Eye className="h-4 w-4" />,
        onClick: onView,
      }, {
        key: "download-pdf",
        label: "Descargar PDF",
        icon: <FileDown className="h-4 w-4" />,
        onClick: onDownload,
      }]
      if (can("quotes.edit")) actions.push(
        {
          key: "edit",
          label: "Editar",
          icon: <Pencil className="h-4 w-4" />,
          onClick: onEdit,
          visible: canEditQuote,
        },
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
        {
          key: "duplicate",
          label: "Duplicar (nuevo folio)",
          icon: <Copy className="h-4 w-4" />,
          onClick: onDuplicate,
          visible: canDuplicateQuote,
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
        meta: {
          exportColumns: [
            { label: "Cliente", value: (q) => q.customer?.display_name ?? "Sin cliente" },
            { label: "Contacto", value: (q) => q.customer?.contact_name || q.customer?.email || "" },
          ],
        },
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
        meta: { exportValue: (q) => q.company?.name ?? "" },
        cell: ({ row }) => row.original.company?.name || "—",
      },
      {
        accessorKey: "status",
        header: "Estatus",
        meta: { exportValue: (q) => q.status?.name ?? "" },
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
        header: "Válida hasta",
        meta: { exportValue: (q) => excelDate(q.valid_until) },
        cell: ({ row }) => formatDate(row.original.valid_until),
      },
      {
        // Total de la cotización: un periodo de renta + servicios + IVA.
        id: "quote_total",
        accessorFn: (quote) => Number(quote.totals.total ?? 0),
        header: "Total cotizado",
        cell: ({ row }) => formatCurrency(row.original.totals.total),
      },
      {
        // Total contratado al convertir: todos los pagos de la renta (con IVA).
        id: "rental_total",
        accessorFn: (quote) => (quote.rental ? Number(quote.rental.total) : null),
        header: "Total renta",
        cell: ({ row }) => row.original.rental ? (
          <div>
            <div className="font-semibold text-emerald-700">{formatCurrency(row.original.rental.total)}</div>
            <div className="text-xs text-muted-foreground">Renta #{row.original.rental.id}</div>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
      },
      {
        accessorKey: "created_at",
        header: "Alta",
        meta: { exportValue: (q) => excelDate(q.created_at) },
        cell: ({ row }) => formatDate(row.original.created_at),
      },
      createActionsColumn<QuoteRecord>({
        actions,
      }),
    ]},
    [onView, onChangeStatus, onConvertToRental, onDownload, onDuplicate, onEdit, can]
  )
}
