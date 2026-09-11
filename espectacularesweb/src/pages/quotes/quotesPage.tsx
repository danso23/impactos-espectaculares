import * as React from "react"
import { Link } from "react-router-dom"
import { Plus, ReceiptText } from "lucide-react"
import { toast } from "sonner"

import { DataTable } from "@/components/generic/data-table"
import { ModuleHeader } from "@/components/generic/module-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { downloadQuotePdf } from "@/lib/pdf/downloadQuotePdf"
import { useQuoteCatalogs, useQuotes } from "@/lib/hooks/quoteHook"
import { QuoteConvertToRentalDialog } from "@/pages/quotes/quoteConvertToRentalDialog"
import { getQuote } from "@/lib/services/quoteService"
import { QuoteStatusDialog } from "@/pages/quotes/quoteStatusDialog"
import { useQuoteTable } from "@/pages/quotes/quoteTable"
import type { QuoteRecord } from "@/types/Quote"
import { Can } from "@/components/auth/Can"

const ALL = "all"

export default function QuotesPage() {
  const catalogsQuery = useQuoteCatalogs()
  const [page, setPage] = React.useState(1)
  const [searchInput, setSearchInput] = React.useState("")
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>(ALL)
  const [selectedQuote, setSelectedQuote] = React.useState<QuoteRecord | null>(null)
  const [statusDialogOpen, setStatusDialogOpen] = React.useState(false)
  const [convertDialogOpen, setConvertDialogOpen] = React.useState(false)
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
      await downloadQuotePdf(response.data, `${response.data.folio}.pdf`)
    } catch (error) {
      toast.error("No fue posible generar el PDF de la cotización.", {
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
      })
    }
  }, [])
  const handleChangeStatus = React.useCallback((quote: QuoteRecord) => {
    setSelectedQuote(quote)
    setStatusDialogOpen(true)
  }, [])
  const handleConvertToRental = React.useCallback((quote: QuoteRecord) => {
    setSelectedQuote(quote)
    setConvertDialogOpen(true)
  }, [])

  const columns = useQuoteTable({
    onDownload: handleDownload,
    onChangeStatus: handleChangeStatus,
    onConvertToRental: handleConvertToRental,
  })

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <ModuleHeader
        title="Cotizaciones"
        badge="Control de cotizaciones"
        description="Consulta las cotizaciones registradas y filtra por estatus."
        icon={ReceiptText}
        actions={<Can permission="quotes.edit">
          <Button asChild className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg px-6 py-6 shadow-lg transform hover:-translate-y-0.5 transition-all border-none">
            <Link to="/cotizaciones/nueva">
              <Plus className="mr-2 h-5 w-5" />
              <span>Nueva cotización</span>
            </Link>
          </Button>
        </Can>}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <div className="w-full sm:w-72">
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value)
                setPage(1)
              }}
            >
              <SelectTrigger className="rounded-lg border-gray-300">
                <SelectValue placeholder="Filtrar por estatus" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value={ALL}>Todos los estatus</SelectItem>
                {statuses.map((status) => (
                  <SelectItem key={status.id} value={String(status.id)}>
                    {status.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por folio o nota..."
              className="rounded-lg border-gray-300 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={quotes}
        enableSearch={false}
        pageSize={perPage}
        enablePagination
        manualPagination
        pageIndex={(meta?.page ?? page) - 1}
        pageCount={meta?.totalPages ?? 1}
        onPageChange={(nextPageIndex) => setPage(nextPageIndex + 1)}
        isLoading={quotesQuery.isFetching}
      />

      <QuoteStatusDialog
        open={statusDialogOpen}
        onOpenChange={(open) => {
          setStatusDialogOpen(open)
          if (!open) {
            setSelectedQuote(null)
          }
        }}
        quote={selectedQuote}
        statuses={statuses}
      />

      <QuoteConvertToRentalDialog
        open={convertDialogOpen}
        onOpenChange={(open) => {
          setConvertDialogOpen(open)
          if (!open) {
            setSelectedQuote(null)
          }
        }}
        quote={selectedQuote}
      />
    </div>
  )
}
