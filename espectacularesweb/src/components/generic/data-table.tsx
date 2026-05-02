import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import type {
  ColumnDef,
  SortingState,
  Table as TanstackTable,
  PaginationState,
  RowSelectionState,
  OnChangeFn,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type DataTableProps<TData> = {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  title?: string;
  description?: string;

  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;

  getRowId?: (row: TData, index: number) => string;

  /** Muestra input de búsqueda (global) */
  enableSearch?: boolean;
  searchPlaceholder?: string;

  /**
   * ✅ Search controlado (para server-side)
   * Si se manda searchValue + onSearchChange, el DataTable NO filtra local,
   * solo refleja el valor y dispara el callback.
   */
  searchValue?: string;
  onSearchChange?: (value: string) => void;

  /** Paginación */
  pageSize?: number;
  enablePagination?: boolean;

  /**
   * Server-side pagination
   * Cuando está activo, el DataTable NO pagina localmente
   * y usa pageIndex/pageCount/onPageChange para navegar.
   */
  manualPagination?: boolean;
  pageIndex?: number; // 0-based
  pageCount?: number; // total pages
  onPageChange?: (pageIndex: number) => void;

  /** (opcional) para deshabilitar botones mientras carga */
  isLoading?: boolean;

  /** Fila clickeable */
  onRowClick?: (row: TData) => void;

  /** Toolbar extra (botones, etc.) */
  renderToolbar?: (table: TanstackTable<TData>) => React.ReactNode;

  className?: string;
};

export function DataTable<TData>({
  columns,
  data,
  title,
  description,
  enableSearch = true,
  rowSelection,
  onRowSelectionChange,
  getRowId,
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
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // Si se pasan estas props, el search es server-side (controlado)
  const isControlledSearch =
    typeof searchValue === "string" && typeof onSearchChange === "function";

  // Solo usado cuando el search NO es controlado (client-side)
  const [globalFilter, setGlobalFilter] = React.useState("");

  const searchText = isControlledSearch
    ? (searchValue ?? "")
    : (globalFilter ?? "");

  const handleSearch = (value: string) => {
    if (isControlledSearch) onSearchChange?.(value);
    else setGlobalFilter(value);
  };

  // Pagination state:
  // - client-side: interno (si manualPagination=false)
  // - server-side: viene de props (pageIndex) y se notifica con onPageChange
  const paginationState: PaginationState = {
    pageIndex: manualPagination ? (pageIndex ?? 0) : 0,
    pageSize,
  };

  const table = useReactTable({
    data,
    columns,
    getRowId,
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
      if (!manualPagination) return;

      const next =
        typeof updater === "function" ? updater(paginationState) : updater;

      onPageChange?.(next.pageIndex);
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
  });

  const currentPage = table.getState().pagination.pageIndex + 1;
  const totalPages = manualPagination ? (pageCount ?? 1) : table.getPageCount();

  const canPrev = manualPagination
    ? (pageIndex ?? 0) > 0
    : table.getCanPreviousPage();

  const canNext = manualPagination
    ? (pageIndex ?? 0) < totalPages - 1
    : table.getCanNextPage();

  return (
    <div className={cn("space-y-6", className)}>
      {(title || description || enableSearch || renderToolbar) && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title && <div className="text-2xl font-bold text-gray-800">{title}</div>}
            {description && (
              <div className="text-sm text-gray-600">{description}</div>
            )}
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            {renderToolbar?.(table)}

            {enableSearch && (
              <Input
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="sm:w-72 rounded-lg border-gray-300 focus:ring-purple-500 focus:border-purple-500 bg-white"
              />
            )}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-gradient-to-r from-purple-600 to-indigo-600">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="px-6 py-4 text-white font-semibold uppercase tracking-wider text-xs">
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

          <TableBody className="divide-y divide-gray-100">
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={
                    onRowClick ? () => onRowClick(row.original) : undefined
                  }
                  className={cn(
                    "hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 transition-colors",
                    onRowClick && "cursor-pointer",
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-6 py-4 text-gray-700">
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
                  className="h-32 text-center text-gray-500 italic"
                >
                  Sin resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {enablePagination && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm font-medium text-gray-600">
            Página <span className="text-purple-600">{currentPage}</span> de <span className="text-purple-600">{totalPages}</span>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg px-4 border-gray-300 hover:bg-purple-50 hover:text-purple-600"
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
              className="rounded-lg px-4 border-gray-300 hover:bg-purple-50 hover:text-purple-600"
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
  );
}
