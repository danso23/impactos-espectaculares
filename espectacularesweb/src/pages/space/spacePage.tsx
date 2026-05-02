import * as React from "react";
import type { FilterValues } from "@/types/Filter";
import type { Space } from "@/types/Space";
import { useNavigate } from "react-router-dom";

import { DataTable } from "@/components/generic/data-table";
import { Filter } from "@/components/generic/filter";
import { SpaceForm } from "./spaceForm";

import { downloadSpacesCatalog } from "@/lib/pdf/downloadSpacesCatalog";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import type { RowSelectionState } from "@tanstack/react-table";

import {
  useCreateSpace,
  useSpaces,
  useUpdateSpace,
  useDeleteSpace,
} from "@/lib/hooks/spaceHook";
import { apiToUiSpace, buildSpacesParams } from "@/lib/mappers/spaceMapper";
import { useSpaceTable } from "./spaceTable";
import { asViewType } from "@/lib/helpers/viewTypeHelper";
import { asSpaceType } from "@/lib/helpers/spaceTypeHelper";

import { Can } from "@/components/auth/Can";
import { DeleteConfirmDialog } from "@/components/generic/delete-confirm-dialog";
import { toast } from "sonner";

const initialFilters: FilterValues = {
  dateFrom: undefined,
  dateTo: undefined,
  selects: {
    tipo: undefined,
    conLuz: undefined,
    estatus: undefined,
  },
  checks: {
    activo: undefined,
  },
};

