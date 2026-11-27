import * as React from "react"
import { UsersRound } from "lucide-react"
import { toast } from "sonner"

import { DataTable } from "@/components/generic/data-table"
import { ListingPanel } from "@/components/generic/listing-panel"
import { ExcelExportButton } from "@/components/generic/excel-export-button"
import { createSelectColumn } from "@/components/generic/select-column"
import { useTableSelection } from "@/hooks/useTableSelection"
import { fetchAllPages } from "@/lib/fetchAllPages"
import { getLeads } from "@/lib/services/crmService"
import { Filter } from "@/components/generic/filter"
import { ModuleHeader } from "@/components/generic/module-header"
import { useConvertLeadToClient, useCreateLead, useLeadCatalogs, useLeads } from "@/lib/hooks/crmHook"
import { CrmForm } from "@/pages/crm/crmForm"
import { useLeadTable } from "@/pages/crm/crmTable"
import type { LeadFormValues, LeadRecord } from "@/types/Crm"
import { Can } from "@/components/auth/Can"

const ALL = "all"

export default function LeadsPage() {
  const catalogsQuery = useLeadCatalogs()
  const createLeadMutation = useCreateLead()
  const convertMutation = useConvertLeadToClient()

  const [page, setPage] = React.useState(1)
  const [searchInput, setSearchInput] = React.useState("")
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>(ALL)
  const perPage = 10

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 350)

    return () => window.clearTimeout(timer)
  }, [searchInput])

  const params = React.useMemo(
    () => ({
      page,
      per_page: perPage,
      q: search || undefined,
      status_id: statusFilter === ALL ? undefined : statusFilter,
    }),
    [page, perPage, search, statusFilter]
  )

  const leadsQuery = useLeads(params)
  const statuses = catalogsQuery.data?.data.statuses ?? []
  const users = catalogsQuery.data?.data.users ?? []
  const leads = leadsQuery.data?.data ?? []
  const meta = leadsQuery.data?.meta

  const handleConvert = React.useCallback(
    async (lead: LeadRecord) => {
      const confirmConvert = window.confirm(`¿Convertir "${lead.display_name}" a cliente?`)
      if (!confirmConvert) return

      try {
        await convertMutation.mutateAsync(lead.id)
        toast.success("Prospecto convertido a cliente")
      } catch (error) {
        toast.error("No se pudo convertir el prospecto", {
          description: error instanceof Error ? error.message : "Intenta nuevamente.",
        })
      }
    },
    [convertMutation]
  )

  const columns = useLeadTable({ onConvert: handleConvert })

  // Selección de filas: si hay seleccionadas, se exportan solo esas.
  const selection = useTableSelection(leads)
  const selectableColumns = React.useMemo(
    () => [createSelectColumn<(typeof leads)[number]>(), ...columns],
    [columns],
  )

  return (
    <div className="mx-auto max-w-7xl space-y-5 sm:space-y-8 animate-in fade-in duration-500">
      <ModuleHeader
        title="Prospectos"
        badge="Seguimiento comercial"
        description="Registra y da seguimiento a tus leads comerciales."
        icon={UsersRound}
        actions={<Can permission="leads.edit">
          <CrmForm
            mode="lead"
            statuses={statuses}
            users={users}
            isSubmitting={createLeadMutation.isPending}
            onSubmit={async (payload) => {
              await createLeadMutation.mutateAsync(payload as LeadFormValues)
            }}
          />
        </Can>}
      />

      <ListingPanel
        title="Búsqueda rápida"
        description={`${meta?.total ?? leads.length} prospectos registrados en el CRM.`}
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Buscar prospecto..."
        selectedCount={selection.selected.length}
        itemLabel={["prospecto", "prospectos"]}
        onClearSelection={selection.clear}
        exports={<ExcelExportButton columns={columns} data={leads} filename="prospectos" selected={selection.selected} disabled={leadsQuery.isFetching} fetchAll={() => fetchAllPages((nextPage, size) => getLeads({ ...params, page: nextPage, per_page: size }))} />}
        activeFilters={statusFilter === ALL ? 0 : 1}
        filters={<Filter hideHeader defaultOpen enableDateRange={false} dropdowns={[{ key: "estatus", label: "Estatus", options: statuses.map((status) => ({ label: status.name, value: String(status.id) })) }]} initialValues={{ selects: { estatus: statusFilter === ALL ? undefined : statusFilter }, checks: {} }} onApply={(values) => { setStatusFilter(values.selects.estatus ?? ALL); setPage(1) }} onReset={() => { setStatusFilter(ALL); setPage(1) }} />}
      >
          <DataTable
            columns={selectableColumns}
            data={leads}
            rowSelection={selection.rowSelection}
            onRowSelectionChange={selection.setRowSelection}
            getRowId={selection.getRowId}
            enableRowSelection
            enableSearch={false}
            enableExport={false}
            pageSize={perPage}
            enablePagination
            manualPagination
            pageIndex={(meta?.page ?? page) - 1}
            pageCount={meta?.totalPages ?? 1}
            onPageChange={(nextPageIndex) => setPage(nextPageIndex + 1)}
            isLoading={leadsQuery.isFetching}
          />
      </ListingPanel>
    </div>
  )
}
