import { spaceTypeLabel } from "@/lib/helpers/spaceTypeHelper";
import { excelDate } from "@/lib/exportExcel";
import * as React from "react";
import { SortHeader, type SortDirection } from "@/components/generic/sort-header";
import type { ColumnDef } from "@tanstack/react-table";
import type { TableAction } from "@/types/TableAction";
import type { Space } from "@/types/Space";

import { Checkbox } from "@/components/ui/checkbox";
import { createActionsColumn } from "@/components/generic/create-actions-column";
import { Pencil, Eye, Trash2, FileText } from "lucide-react";

import { useRoles } from "@/hooks/useRoles";

type BuildSpaceTableOptions = {
  onQuote?: (row: Space) => void;
  onView?: (row: Space) => void;
  onEdit?: (row: Space) => void;
  onDelete?: (row: Space) => Promise<void> | void;
  sortDirection?: SortDirection;
  onToggleSort?: () => void;
};

function formatShortDate(value: string) {
  const parsed = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric" }).format(parsed);
}

export function useSpaceTable(opts: BuildSpaceTableOptions = {}) {
  const { can } = useRoles();

  /** ACCIONES DEL DATATABLE */
  const actions = React.useMemo<TableAction<Space>[]>(() => {
    const baseActions: TableAction<Space>[] = [];

    if (can("quotes.edit")) {
      baseActions.push({
        key: "quote",
        label: "Cotizar",
        icon: <FileText className="h-4 w-4" />,
        // Un espacio ocupado se puede cotizar para fechas futuras; al convertir se valida el empalme.
        disabled: (row) => row.status === "Bloqueado",
        onClick: (row) =>
          opts.onQuote ? opts.onQuote(row) : console.log("Cotizar", row.id),
      });
    }

    baseActions.push({
        key: "view",
        label: "Ver",
        icon: <Eye className="h-4 w-4" />,
        onClick: (row) =>
          opts.onView ? opts.onView(row) : console.log("Ver", row.id),
      });

    if (can("spaces.edit")) {
      baseActions.push({
          key: "edit",
          label: "Editar",
          icon: <Pencil className="h-4 w-4" />,
          onClick: (row) =>
            opts.onEdit ? opts.onEdit(row) : console.log("Editar", row.id),
        });
    }

    if (can("spaces.delete")) {
      baseActions.push({
          key: "delete",
          label: "Eliminar",
          variant: "destructive",
          icon: <Trash2 className="h-4 w-4" />,
          separatorBefore: true,
          onClick: async (row) => {
            if (opts.onDelete) return opts.onDelete(row);
            console.log("Eliminar", row.id);
          },
        });
    }

    return baseActions;
  }, [opts, can]);

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
        meta: { exportLabel: "ID anuncio" },
        header: () => opts.onToggleSort
          ? <SortHeader label="ID Asignado" direction={opts.sortDirection ?? "asc"} onToggle={opts.onToggleSort} />
          : "ID Asignado",
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("assigned_id")}</div>
        ),
      },
      {
        accessorKey: "title",
        meta: { exportLabel: "Nombre" },
        header: "Título",
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("title")}</div>
        ),
      },
      {
        accessorKey: "status",
        meta: { exportLabel: "Estatus" },
        header: "Estatus",
        cell: ({ row }) => {
          const status = row.original.status;
          const tone =
            status === "Disponible"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : status === "Ocupado"
                ? "border-sky-200 bg-sky-50 text-sky-700"
                : "border-amber-200 bg-amber-50 text-amber-700";
          const until = row.original.occupied_until;

          return (
            <div className="space-y-1">
              <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${tone}`}>
                {status}
              </span>
              {status === "Ocupado" && until ? (
                <div className="text-xs text-muted-foreground">hasta {formatShortDate(until)}</div>
              ) : null}
            </div>
          );
        },
      },
      {
        accessorKey: "type",
        meta: { exportLabel: "Tipo", exportValue: (space) => spaceTypeLabel(space.type, space.subtype) },
        header: "Tipo",
        cell: ({ row }) => (
          <div className="font-medium">{spaceTypeLabel(row.original.type, row.original.subtype)}</div>
        ),
      },
      {
        accessorKey: "width_m",
        meta: { exportLabel: "Ancho (m)", exportValue: (space) => space.width_m ?? "" },
        header: "Ancho (m)",
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("width_m")}</div>
        ),
      },
      {
        accessorKey: "height_m",
        meta: { exportLabel: "Alto (m)", exportValue: (space) => space.height_m ?? "" },
        header: "Alto (m)",
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("height_m")}</div>
        ),
      },
      {
        accessorKey: "faces",
        meta: { exportLabel: "Caras" },
        header: "No. de caras",
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("faces")}</div>
        ),
      },
      {
        accessorKey: "has_lights",
        meta: { exportLabel: "Iluminación" },
        header: "Tiene luces?",
        cell: ({ row }) => (
          <div className="font-medium">
            {row.getValue("has_lights") ? "Sí" : "No"}
          </div>
        ),
      },
      {
        accessorKey: "is_rotating",
        header: "Rotativo",
        cell: ({ row }) => (
          <span className={row.original.is_rotating ? "font-semibold text-violet-700" : "text-muted-foreground"}>
            {row.original.is_rotating ? "Sí" : "No"}
          </span>
        ),
      },
      {
        accessorKey: "price",
        meta: { exportLabel: "Precio", exportValue: (space) => (space.price === undefined || space.price === null ? "" : Number(space.price)) },
        header: "Precio",
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
        meta: { exportLabel: "Nivel socioeconómico" },
        header: "Nivel socioeconómico",
        cell: ({ row }) => (
          <div className="font-medium">
            {row.getValue("socioeconomic_level")}
          </div>
        ),
      },
      {
        accessorKey: "viewType",
        meta: { exportLabel: "Tipo de vista" },
        header: "Tipo de vista",
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("viewType")}</div>
        ),
      },
      {
        accessorKey: "coords",
        meta: { exportColumns: [{ label: "Latitud", value: (space) => space.latitude ?? "" }, { label: "Longitud", value: (space) => space.longitude ?? "" }] },
        header: "Coords",
        cell: ({ row }) => {
          const c = row.getValue("coords") as Space["coords"];
          return `${c.lat.toFixed(6)}, ${c.lng.toFixed(6)}`;
        },
      },
      {
        accessorKey: "createdAt",
        meta: { exportLabel: "Alta", exportValue: (space) => excelDate(space.createdAt) },
        header: "Creado",
      },
      createActionsColumn<Space>({
        header: "Acciones",
        actions,
        align: "end",
      }),
    ];
  }, [actions, opts.sortDirection, opts.onToggleSort]);

  return { columns, actions };
}