export default function SpacePage() {
  const navigate = useNavigate();
  const [filters, setFilters] = React.useState<FilterValues>(initialFilters);
  const [page, setPage] = React.useState(1);
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const perPage = 10;
  const [editOpen, setEditOpen] = React.useState(false);
  const [editingSpace, setEditingSpace] = React.useState<Space | null>(null);

  // Deletion state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [spaceToDelete, setSpaceToDelete] = React.useState<Space | null>(null);

  const createMutation = useCreateSpace();
  const updateMutation = useUpdateSpace();
  const deleteMutation = useDeleteSpace();

  React.useEffect(() => {
    const t = window.setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);

    return () => window.clearTimeout(t);
  }, [searchInput]);

  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const handleApplyFilters = (v: FilterValues) => {
    setFilters(v);
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters(initialFilters);
    setPage(1);
  };

  const params = React.useMemo(
    () => buildSpacesParams(filters, page, perPage, search),
    [filters, page, perPage, search],
  );

  const spacesQuery = useSpaces(params);

  const rowsApi = React.useMemo(
    () => spacesQuery.data?.data ?? [],
    [spacesQuery.data?.data],
  );

  const meta = spacesQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  const data: Space[] = React.useMemo(
    () => rowsApi.map(apiToUiSpace),
    [rowsApi],
  );

  const { columns } = useSpaceTable({
    onEdit: (row) => {
      setEditingSpace(row);
      setEditOpen(true);
    },
    onDelete: (row) => {
      setSpaceToDelete(row);
      setDeleteDialogOpen(true);
    },
  });

  const handleConfirmDelete = async () => {
    if (!spaceToDelete) return;
    try {
      await deleteMutation.mutateAsync(spaceToDelete.id);
      toast.success("Espacio eliminado correctamente.");
      setDeleteDialogOpen(false);
    } catch {
      toast.error("No se pudo eliminar el espacio.");
    } finally {
      setSpaceToDelete(null);
    }
  };

  const selectedSpaces = React.useMemo(() => {
    return data.filter((space) => rowSelection[String(space.id)]);
  }, [rowSelection, data]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Espacios</h1>
          <p className="text-gray-600">Gestiona los espacios publicitarios disponibles.</p>
        </div>
        
        <div className="flex gap-3">
          <Can role="admin">
            <SpaceForm
              mode="create"
              trigger={
                <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg px-6 py-6 shadow-lg transform hover:-translate-y-0.5 transition-all border-none">
                  Agregar espacio
                </Button>
              }
              onSubmit={async (payload) => {
                await createMutation.mutateAsync(payload);
              }}
              isSubmitting={createMutation.isPending}
              onSaved={() => spacesQuery.refetch()}
            />
          </Can>
        </div>
      </div>

      <Filter
        title="Filtros de búsqueda"
        enableDateRange
        initialValues={filters}
        defaultOpen={false}
        dropdowns={[
          {
            key: "estatus",
            label: "Estatus",
            placeholder: "Selecciona",
            options: [
              { label: "Disponible", value: "disponible" },
              { label: "Bloqueado", value: "bloqueado" },
            ],
          },
          {
            key: "tipo",
            label: "Tipo",
            placeholder: "Selecciona tipo",
            options: [
              { label: "Espectacular", value: "Espectacular" },
              { label: "Muro", value: "Muro" },
              { label: "Parabús", value: "Parabus" },
            ],
          },
          {
            key: "conLuz",
            label: "Con luz",
            placeholder: "Selecciona",
            options: [
              { label: "Sí", value: "1" },
              { label: "No", value: "0" },
            ],
          },
        ]}
        checkboxes={[{ key: "activo", label: "Activo" }]}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        applyOnReset={true}
        actions={
          <>
            <Button
              variant="outline"
              className="flex gap-2 rounded-lg border-gray-300 hover:bg-purple-50 hover:text-purple-600"
              disabled={selectedSpaces.length === 0}
              onClick={() => downloadSpacesCatalog(selectedSpaces)}
            >
              <FileDown className="h-4 w-4" />
              Descargar catálogo PDF
            </Button>

            <Button
              disabled={selectedSpaces.length === 0}
              className="rounded-lg bg-gray-500 hover:bg-gray-600 text-white shadow-md transition-all disabled:opacity-50"
              onClick={() => {
                navigate("/cotizaciones/nueva", {
                  state: { spaces: selectedSpaces },
                });
              }}
            >
              Crear cotización
            </Button>
          </>
        }
      />

      {editingSpace ? (
        <SpaceForm
          mode="edit"
          title="Editar espacio"
          hideTrigger
          open={editOpen}
          onOpenChange={(v) => {
            setEditOpen(v);
            if (!v) setEditingSpace(null);
          }}
          initialValues={{
            faces: editingSpace.faces,
            assigned_id: editingSpace.assigned_id ?? "",
            title: editingSpace.title ?? "",
            price: editingSpace.price,
            type: asSpaceType(editingSpace.type),
            width_m: editingSpace.width_m
              ? parseFloat(editingSpace.width_m.toString())
              : undefined,
            height_m: editingSpace.height_m
              ? parseFloat(editingSpace.height_m.toString())
              : undefined,
            has_lights: editingSpace.has_lights ?? false,
            viewType: asViewType(editingSpace.viewType),

            latitude: editingSpace.coords?.lat,
            longitude: editingSpace.coords?.lng,
            socioeconomic_level: editingSpace.socioeconomic_level ?? "",
            description: editingSpace.description ?? "",
            comments: editingSpace.comments ?? "",
          }}
          isSubmitting={updateMutation.isPending}
          onSubmit={async (payload) => {
            await updateMutation.mutateAsync({
              id: editingSpace.id,
              payload,
            });
            await spacesQuery.refetch();
          }}
        />
      ) : null}

      <DataTable
        columns={columns}
        data={data}
        enableSearch
        getRowId={(row) => String(row.id)}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        searchPlaceholder="Buscar..."
        searchValue={searchInput}
        onSearchChange={(v) => {
          setSearchInput(v);
          setPage(1);
        }}
        pageSize={perPage}
        enablePagination
        manualPagination
        pageIndex={(meta?.page ?? page) - 1}
        pageCount={totalPages}
        onPageChange={(nextPageIndex) => setPage(nextPageIndex + 1)}
        isLoading={spacesQuery.isFetching}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        itemName={spaceToDelete?.title}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
