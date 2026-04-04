import * as React from "react"
import { Link } from "react-router-dom"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { DataTable } from "@/components/generic/data-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { downloadQuotePdf } from "@/lib/pdf/downloadQuotePdf"
import { useQuoteCatalogs, useQuotes } from "@/lib/hooks/quoteHook"
import { getQuote } from "@/lib/services/quoteService"
import { useQuoteTable } from "@/pages/quotes/quoteTable"
import type { QuoteRecord } from "@/types/Quote"

const ALL = "all"

export default function QuotesPage() {
  const catalogsQuery = useQuoteCatalogs()
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
      status: statusFilter === ALL ? undefined : statusFilter,
    }),
    [page, perPage, search, statusFilter]
  )

  const quotesQuery = useQuotes(params)
  const statuses = catalogsQuery.data?.data.statuses ?? []
  const quotes = quotesQuery.data?.data ?? []
  const meta = quotesQuery.data?.meta
  const handleDownload = React.useCallback(async (quote: QuoteRecord) => {
    try {
      const response = await getQuote(quote.id)
      downloadQuotePdf(response.data, `${response.data.folio}.pdf`)
    } catch (error) {
      toast.error("No fue posible generar el PDF de la cotización.", {
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
      })
    }
  }, [])

  const columns = useQuoteTable({ onDownload: handleDownload })

  return (
    <div className="space-y-4 p-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Cotizaciones</CardTitle>
            <p className="text-sm text-muted-foreground">
              Consulta las cotizaciones registradas y filtra por estatus.
            </p>
          </div>

          <Button asChild>
            <Link to="/cotizaciones/nueva">
              <Plus className="mr-2 h-4 w-4" />
              Nueva cotización
            </Link>
          </Button>
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
            title={`Cotizaciones (${meta?.total ?? quotes.length})`}
            description="Listado de cotizaciones creadas en el sistema."
            columns={columns}
            data={quotes}
            enableSearch
            searchPlaceholder="Buscar por folio o nota..."
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            pageSize={perPage}
            enablePagination
            manualPagination
            pageIndex={(meta?.page ?? page) - 1}
            pageCount={meta?.totalPages ?? 1}
            onPageChange={(nextPageIndex) => setPage(nextPageIndex + 1)}
            isLoading={quotesQuery.isFetching}
          />
        </CardContent>
      </Card>
    </div>
  )
}
