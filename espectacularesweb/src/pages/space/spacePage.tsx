import * as React from "react";
import type { FilterValues } from "@/types/Filter";
import type { Space } from "@/types/Space";

import { DataTable } from "@/components/generic/data-table";
import { Filter } from "@/components/generic/filter";
import { Card, CardContent } from "@/components/ui/card";
import { SpaceCreateDialog } from "./space-create-dialog";

import { downloadSpacesCatalog } from "@/lib/pdf/downloadSpacesCatalog";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";

import { useSpaces } from "@/lib/hooks/spaceHook";
import { apiToUiSpace, buildSpacesParams } from "@/lib/mappers/spaceMapper";
import { useSpaceTable } from "./spaceTable";

export default function SpacePage() {
  const [filters, setFilters] = React.useState<FilterValues>({
    dateFrom: undefined,
    dateTo: undefined,
    selects: { estatus: "", tipo: "", conLuz: "" },
    checks: {},
  });

  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const perPage = 10;

  const handleApplyFilters = (v: FilterValues) => {
    setFilters(v);
    setPage(1);
  };

  const params = React.useMemo(
    () => buildSpacesParams(filters, page, perPage, search),
    [filters, page, perPage, search],
  );

  const spacesQuery = useSpaces(params);
  const rowsApi = spacesQuery.data?.data ?? [];
  const meta = spacesQuery.data?.meta;

  const totalPages = meta?.totalPages ?? 1;
  const total = meta?.total ?? rowsApi.length;

  const data: Space[] = React.useMemo(
    () => rowsApi.map(apiToUiSpace),
    [rowsApi],
  );

  const { columns } = useSpaceTable({
    onDelete: async (row) => {
      const ok = confirm(`¿Eliminar "${row.title}"?`);
      if (!ok) return;
      // aquí llamas tu delete endpoint
      console.log("Eliminar", row.id);
    },
  });

  return (
    <div className="space-y-4 p-6">
      <Filter
        title="Filtros de espacios"
        enableDateRange
        dropdowns={[
          {
            key: "tipo",
            label: "Tipo",
            placeholder: "Selecciona tipo",
            options: [
              { label: "Espectacular", value: "espectacular" },
              { label: "Muro", value: "muro" },
              { label: "Parabús", value: "parabus" },
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
      />
      <Button
        variant="outline"
        className="flex gap-2"
        onClick={() => downloadSpacesCatalog(rowsApi)}
      >
        <FileDown className="h-4 w-4" />
        Descargar catálogo PDF
      </Button>

      <SpaceCreateDialog onCreated={() => setPage(1)} />

      <Card>
        <CardContent className="py-2">
          <DataTable
            title={`Espacios (${total})`}
            columns={columns}
            data={data}
            enableSearch
            searchPlaceholder="Buscar..."
            searchValue={search}
            onSearchChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            pageSize={perPage}
            enablePagination
            manualPagination
            pageIndex={(meta?.page ?? page) - 1}
            pageCount={totalPages}
            onPageChange={(nextPageIndex) => setPage(nextPageIndex + 1)}
            isLoading={spacesQuery.isFetching}
            onRowClick={(row) => console.log("click", row)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
