import * as React from "react";
import type { FilterValues } from "@/types/Filter";
import type { Space } from "@/types/Space";
import { useNavigate } from "react-router-dom";

import { DataTable } from "@/components/generic/data-table";
import { Filter } from "@/components/generic/filter";
import { ModuleHeader } from "@/components/generic/module-header";

import {
  createSpacesCatalogPdf,
  saveSpacesCatalogPdf,
  type SpacesCatalogVersion,
} from "@/lib/pdf/downloadSpacesCatalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogFooter,
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
  Check,
  Copy,
  Download,
  Eye,
  ExternalLink,
  FileDown,
  Lightbulb,
  LoaderCircle,
  MapPinned,
  Plus,
  Search,
  Share2,
} from "lucide-react";
import type { RowSelectionState } from "@tanstack/react-table";

import { useSpaces, useDeleteSpace } from "@/lib/hooks/spaceHook";
import { apiToUiSpace, buildSpacesParams } from "@/lib/mappers/spaceMapper";
import { useSpaceTable } from "./spaceTable";

import { Can } from "@/components/auth/Can";
import { DeleteConfirmDialog } from "@/components/generic/delete-confirm-dialog";
import { toast } from "sonner";
import {
  createCatalogShare,
  type CatalogShareCreated,
} from "@/lib/services/spaceCatalogShareService";

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
    rotativo: undefined,
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
  const [catalogPreviewOpen, setCatalogPreviewOpen] = React.useState(false);
  const [catalogPreviewUrl, setCatalogPreviewUrl] = React.useState<string | null>(null);
  const [catalogPreviewBlob, setCatalogPreviewBlob] = React.useState<Blob | null>(null);
  const [catalogPreviewSpaces, setCatalogPreviewSpaces] = React.useState<Space[]>([]);
  const [catalogPreviewVersion, setCatalogPreviewVersion] =
    React.useState<SpacesCatalogVersion>("v2");
  const [isCatalogPreviewLoading, setIsCatalogPreviewLoading] = React.useState(false);
  const [isCatalogDownloadLoading, setIsCatalogDownloadLoading] = React.useState(false);
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false);
  const [shareDuration, setShareDuration] = React.useState("48");
  const [customShareHours, setCustomShareHours] = React.useState("48");
  const [catalogShare, setCatalogShare] = React.useState<CatalogShareCreated | null>(null);
  const [isCreatingShare, setIsCreatingShare] = React.useState(false);
  const [shareCopied, setShareCopied] = React.useState(false);

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
  const hasBlockedSelection = selectedSpaces.some(
    (space) => space.status === "Bloqueado",
  );

  React.useEffect(() => {
    return () => {
      if (catalogPreviewUrl) URL.revokeObjectURL(catalogPreviewUrl);
    };
  }, [catalogPreviewUrl]);

  const handlePreviewCatalog = async (version: SpacesCatalogVersion) => {
    setIsCatalogPreviewLoading(true);

    try {
      const previewSpaces = [...selectedSpaces];
      const blob = await createSpacesCatalogPdf(previewSpaces, version, {
        enableMapLinks: false,
      });
      setCatalogPreviewBlob(blob);
      setCatalogPreviewSpaces(previewSpaces);
      setCatalogPreviewVersion(version);
      setCatalogPreviewUrl(URL.createObjectURL(blob));
      setCatalogPreviewOpen(true);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo generar la vista previa del catálogo."
      );
    } finally {
      setIsCatalogPreviewLoading(false);
    }
  };

  const handleCatalogPreviewOpenChange = (open: boolean) => {
    setCatalogPreviewOpen(open);

    if (!open) {
      setCatalogPreviewBlob(null);
      setCatalogPreviewSpaces([]);
      setCatalogPreviewUrl(null);
    }
  };

  const getSpaceMapUrl = (space: Space) => {
    const latitude = space.latitude ?? space.coords?.lat ?? 0;
    const longitude = space.longitude ?? space.coords?.lng ?? 0;
    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  };

  const openSpaceMap = (space: Space) => {
    const mapWindow = window.open(getSpaceMapUrl(space), "_blank");
    if (mapWindow) mapWindow.opener = null;
  };

  const handleDownloadCatalog = async () => {
    if (catalogPreviewSpaces.length === 0) return;
    setIsCatalogDownloadLoading(true);

    try {
      const blob = await createSpacesCatalogPdf(
        catalogPreviewSpaces,
        catalogPreviewVersion,
        { enableMapLinks: true }
      );
      saveSpacesCatalogPdf(blob, catalogPreviewVersion);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo descargar el catálogo."
      );
    } finally {
      setIsCatalogDownloadLoading(false);
    }
  };

  const handleShareDialogOpenChange = (open: boolean) => {
    setShareDialogOpen(open);
    if (!open) {
      setCatalogShare(null);
      setShareCopied(false);
    }
  };

  const handleCreateCatalogShare = async () => {
    const hours = Number(shareDuration === "custom" ? customShareHours : shareDuration);
    if (!Number.isInteger(hours) || hours < 1 || hours > 8760) {
      toast.error("Define una vigencia entre 1 y 8760 horas.");
      return;
    }

    setIsCreatingShare(true);
    try {
      const share = await createCatalogShare(
        selectedSpaces.map((space) => space.id),
        hours
      );
      setCatalogShare(share);
      setShareCopied(false);
      toast.success("Enlace público generado correctamente.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo generar el enlace compartible."
      );
    } finally {
      setIsCreatingShare(false);
    }
  };

  const copyShareUrl = async () => {
    if (!catalogShare) return;

    try {
      await navigator.clipboard.writeText(catalogShare.url);
      setShareCopied(true);
      toast.success("Enlace copiado al portapapeles.");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = catalogShare.url;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
      setShareCopied(true);
      toast.success("Enlace copiado al portapapeles.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <ModuleHeader
        title="Espacios"
        badge="Control de espacios"
        description="Revisa y administra los espacios publicitarios desde una sola pantalla."
        icon={MapPinned}
        actions={<Can permission="spaces.edit">
          <Button
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg px-6 py-6 shadow-lg transform hover:-translate-y-0.5 transition-all border-none"
            onClick={() => navigate("/espacios/nuevo")}
          >
            <Plus className="h-4 w-4" />
            Nuevo espacio
          </Button>
        </Can>}
      />

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
                      disabled={selectedSpaces.length === 0 || isCatalogPreviewLoading}
                      title="Previsualizar PDF"
                    >
                      {isCatalogPreviewLoading ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileDown className="h-4 w-4" />
                      )}
                      {isCatalogPreviewLoading ? "Generando..." : "PDF"}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-56">
                    <DropdownMenuLabel>Versión del catálogo</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handlePreviewCatalog("v2")}>
                      <div>
                        <p className="font-medium">Diseño nuevo · V2</p>
                        <p className="text-xs text-muted-foreground">Formato editorial actualizado</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePreviewCatalog("v1")}>
                      <div>
                        <p className="font-medium">Diseño anterior · V1</p>
                        <p className="text-xs text-muted-foreground">Formato clásico del catálogo</p>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  type="button"
                  variant="outline"
                  className="rounded-lg border-violet-200 text-violet-700 shadow-sm hover:bg-violet-50 hover:text-violet-800"
                  disabled={selectedSpaces.length === 0}
                  onClick={() => setShareDialogOpen(true)}
                  title="Compartir catálogo"
                >
                  <Share2 className="h-4 w-4" />
                  Compartir
                </Button>

                <Button
                  className="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md transition-all hover:from-purple-700 hover:to-indigo-700"
                  disabled={selectedSpaces.length === 0 || hasBlockedSelection}
                  title={
                    hasBlockedSelection
                      ? "Los espacios bloqueados pueden incluirse en el catálogo, pero no en una cotización."
                      : "Crear cotización"
                  }
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
            checkboxes={[
              { key: "activo", label: "Activo" },
              { key: "rotativo", label: "Es rotativo" },
            ]}
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
            enableRowSelection
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

      <Dialog open={catalogPreviewOpen} onOpenChange={handleCatalogPreviewOpenChange}>
        <DialogContent className="h-[calc(100dvh-2rem)] max-w-[calc(100vw-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden p-0 sm:max-w-6xl sm:p-0">
          <DialogHeader className="m-0 px-5 py-4 sm:m-0 sm:px-7 sm:py-5">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-violet-600" />
              Vista previa del catálogo {catalogPreviewVersion.toUpperCase()}
            </DialogTitle>
            <DialogDescription>
              Revisa el documento antes de guardarlo en tu equipo.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 bg-slate-100 p-2 sm:p-4">
            {catalogPreviewUrl ? (
              <iframe
                src={`${catalogPreviewUrl}#toolbar=1&navpanes=0&view=FitH`}
                title={`Vista previa del catálogo ${catalogPreviewVersion.toUpperCase()}`}
                className="h-full w-full rounded-lg border border-slate-200 bg-white"
              />
            ) : null}
          </div>

          <DialogFooter className="m-0 px-5 py-4 sm:m-0 sm:px-7">
            {catalogPreviewSpaces.length === 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => openSpaceMap(catalogPreviewSpaces[0])}
              >
                <ExternalLink className="h-4 w-4" />
                Abrir ubicación
              </Button>
            ) : catalogPreviewSpaces.length > 1 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline">
                    <ExternalLink className="h-4 w-4" />
                    Abrir ubicación
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="max-h-72 min-w-64 overflow-y-auto">
                  <DropdownMenuLabel>Selecciona un espacio</DropdownMenuLabel>
                  {catalogPreviewSpaces.map((space) => (
                    <DropdownMenuItem key={space.id} onClick={() => openSpaceMap(space)}>
                      {space.title || `Espacio ${space.id}`}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={() => handleCatalogPreviewOpenChange(false)}
            >
              Cerrar
            </Button>
            <Button
              type="button"
              disabled={!catalogPreviewBlob || isCatalogDownloadLoading}
              onClick={handleDownloadCatalog}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700"
            >
              {isCatalogDownloadLoading ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isCatalogDownloadLoading ? "Preparando..." : "Descargar PDF"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={shareDialogOpen} onOpenChange={handleShareDialogOpenChange}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-violet-600" />
              Compartir catálogo
            </DialogTitle>
            <DialogDescription>
              Genera un enlace público temporal para los {selectedSpaces.length} espacios seleccionados. La descarga PDF seguirá disponible por separado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Vigencia del enlace</label>
              <Select value={shareDuration} onValueChange={setShareDuration} disabled={isCreatingShare || Boolean(catalogShare)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona la vigencia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24">24 horas</SelectItem>
                  <SelectItem value="48">48 horas</SelectItem>
                  <SelectItem value="72">72 horas</SelectItem>
                  <SelectItem value="168">7 días</SelectItem>
                  <SelectItem value="custom">Personalizada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {shareDuration === "custom" && !catalogShare ? (
              <div className="space-y-2">
                <label htmlFor="catalog-share-hours" className="text-sm font-semibold text-slate-700">
                  Horas de vigencia
                </label>
                <Input
                  id="catalog-share-hours"
                  type="number"
                  min={1}
                  max={8760}
                  value={customShareHours}
                  onChange={(event) => setCustomShareHours(event.target.value)}
                  disabled={isCreatingShare}
                />
              </div>
            ) : null}

            {catalogShare ? (
              <div className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                <div>
                  <p className="text-sm font-semibold text-emerald-900">Enlace listo para compartir</p>
                  <p className="mt-1 text-xs text-emerald-700">
                    Vence el {new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(new Date(catalogShare.expires_at))}
                  </p>
                </div>
                <Input value={catalogShare.url} readOnly className="bg-white" />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button type="button" onClick={copyShareUrl} className="flex-1">
                    {shareCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {shareCopied ? "Copiado" : "Copiar enlace"}
                  </Button>
                  <Button type="button" variant="outline" asChild className="flex-1 bg-white">
                    <a href={catalogShare.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      Abrir catálogo
                    </a>
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleShareDialogOpenChange(false)}>
              Cerrar
            </Button>
            {!catalogShare ? (
              <Button
                type="button"
                onClick={handleCreateCatalogShare}
                disabled={isCreatingShare || selectedSpaces.length === 0}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700"
              >
                {isCreatingShare ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                {isCreatingShare ? "Generando..." : "Generar enlace"}
              </Button>
            ) : null}
          </DialogFooter>
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
