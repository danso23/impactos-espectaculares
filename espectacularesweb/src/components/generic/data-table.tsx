/* eslint-disable */
import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import type {
  ColumnDef,
  SortingState,
  Table as TanstackTable,
  PaginationState,
  RowSelectionState,
  OnChangeFn,
} from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

type DataTableProps<TData> = {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  title?: string
  description?: string

  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;

  /** Muestra input de búsqueda (global) */
  enableSearch?: boolean
  searchPlaceholder?: string

  /**
   * Search controlado (para server-side)
   * Si se manda searchValue + onSearchChange, el DataTable NO filtra local,
   * solo refleja el valor y dispara el callback.
   */
  searchValue?: string
  onSearchChange?: (value: string) => void

  /** Paginación */
  pageSize?: number
  enablePagination?: boolean

  /**
   * Server-side pagination
   * Cuando está activo, el DataTable NO pagina localmente
   * y usa pageIndex/pageCount/onPageChange para navegar.
   */
  manualPagination?: boolean
  pageIndex?: number // 0-based
  pageCount?: number // total pages
  onPageChange?: (pageIndex: number) => void

  /** (opcional) para deshabilitar botones mientras carga */
  isLoading?: boolean

  /** Fila clickeable */
  onRowClick?: (row: TData) => void

  /** Toolbar extra (botones, etc.) */
  renderToolbar?: (table: TanstackTable<TData>) => React.ReactNode

  className?: string
}

export function DataTable<TData>({
  columns,
  data,
  title,
  description,
  enableSearch = true,
  onRowSelectionChange,
  searchPlaceholder = "Buscar...",
  searchValue,
  onSearchChange,
  pageSize = 10,
  enablePagination = true,

  manualPagination = false,
  pageIndex,
  pageCount,
  onPageChange,
  isLoading = false,

  onRowClick,
  renderToolbar,
  className,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([])

  // Si se pasan estas props, el search es server-side (controlado)
  const isControlledSearch =
    typeof searchValue === "string" && typeof onSearchChange === "function"

  // Solo usado cuando el search NO es controlado (client-side)
  const [globalFilter, setGlobalFilter] = React.useState("")

  const searchText = isControlledSearch
    ? (searchValue ?? "")
    : (globalFilter ?? "")

  const handleSearch = (value: string) => {
    if (isControlledSearch) onSearchChange?.(value)
    else setGlobalFilter(value)
  }

  // Pagination state:
  // - client-side: interno (si manualPagination=false)
  // - server-side: viene de props (pageIndex) y se notifica con onPageChange
  const paginationState: PaginationState = {
    pageIndex: manualPagination ? (pageIndex ?? 0) : 0,
    pageSize,
  }

  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable({
    data,
    columns,

    state: {
      sorting,
      pagination: paginationState,
      rowSelection: rowSelection ?? {},

      ...(isControlledSearch ? {} : { globalFilter }),
    },

    onRowSelectionChange: onRowSelectionChange,
    enableRowSelection: true,

    onSortingChange: setSorting,

    ...(isControlledSearch
      ? {}
      : {
          onGlobalFilterChange: setGlobalFilter,
          globalFilterFn: "includesString",
        }),

    // server-side pagination
    manualPagination,
    pageCount: manualPagination ? (pageCount ?? 1) : undefined,

    onPaginationChange: (updater) => {
      if (!manualPagination) return

      const next =
        typeof updater === "function" ? updater(paginationState) : updater

      onPageChange?.(next.pageIndex)
    },

    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),

    ...(isControlledSearch
      ? {}
      : { getFilteredRowModel: getFilteredRowModel() }),

    getPaginationRowModel: manualPagination
      ? undefined
      : getPaginationRowModel(),

    initialState: manualPagination
      ? undefined
      : {
          pagination: { pageIndex: 0, pageSize },
        },
  })

  const currentPage = table.getState().pagination.pageIndex + 1
  const totalPages = manualPagination ? (pageCount ?? 1) : table.getPageCount()

  const canPrev = manualPagination
    ? (pageIndex ?? 0) > 0
    : table.getCanPreviousPage()

  const canNext = manualPagination
    ? (pageIndex ?? 0) < totalPages - 1
    : table.getCanNextPage()

  return (
    <div className={cn("space-y-3", className)}>
      {(title || description || enableSearch || renderToolbar) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title && <div className="text-base font-semibold">{title}</div>}
            {description && (
              <div className="text-sm text-muted-foreground">{description}</div>
            )}
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            {renderToolbar?.(table)}

            {enableSearch && (
              <Input
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="sm:w-64"
              />
            )}
          </div>
        </div>
      )}

      <div className="rounded-md">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={
                    onRowClick ? () => onRowClick(row.original) : undefined
                  }
                  className={cn(
                    onRowClick && "cursor-pointer hover:bg-muted/50",
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Sin resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {enablePagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                manualPagination
                  ? onPageChange?.((pageIndex ?? 0) - 1)
                  : table.previousPage()
              }
              disabled={!canPrev || isLoading}
            >
              Anterior
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                manualPagination
                  ? onPageChange?.((pageIndex ?? 0) + 1)
                  : table.nextPage()
              }
              disabled={!canNext || isLoading}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}