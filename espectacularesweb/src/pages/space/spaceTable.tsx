import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import type { TableAction } from "@/types/TableAction"
import type { Space } from "@/types/Space"

import { Button } from "@/components/ui/button"
import { createActionsColumn } from "@/components/generic/create-actions-column"
import { Pencil, Eye, Trash2, FileText } from "lucide-react"

type BuildSpaceTableOptions = {
  onQuote?: (row: Space) => void
  onView?: (row: Space) => void
  onEdit?: (row: Space) => void
  onDelete?: (row: Space) => Promise<void> | void
}

export function useSpaceTable(opts: BuildSpaceTableOptions = {}) {
  const actions = React.useMemo<TableAction<Space>[]>(() => {
    return [
      {
        key: "quote",
        label: "Cotizar",
        icon: <FileText className="h-4 w-4" />,
        onClick: (row) => (opts.onQuote ? opts.onQuote(row) : console.log("Cotizar", row.id)),
      },
      {
        key: "view",
        label: "Ver",
        icon: <Eye className="h-4 w-4" />,
        onClick: (row) => (opts.onView ? opts.onView(row) : console.log("Ver", row.id)),
      },
      {
        key: "edit",
        label: "Editar",
        icon: <Pencil className="h-4 w-4" />,
        onClick: (row) => (opts.onEdit ? opts.onEdit(row) : console.log("Editar", row.id)),
      },
      {
        key: "delete",
        label: "Eliminar",
        variant: "destructive",
        icon: <Trash2 className="h-4 w-4" />,
        separatorBefore: true,
        onClick: async (row) => {
          if (opts.onDelete) return opts.onDelete(row)
          const ok = confirm(`¿Eliminar "${row.title}"?`)
          if (!ok) return
          console.log("Eliminar", row.id)
        },
      },
    ]
  }, [opts])

  const columns = React.useMemo<ColumnDef<Space>[]>(() => {
    return [
      {
        accessorKey: "title",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Título
          </Button>
        ),
        cell: ({ row }) => <div className="font-medium">{row.getValue("title")}</div>,
      },
      {
        accessorKey: "price",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Precio
          </Button>
        ),
        cell: ({ row }) => {
          const v = row.getValue("price") as number | undefined
          return v === undefined ? "-" : `$${v.toLocaleString("es-MX")}`
        },
      },
      {
        accessorKey: "coords",
        header: "Coords",
        cell: ({ row }) => {
          const c = row.getValue("coords") as Space["coords"]
          return `${c.lat.toFixed(6)}, ${c.lng.toFixed(6)}`
        },
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Estatus
          </Button>
        ),
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Creado
          </Button>
        ),
      },
      createActionsColumn<Space>({
        header: "Acciones",
        actions,
        align: "end",
      }),
    ]
  }, [actions])

  return { columns, actions }
}