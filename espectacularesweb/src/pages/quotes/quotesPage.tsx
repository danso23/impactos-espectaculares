import * as React from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Plus, ReceiptText } from "lucide-react"
import { toast } from "sonner"

import { DataTable } from "@/components/generic/data-table"
import { ExcelExportButton } from "@/components/generic/excel-export-button"
import { createSelectColumn } from "@/components/generic/select-column"
import { useTableSelection } from "@/hooks/useTableSelection"
import { Filter } from "@/components/generic/filter"
import { ListingPanel } from "@/components/generic/listing-panel"
import { ModuleHeader } from "@/components/generic/module-header"
import { Button } from "@/components/ui/button"
import { downloadQuotePdf } from "@/lib/pdf/downloadQuotePdf"
import { useDeleteQuote, useQuoteCatalogs, useQuotes } from "@/lib/hooks/quoteHook"
import { QuoteConvertToRentalDialog } from "@/pages/quotes/quoteConvertToRentalDialog"
import { QuoteDetailDialog } from "@/pages/quotes/quoteDetailDialog"
import { getQuote, getQuotes } from "@/lib/services/quoteService"
import { fetchAllPages } from "@/lib/fetchAllPages"
import { QuoteStatusDialog } from "@/pages/quotes/quoteStatusDialog"
import { useQuoteTable } from "@/pages/quotes/quoteTable"
import type { QuoteRecord } from "@/types/Quote"
import { Can } from "@/components/auth/Can"
import { DeleteConfirmDialog } from "@/components/generic/delete-confirm-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const ALL = "all"

