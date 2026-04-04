import * as React from "react"
import { toast } from "sonner"

import { DataTable } from "@/components/generic/data-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useConvertLeadToClient, useCreateLead, useLeadCatalogs, useLeads } from "@/lib/hooks/crmHook"
import { CrmForm } from "@/pages/crm/crmForm"
import { useLeadTable } from "@/pages/crm/crmTable"
import type { LeadFormValues, LeadRecord } from "@/types/Crm"

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

  return (
    <div className="space-y-4 p-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Prospectos</CardTitle>
            <p className="text-sm text-muted-foreground">
              Registra y da seguimiento a tus leads comerciales.
            </p>
          </div>

          <CrmForm
            mode="lead"
            statuses={statuses}
            users={users}
            isSubmitting={createLeadMutation.isPending}
            onSubmit={async (payload) => {
              await createLeadMutation.mutateAsync(payload as LeadFormValues)
            }}
          />
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="w-full sm:w-64">
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value)
                  setPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por estatus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todos los estatus</SelectItem>
                  {statuses.map((status) => (
                    <SelectItem key={status.id} value={String(status.id)}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DataTable
            title={`Prospectos (${meta?.total ?? leads.length})`}
            description="Listado de prospectos registrados en el CRM."
            columns={columns}
            data={leads}
            enableSearch
            searchPlaceholder="Buscar prospecto..."
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            pageSize={perPage}
            enablePagination
            manualPagination
            pageIndex={(meta?.page ?? page) - 1}
            pageCount={meta?.totalPages ?? 1}
            onPageChange={(nextPageIndex) => setPage(nextPageIndex + 1)}
            isLoading={leadsQuery.isFetching}
          />
        </CardContent>
      </Card>
    </div>
  )
}
