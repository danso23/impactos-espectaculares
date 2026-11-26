import type { ColumnDef } from "@tanstack/react-table"

import { Checkbox } from "@/components/ui/checkbox"

/** Columna de casillas para seleccionar filas (p. ej. para exportar solo esas). */
export function createSelectColumn<TData>(): ColumnDef<TData, unknown> {
  return {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        className="h-5 w-5 rounded-md border-2 border-white bg-white/15 text-violet-700 shadow-sm data-[state=checked]:border-white data-[state=checked]:bg-white data-[state=checked]:text-violet-700 focus-visible:ring-white/70"
        aria-label="Seleccionar todo"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        disabled={!row.getCanSelect()}
        onClick={(event) => event.stopPropagation()}
        aria-label="Seleccionar fila"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    meta: { exportable: false },
  }
}
