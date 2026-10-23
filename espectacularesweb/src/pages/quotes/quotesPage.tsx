import * as React from "react"
import { Link } from "react-router-dom"
import { Plus, ReceiptText } from "lucide-react"
import { toast } from "sonner"

import { DataTable } from "@/components/generic/data-table"
import { ExcelExportButton } from "@/components/generic/excel-export-button"
import { Filter } from "@/components/generic/filter"
import { ListingPanel } from "@/components/generic/listing-panel"
import { ModuleHeader } from "@/components/generic/module-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  const [dateFrom, setDateFrom] = React.useState<string | undefined>()
  const [dateTo, setDateTo] = React.useState<string | undefined>()
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
      date_from: dateFrom,
      date_to: dateTo,
    }),
    [dateFrom, dateTo, page, perPage, search, statusFilter]
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

      <ListingPanel
        title="Búsqueda rápida"
        description="Filtra por folio, nota, estatus o fecha de alta."
        search={
          <div className="relative w-full xl:w-96">
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por folio o nota..."
              className="rounded-xl border-gray-300 bg-white shadow-sm focus:border-purple-500 focus:ring-purple-500"
            />
          </div>
        }
        actions={<ExcelExportButton columns={columns} data={quotes} filename="cotizaciones" disabled={quotesQuery.isFetching} />}
        filters={<Filter
          title="Filtros avanzados"
          defaultOpen={false}
          className="border-gray-200 bg-slate-50/60 shadow-none"
          dropdowns={[{ key: "estatus", label: "Estatus", options: statuses.map((status) => ({ label: status.name, value: String(status.id) })) }]}
          initialValues={{ dateFrom, dateTo, selects: { estatus: statusFilter === ALL ? undefined : statusFilter }, checks: {} }}
          onApply={(values) => { setStatusFilter(values.selects.estatus ?? ALL); setDateFrom(values.dateFrom); setDateTo(values.dateTo); setPage(1) }}
          onReset={() => { setStatusFilter(ALL); setDateFrom(undefined); setDateTo(undefined); setPage(1) }}
          applyOnReset
        />}
      >
        <DataTable
          columns={columns}
          data={quotes}
          enableSearch={false}
          enableExport={false}
          pageSize={perPage}
          enablePagination
          manualPagination
          pageIndex={(meta?.page ?? page) - 1}
          pageCount={meta?.totalPages ?? 1}
          onPageChange={(nextPageIndex) => setPage(nextPageIndex + 1)}
          isLoading={quotesQuery.isFetching}
        />
      </ListingPanel>

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
