import * as React from "react"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useConvertQuoteToRental, useQuoteCustomerSearch } from "@/lib/hooks/quoteHook"
import type { QuoteCustomer, QuoteRecord, SearchableCustomerType } from "@/types/Quote"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value || 0)
}

type QuoteConvertToRentalDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  quote: QuoteRecord | null
}

export function QuoteConvertToRentalDialog({
  open,
  onOpenChange,
  quote,
}: QuoteConvertToRentalDialogProps) {
  const convertMutation = useConvertQuoteToRental()
  const requiresCustomer = !quote?.customer_id || quote?.customer_type === "sin_cliente"
  const [customerType, setCustomerType] = React.useState<SearchableCustomerType>("cliente")
  const [customerSearch, setCustomerSearch] = React.useState("")
  const [selectedCustomer, setSelectedCustomer] = React.useState<QuoteCustomer | null>(null)
  const [showCustomerList, setShowCustomerList] = React.useState(false)
  const customerQuery = useQuoteCustomerSearch(customerSearch, customerType, open && requiresCustomer)

  React.useEffect(() => {
    if (!open) return
    setCustomerType("cliente")
    setCustomerSearch("")
    setSelectedCustomer(null)
    setShowCustomerList(false)
  }, [open, quote?.id])

  const handleConfirm = async () => {
    if (!quote) return
    if (requiresCustomer && !selectedCustomer) {
      toast.error("Selecciona un cliente o prospecto para continuar.")
      return
    }

    try {
      const response = await convertMutation.mutateAsync({
        id: quote.id,
        payload: requiresCustomer
          ? {
              customer: {
                type: customerType,
                id: selectedCustomer!.id as number,
              },
            }
          : undefined,
      })
      toast.success(response.message || `Cotización convertida a renta #${response.data.rental?.id}.`)
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible convertir la cotización a renta.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convertir a renta</DialogTitle>
          <DialogDescription>
            {quote ? `La cotización ${quote.folio} dejará de ser solo comercial y generará una renta operativa.` : "Confirma la conversión a renta."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="rounded-md border bg-muted/30 p-3">
            <div>Cliente: {quote?.customer?.display_name ?? "—"}</div>
            <div>Estatus: {quote?.status?.name ?? "—"}</div>
            <div>Rentas a convertir: {quote?.totals.rentals_subtotal ? formatCurrency(quote.totals.rentals_subtotal) : formatCurrency(0)}</div>
            <div>Servicios: {quote?.totals.services_subtotal ? formatCurrency(quote.totals.services_subtotal) : formatCurrency(0)}</div>
          </div>

          {requiresCustomer ? (
            <div className="space-y-3 rounded-md border border-sky-200 bg-sky-50 p-3">
              <div className="text-sm font-medium text-sky-900">
                Esta cotización no tiene cliente asignado
              </div>
              <div className="text-sm text-sky-800">
                Asigna un cliente o prospecto para continuar con la conversión a renta.
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tipo de cliente</Label>
                  <Select
                    value={customerType}
                    onValueChange={(value) => {
                      setCustomerType(value as SearchableCustomerType)
                      setCustomerSearch("")
                      setSelectedCustomer(null)
                      setShowCustomerList(false)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cliente">Cliente</SelectItem>
                      <SelectItem value="lead">Lead / Prospecto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="relative space-y-2">
                  <Label>Buscar</Label>
                  <Input
                    placeholder="Buscar cliente..."
                    value={selectedCustomer ? selectedCustomer.display_name : customerSearch}
                    onChange={(event) => {
                      setCustomerSearch(event.target.value)
                      setSelectedCustomer(null)
                      setShowCustomerList(true)
                    }}
                    onFocus={() => setShowCustomerList(true)}
                  />

                  {showCustomerList && !selectedCustomer && customerSearch.trim().length >= 2 ? (
                    <Card className="absolute z-20 mt-1 max-h-60 w-full overflow-auto">
                      <CardContent className="space-y-1 p-2">
                        {customerQuery.isFetching ? (
                          <div className="p-2 text-sm text-muted-foreground">Buscando...</div>
                        ) : null}

                        {!customerQuery.isFetching && (customerQuery.data?.data.length ?? 0) === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">Sin resultados.</div>
                        ) : null}

                        {customerQuery.data?.data.map((customer) => (
                          <button
                            key={`${customer.type}-${customer.id}`}
                            type="button"
                            className="flex w-full flex-col rounded-md px-3 py-2 text-left hover:bg-muted"
                            onClick={() => {
                              setSelectedCustomer(customer)
                              setCustomerSearch(customer.display_name)
                              setShowCustomerList(false)
                            }}
                          >
                            <span className="text-sm font-medium">{customer.display_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {customer.contact_name || customer.email || customer.phone || "Sin datos extra"}
                            </span>
                          </button>
                        ))}
                      </CardContent>
                    </Card>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
            Se generará una renta con los items de tipo renta. La cotización aceptada quedará ligada a esa renta y ya no deberá duplicarse.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!quote || convertMutation.isPending}>
            {convertMutation.isPending ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Confirmar conversión
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
