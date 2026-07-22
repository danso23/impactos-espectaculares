import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { TableAction } from "@/types/TableAction";
import type { Space } from "@/types/Space";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { createActionsColumn } from "@/components/generic/create-actions-column";
import { Pencil, Eye, Trash2, FileText } from "lucide-react";

import { useRoles } from "@/hooks/useRoles";

type BuildSpaceTableOptions = {
  onQuote?: (row: Space) => void;
  onView?: (row: Space) => void;
  onEdit?: (row: Space) => void;
  onDelete?: (row: Space) => Promise<void> | void;
};

export function useSpaceTable(opts: BuildSpaceTableOptions = {}) {
  const { hasRole } = useRoles();

  /** ACCIONES DEL DATATABLE */
  const actions = React.useMemo<TableAction<Space>[]>(() => {
    const baseActions: TableAction<Space>[] = [
      {
        key: "quote",
        label: "Cotizar",
        icon: <FileText className="h-4 w-4" />,
        disabled: (row) => row.status !== "Disponible",
        onClick: (row) =>
          opts.onQuote ? opts.onQuote(row) : console.log("Cotizar", row.id),
      },
      {
        key: "view",
        label: "Ver",
        icon: <Eye className="h-4 w-4" />,
        onClick: (row) =>
          opts.onView ? opts.onView(row) : console.log("Ver", row.id),
      },
    ];

    if (hasRole("admin")) {
      baseActions.push(
        {
          key: "edit",
          label: "Editar",
          icon: <Pencil className="h-4 w-4" />,
          onClick: (row) =>
            opts.onEdit ? opts.onEdit(row) : console.log("Editar", row.id),
        },
        {
          key: "delete",
          label: "Eliminar",
          variant: "destructive",
          icon: <Trash2 className="h-4 w-4" />,
          separatorBefore: true,
          onClick: async (row) => {
            if (opts.onDelete) return opts.onDelete(row);
            console.log("Eliminar", row.id);
          },
        }
      );
    }

    return baseActions;
  }, [opts, hasRole]);

  const columns = React.useMemo<ColumnDef<Space>[]>(() => {
    return [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            className="h-5 w-5 rounded-md border-2 border-white bg-white/15 text-violet-700 shadow-sm data-[state=checked]:border-white data-[state=checked]:bg-white data-[state=checked]:text-violet-700 focus-visible:ring-white/70"
            aria-label="Seleccionar todo"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            disabled={!row.getCanSelect()}
            aria-label="Seleccionar fila"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "assigned_id",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            ID Asignado
          </Button>
        ),
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("assigned_id")}</div>
        ),
      },
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
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("title")}</div>
        ),
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
        cell: ({ row }) => {
          const status = row.original.status;
          const available = status === "Disponible";

          return (
            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
                available
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
              }`}
            >
              {status}
            </span>
          );
        },
      },
      {
        accessorKey: "type",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Tipo
          </Button>
        ),
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("type")}</div>
        ),
      },
      {
        accessorKey: "width_m",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Ancho (m)
          </Button>
        ),
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("width_m")}</div>
        ),
      },
      {
        accessorKey: "height_m",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Alto (m)
          </Button>
        ),
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("height_m")}</div>
        ),
      },
      {
        accessorKey: "faces",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            No. de caras
          </Button>
        ),
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("faces")}</div>
        ),
      },
      {
        accessorKey: "has_lights",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Tiene luces?
          </Button>
        ),
        cell: ({ row }) => (
          <div className="font-medium">
            {row.getValue("has_lights") ? "Sí" : "No"}
          </div>
        ),
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
          const rawValue = row.getValue<string | null>("price");

          if (!rawValue) return <span>—</span>;

          const value = Number(rawValue);

          if (isNaN(value)) return <span>—</span>;

          return (
            <span className="font-medium">
              {new Intl.NumberFormat("es-MX", {
                style: "currency",
                currency: "MXN",
              }).format(value)}
            </span>
          );
        },
      },
      {
        accessorKey: "socioeconomic_level",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Nivel socioeconómico
          </Button>
        ),
        cell: ({ row }) => (
          <div className="font-medium">
            {row.getValue("socioeconomic_level")}
          </div>
        ),
      },
      {
        accessorKey: "viewType",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Tipo de vista
          </Button>
        ),
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("viewType")}</div>
        ),
      },
      {
        accessorKey: "coords",
        header: "Coords",
        cell: ({ row }) => {
          const c = row.getValue("coords") as Space["coords"];
          return `${c.lat.toFixed(6)}, ${c.lng.toFixed(6)}`;
        },
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
    ];
  }, [actions]);

  return { columns, actions };
}
