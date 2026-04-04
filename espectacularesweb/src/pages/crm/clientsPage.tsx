import * as React from "react"

import { DataTable } from "@/components/generic/data-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useClients, useCreateClient } from "@/lib/hooks/crmHook"
import { CrmForm } from "@/pages/crm/crmForm"
import { useClientTable } from "@/pages/crm/crmTable"
import type { ClientFormValues } from "@/types/Crm"

export default function ClientsPage() {
  const createClientMutation = useCreateClient()
  const [page, setPage] = React.useState(1)
  const [searchInput, setSearchInput] = React.useState("")
  const [search, setSearch] = React.useState("")
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
    }),
    [page, perPage, search]
  )

  const clientsQuery = useClients(params)
  const clients = clientsQuery.data?.data ?? []
  const meta = clientsQuery.data?.meta
  const columns = useClientTable()

  return (
    <div className="space-y-4 p-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Clientes</CardTitle>
            <p className="text-sm text-muted-foreground">
              Clientes disponibles para seguimiento y cotización.
            </p>
          </div>

          <CrmForm
            mode="client"
            isSubmitting={createClientMutation.isPending}
            onSubmit={async (payload) => {
              await createClientMutation.mutateAsync(payload as ClientFormValues)
            }}
          />
        </CardHeader>

        <CardContent>
          <DataTable
            title={`Clientes (${meta?.total ?? clients.length})`}
            description="Listado de clientes registrados."
            columns={columns}
            data={clients}
            enableSearch
            searchPlaceholder="Buscar cliente..."
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            pageSize={perPage}
            enablePagination
            manualPagination
            pageIndex={(meta?.page ?? page) - 1}
            pageCount={meta?.totalPages ?? 1}
            onPageChange={(nextPageIndex) => setPage(nextPageIndex + 1)}
            isLoading={clientsQuery.isFetching}
          />
        </CardContent>
      </Card>
    </div>
  )
}