export default function QuotesPage() {
  const catalogsQuery = useQuoteCatalogs()
  const navigate = useNavigate()
  const [page, setPage] = React.useState(1)
  const [searchInput, setSearchInput] = React.useState("")
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>(ALL)
  const [dateFrom, setDateFrom] = React.useState<string | undefined>()
  const [dateTo, setDateTo] = React.useState<string | undefined>()
  // "cliente:3", "lead:5" o "sin_cliente".
  const [customerFilter, setCustomerFilter] = React.useState<string>(ALL)
  const [companyFilter, setCompanyFilter] = React.useState<string>(ALL)
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("desc")
  const [selectedQuote, setSelectedQuote] = React.useState<QuoteRecord | null>(null)
  const [statusDialogOpen, setStatusDialogOpen] = React.useState(false)
  const [convertDialogOpen, setConvertDialogOpen] = React.useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false)
  const [quoteToDelete, setQuoteToDelete] = React.useState<QuoteRecord | null>(null)
  const [acceptedQuote, setAcceptedQuote] = React.useState<QuoteRecord | null>(null)
  const deleteMutation = useDeleteQuote()
  const perPage = 10
  const location = useLocation()

  // Al guardar una cotización se regresa aquí con ella en el state: se abre su detalle.
  React.useEffect(() => {
    const openQuote = (location.state as { openQuote?: QuoteRecord } | null)?.openQuote
    if (!openQuote) return
    setSelectedQuote(openQuote)
    setDetailDialogOpen(true)
    navigate(location.pathname + location.search, { replace: true, state: null })
  }, [location.pathname, location.search, location.state, navigate])

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 350)

    return () => window.clearTimeout(timer)
  }, [searchInput])

  const params = React.useMemo(() => {
    const [customerType, customerId] = customerFilter === ALL ? [] : customerFilter.split(":")
    return {
      page,
      per_page: perPage,
      q: search || undefined,
      status: statusFilter === ALL ? undefined : statusFilter,
      date_from: dateFrom,
      date_to: dateTo,
      customer_type: customerType,
      customer_id: customerId ? Number(customerId) : undefined,
      issuer_company_id: companyFilter === ALL ? undefined : Number(companyFilter),
      direction: sortDirection,
    }
  }, [companyFilter, customerFilter, dateFrom, dateTo, page, perPage, search, sortDirection, statusFilter])

  const quotesQuery = useQuotes(params)
  const statuses = catalogsQuery.data?.data.statuses ?? []
  const companies = catalogsQuery.data?.data.companies ?? []
  const customerTypeLabel: Record<string, string> = { cliente: "Cliente", lead: "Prospecto", proveedor: "Proveedor" }
  const customerOptions = [
    { label: "Sin cliente", value: "sin_cliente" },
    ...(catalogsQuery.data?.data.quoted_customers ?? []).map((customer) => ({
      label: `${customer.name} · ${customerTypeLabel[customer.type] ?? customer.type}`,
      value: `${customer.type}:${customer.id}`,
    })),
  ]
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
  const handleView = React.useCallback((quote: QuoteRecord) => {
    setSelectedQuote(quote)
    setDetailDialogOpen(true)
  }, [])
  const handleChangeStatus = React.useCallback((quote: QuoteRecord) => {
    setSelectedQuote(quote)
    setStatusDialogOpen(true)
  }, [])
  const handleConvertToRental = React.useCallback((quote: QuoteRecord) => {
    setSelectedQuote(quote)
    setConvertDialogOpen(true)
  }, [])

  const handleEdit = React.useCallback((quote: QuoteRecord) => {
    navigate(`/cotizaciones/${quote.id}/editar`)
  }, [navigate])

  const handleDuplicate = React.useCallback((quote: QuoteRecord) => {
    navigate(`/cotizaciones/nueva?duplicar=${quote.id}`)
  }, [navigate])

  const handleConfirmDelete = async () => {
    if (!quoteToDelete) return
    try {
      await deleteMutation.mutateAsync(quoteToDelete.id)
      toast.success(`Cotización ${quoteToDelete.folio} eliminada.`)
      setQuoteToDelete(null)
    } catch (error) {
      toast.error("No se pudo eliminar la cotización", {
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
      })
    }
  }

  const toggleSort = React.useCallback(() => {
    setSortDirection((current) => (current === "desc" ? "asc" : "desc"))
    setPage(1)
  }, [])

  const columns = useQuoteTable({
    onView: handleView,
    onDownload: handleDownload,
    onChangeStatus: handleChangeStatus,
    onConvertToRental: handleConvertToRental,
    onDuplicate: handleDuplicate,
    onEdit: handleEdit,
    onDelete: setQuoteToDelete,
    sortDirection,
    onToggleSort: toggleSort,
  })

  // Selección de filas: si hay seleccionadas, se exportan solo esas.
  const selection = useTableSelection(quotes)
  const selectableColumns = React.useMemo(
    () => [createSelectColumn<(typeof quotes)[number]>(), ...columns],
    [columns],
  )

  return (
    <div className="max-w-7xl mx-auto space-y-5 sm:space-y-8 animate-in fade-in duration-500">
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
        description="Filtra por folio, nota, estatus, cliente, empresa o fecha de alta."
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Buscar por folio o nota..."
        selectedCount={selection.selected.length}
        itemLabel={["cotización", "cotizaciones"]}
        feminine
        onClearSelection={selection.clear}
        exports={<ExcelExportButton
          columns={columns}
          data={quotes}
          filename="cotizaciones" selected={selection.selected}
          disabled={quotesQuery.isFetching}
          fetchAll={() => fetchAllPages((nextPage, size) => getQuotes({ ...params, page: nextPage, per_page: size }))}
        />}
        activeFilters={(statusFilter === ALL ? 0 : 1) + (customerFilter === ALL ? 0 : 1) + (companyFilter === ALL ? 0 : 1) + (dateFrom || dateTo ? 1 : 0)}
        filters={<Filter
          hideHeader
          defaultOpen
          dateRangeLabel="Fecha de alta"
          className="border-gray-200 bg-slate-50/60 shadow-none"
          dropdowns={[
            { key: "estatus", label: "Estatus", options: statuses.map((status) => ({ label: status.name, value: String(status.id) })) },
            { key: "cliente", label: "Cliente", options: customerOptions },
            { key: "empresa", label: "Empresa", options: companies.map((company) => ({ label: company.name, value: String(company.id) })) },
          ]}
          initialValues={{
            dateFrom,
            dateTo,
            selects: {
              estatus: statusFilter === ALL ? undefined : statusFilter,
              cliente: customerFilter === ALL ? undefined : customerFilter,
              empresa: companyFilter === ALL ? undefined : companyFilter,
            },
            checks: {},
          }}
          onApply={(values) => {
            setStatusFilter(values.selects.estatus ?? ALL)
            setCustomerFilter(values.selects.cliente ?? ALL)
            setCompanyFilter(values.selects.empresa ?? ALL)
            setDateFrom(values.dateFrom)
            setDateTo(values.dateTo)
            setPage(1)
          }}
          onReset={() => { setStatusFilter(ALL); setCustomerFilter(ALL); setCompanyFilter(ALL); setDateFrom(undefined); setDateTo(undefined); setPage(1) }}
          applyOnReset
        />}
      >
        <DataTable
          columns={selectableColumns}
          data={quotes}
          rowSelection={selection.rowSelection}
          onRowSelectionChange={selection.setRowSelection}
          getRowId={selection.getRowId}
          enableRowSelection
          tableClassName="min-w-[1400px]"
          noWrap
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
        onAccepted={setAcceptedQuote}
      />

      <AlertDialog open={acceptedQuote !== null} onOpenChange={(open) => !open && setAcceptedQuote(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Convertir a renta ahora?</AlertDialogTitle>
            <AlertDialogDescription>
              La cotización {acceptedQuote?.folio} quedó Aceptada. Puedes convertirla a renta ahora
              o después desde el menú de acciones.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>En otro momento</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setSelectedQuote(acceptedQuote)
                setAcceptedQuote(null)
                setConvertDialogOpen(true)
              }}
            >
              Convertir a renta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DeleteConfirmDialog
        open={quoteToDelete !== null}
        onOpenChange={(open) => !open && setQuoteToDelete(null)}
        onConfirm={handleConfirmDelete}
        itemName={quoteToDelete ? `Cotización ${quoteToDelete.folio}` : undefined}
        loading={deleteMutation.isPending}
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

      <QuoteDetailDialog
        open={detailDialogOpen}
        onOpenChange={(open) => {
          setDetailDialogOpen(open)
          if (!open) {
            setSelectedQuote(null)
          }
        }}
        quote={selectedQuote}
      />
    </div>
  )
}
