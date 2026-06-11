import * as React from "react"
import { MailCheck, Search, FileText, UsersRound } from "lucide-react"

import { DataTable } from "@/components/generic/data-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
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
  const totalClients = meta?.total ?? 0
  const visibleWithEmail = clients.filter((client) => !!client.email).length
  const visibleWithRfc = clients.filter((client) => !!client.rfc).length

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
            <UsersRound className="h-3.5 w-3.5" />
            Catálogo de clientes
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Clientes</h1>
            <p className="mt-2 max-w-2xl text-gray-600">
              Administra clientes disponibles para seguimiento, cotización y contacto comercial.
            </p>
          </div>
        </div>

        <CrmForm
          mode="client"
          isSubmitting={createClientMutation.isPending}
          onSubmit={async (payload) => {
            await createClientMutation.mutateAsync(payload as ClientFormValues)
          }}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card className="border-gray-200 shadow-md">
          <CardHeader className="pb-3">
            <CardDescription>Total registrados</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <UsersRound className="h-5 w-5 text-purple-600" />
              {totalClients}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-gray-200 shadow-md">
          <CardHeader className="pb-3">
            <CardDescription>Con email visible</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <MailCheck className="h-5 w-5 text-emerald-600" />
              {visibleWithEmail}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-gray-200 shadow-md">
          <CardHeader className="pb-3">
            <CardDescription>Con RFC visible</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <FileText className="h-5 w-5 text-slate-500" />
              {visibleWithRfc}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-gray-200 shadow-lg">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-xl">Búsqueda rápida</CardTitle>
              <CardDescription>
                Filtra por nombre, teléfono, email, RFC, fuente o usuario registrado.
              </CardDescription>
            </div>

            <div className="w-full lg:max-w-md">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Buscar cliente..."
                  className="rounded-xl border-gray-300 bg-white pl-10 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          <Separator />
        </CardHeader>

        <CardContent className="pt-0">
          <DataTable
            columns={columns}
            data={clients}
            enableSearch={false}
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
