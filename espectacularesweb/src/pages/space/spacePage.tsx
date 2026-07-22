import * as React from "react";
import type { FilterValues } from "@/types/Filter";
import type { Space } from "@/types/Space";
import { useNavigate } from "react-router-dom";

import { DataTable } from "@/components/generic/data-table";
import { Filter } from "@/components/generic/filter";

import { downloadSpacesCatalog } from "@/lib/pdf/downloadSpacesCatalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  CircleCheckBig,
  CircleOff,
  ChevronLeft,
  ChevronRight,
  FileDown,
  Lightbulb,
  MapPinned,
  Plus,
  Search,
} from "lucide-react";
import type { RowSelectionState } from "@tanstack/react-table";

import { useSpaces, useDeleteSpace } from "@/lib/hooks/spaceHook";
import { apiToUiSpace, buildSpacesParams } from "@/lib/mappers/spaceMapper";
import { useSpaceTable } from "./spaceTable";

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
  const [viewOpen, setViewOpen] = React.useState(false);
  const [viewingSpace, setViewingSpace] = React.useState<Space | null>(null);
  const [activeImageIndex, setActiveImageIndex] = React.useState(0);

  // Deletion state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [spaceToDelete, setSpaceToDelete] = React.useState<Space | null>(null);

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
  const totalSpaces = meta?.total ?? 0;
  const visibleAvailableSpaces = data.filter(
    (space) => space.status === "Disponible",
  ).length;
  const visibleBlockedSpaces = data.filter(
    (space) => space.status === "Bloqueado",
  ).length;
  const visibleLitSpaces = data.filter((space) => space.has_lights).length;

  const { columns } = useSpaceTable({
    onQuote: (row) => {
      navigate("/cotizaciones/nueva", {
        state: {
          spaces: [
            {
              id: row.id,
              title: row.title,
              price: row.price ?? 0,
              faces: row.faces ?? null,
            },
          ],
        },
      });
    },
    onView: (row) => {
      setActiveImageIndex(0);
      setViewingSpace(row);
      setViewOpen(true);
    },
    onEdit: (row) => {
      navigate(`/espacios/${row.id}/editar`);
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
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el espacio."
      );
    } finally {
      setSpaceToDelete(null);
    }
  };

  const selectedSpaces = React.useMemo(() => {
    return data.filter((space) => rowSelection[String(space.id)]);
  }, [rowSelection, data]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
            <MapPinned className="h-3.5 w-3.5" />
            Control de espacios
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Espacios</h1>
            <p className="mt-2 max-w-2xl text-gray-600">
              Revisa y administra los espacios publicitarios desde una sola pantalla.
            </p>
          </div>
        </div>

        <Can role="admin">
          <Button
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg px-6 py-6 shadow-lg transform hover:-translate-y-0.5 transition-all border-none"
            onClick={() => navigate("/espacios/nuevo")}
          >
            <Plus className="h-4 w-4" />
            Nuevo espacio
          </Button>
        </Can>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-gray-200 shadow-md">
          <CardHeader className="pb-3">
            <CardDescription>Total registrados</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <MapPinned className="h-5 w-5 text-purple-600" />
              {totalSpaces}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-gray-200 shadow-md">
          <CardHeader className="pb-3">
            <CardDescription>Disponibles en página</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <CircleCheckBig className="h-5 w-5 text-emerald-600" />
              {visibleAvailableSpaces}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-gray-200 shadow-md">
          <CardHeader className="pb-3">
            <CardDescription>Bloqueados en página</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <CircleOff className="h-5 w-5 text-slate-500" />
              {visibleBlockedSpaces}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-gray-200 shadow-md">
          <CardHeader className="pb-3">
            <CardDescription>Con iluminación en página</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              {visibleLitSpaces}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-gray-200 shadow-lg">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <CardTitle className="text-xl">Búsqueda rápida</CardTitle>
              <CardDescription>
                Filtra por ID, título, tipo o estatus.
              </CardDescription>
            </div>

            <div className="flex w-full flex-col gap-3 lg:flex-row xl:w-auto xl:items-center">
              <div className="relative w-full lg:min-w-80 xl:w-96">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Buscar espacio..."
                  className="rounded-xl border-gray-300 bg-white pl-10 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex gap-2 rounded-lg border-gray-300 shadow-sm hover:bg-purple-50 hover:text-purple-600"
                      disabled={selectedSpaces.length === 0}
                    >
                      <FileDown className="h-4 w-4" />
                      Descargar PDF
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-56">
                    <DropdownMenuLabel>Versión del catálogo</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => downloadSpacesCatalog(selectedSpaces, "v2")}>
                      <div>
                        <p className="font-medium">Diseño nuevo · V2</p>
                        <p className="text-xs text-muted-foreground">Formato editorial actualizado</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => downloadSpacesCatalog(selectedSpaces, "v1")}>
                      <div>
                        <p className="font-medium">Diseño anterior · V1</p>
                        <p className="text-xs text-muted-foreground">Formato clásico del catálogo</p>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  className="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md transition-all hover:from-purple-700 hover:to-indigo-700"
                  disabled={selectedSpaces.length === 0}
                  onClick={() => {
                    navigate("/cotizaciones/nueva", {
                      state: { spaces: selectedSpaces },
                    });
                  }}
                >
                  Crear cotización
                </Button>
              </div>
            </div>
          </div>

          <Separator />
        </CardHeader>

        <CardContent className="space-y-6 pt-0">
          <Filter
            title="Filtros avanzados"
            enableDateRange
            initialValues={filters}
            defaultOpen={false}
            className="border-gray-200 bg-slate-50/60 shadow-none"
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
          />

          <DataTable
            columns={columns}
            data={data}
            enableSearch={false}
            getRowId={(row) => String(row.id)}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            enableRowSelection={(row) => row.original.status === "Disponible"}
            pageSize={perPage}
            enablePagination
            manualPagination
            pageIndex={(meta?.page ?? page) - 1}
            pageCount={totalPages}
            onPageChange={(nextPageIndex) => setPage(nextPageIndex + 1)}
            isLoading={spacesQuery.isFetching}
          />
        </CardContent>
      </Card>

      <Dialog
        open={viewOpen}
        onOpenChange={(open) => {
          setViewOpen(open);
          if (!open) {
            setViewingSpace(null);
            setActiveImageIndex(0);
          }
        }}
      >
        <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-2xl grid-rows-[auto_minmax(0,1fr)] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Detalle del espacio</DialogTitle>
            <DialogDescription>
              Información general del espacio seleccionado.
            </DialogDescription>
          </DialogHeader>

          {viewingSpace ? (
            <div className="min-h-0 space-y-4 overflow-y-auto overscroll-contain pr-1 sm:pr-2">
              {(() => {
                const images = viewingSpace.imageUrls?.length
                  ? viewingSpace.imageUrls
                  : viewingSpace.coverImageUrl
                    ? [viewingSpace.coverImageUrl]
                    : [];
                const currentImage = images[activeImageIndex] ?? images[0];

                if (!currentImage) return null;

                const goToPrevious = () => {
                  setActiveImageIndex((current) => (current - 1 + images.length) % images.length);
                };
                const goToNext = () => {
                  setActiveImageIndex((current) => (current + 1) % images.length);
                };

                return (
                  <div className="space-y-3">
                    <div className="group relative overflow-hidden rounded-xl border border-violet-100 bg-slate-100">
                      <img
                        src={currentImage}
                        alt={`${viewingSpace.title}, imagen ${activeImageIndex + 1}`}
                        className="h-64 w-full object-cover sm:h-80"
                      />

                      {images.length > 1 ? (
                        <>
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 shadow-lg hover:bg-white"
                            onClick={goToPrevious}
                            aria-label="Imagen anterior"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 shadow-lg hover:bg-white"
                            onClick={goToNext}
                            aria-label="Imagen siguiente"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </Button>
                          <div className="absolute bottom-3 right-3 rounded-full bg-slate-950/70 px-3 py-1 text-xs font-medium text-white">
                            {activeImageIndex + 1} / {images.length}
                          </div>
                        </>
                      ) : null}
                    </div>

                    {images.length > 1 ? (
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {images.map((image, index) => (
                          <button
                            key={`${image}-${index}`}
                            type="button"
                            onClick={() => setActiveImageIndex(index)}
                            className={`shrink-0 overflow-hidden rounded-lg border-2 transition ${
                              index === activeImageIndex
                                ? "border-violet-600 ring-2 ring-violet-100"
                                : "border-transparent opacity-70 hover:opacity-100"
                            }`}
                            aria-label={`Ver imagen ${index + 1}`}
                          >
                            <img
                              src={image}
                              alt=""
                              className="h-16 w-24 object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground">Título</p>
                  <p className="font-medium">{viewingSpace.title}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">ID asignado</p>
                  <p className="font-medium">{viewingSpace.assigned_id ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Precio</p>
                  <p className="font-medium">
                    {new Intl.NumberFormat("es-MX", {
                      style: "currency",
                      currency: "MXN",
                    }).format(Number(viewingSpace.price ?? 0))}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Estatus</p>
                  <p className="font-medium">{viewingSpace.status}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tipo</p>
                  <p className="font-medium">{viewingSpace.type ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tipo de vista</p>
                  <p className="font-medium">{viewingSpace.viewType ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Nivel socioeconómico</p>
                  <p className="font-medium">{viewingSpace.socioeconomic_level ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Caras</p>
                  <p className="font-medium">{viewingSpace.faces ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ancho</p>
                  <p className="font-medium">{viewingSpace.width_m ?? "—"} m</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Alto</p>
                  <p className="font-medium">{viewingSpace.height_m ?? "—"} m</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Coordenadas</p>
                  <p className="font-medium">
                    {viewingSpace.coords?.lat ?? viewingSpace.latitude ?? "—"},{" "}
                    {viewingSpace.coords?.lng ?? viewingSpace.longitude ?? "—"}
                  </p>
                </div>
              </div>

              {viewingSpace.description ? (
                <div>
                  <p className="mb-1 text-sm text-muted-foreground">Descripción</p>
                  <p className="whitespace-pre-wrap text-sm">{viewingSpace.description}</p>
                </div>
              ) : null}

              {viewingSpace.comments ? (
                <div>
                  <p className="mb-1 text-sm text-muted-foreground">Comentarios</p>
                  <p className="whitespace-pre-wrap text-sm">{viewingSpace.comments}</p>
                </div>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

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
