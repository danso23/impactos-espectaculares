import * as React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useQuoteCustomerSearch } from "@/lib/hooks/quoteHook"
import type { CustomerType, QuoteCustomer, SearchableCustomerType } from "@/types/Quote"

type QuoteCustomerSelectorProps = {
  customerType: CustomerType
  selectedCustomer: QuoteCustomer | null
  onCustomerTypeChange: (type: CustomerType) => void
  onCustomerChange: (customer: QuoteCustomer | null) => void
  allowWithoutCustomer?: boolean
  enabled?: boolean
  resetKey?: string | number | boolean
}

export function QuoteCustomerSelector({
  customerType,
  selectedCustomer,
  onCustomerTypeChange,
  onCustomerChange,
  allowWithoutCustomer = true,
  enabled = true,
  resetKey,
}: QuoteCustomerSelectorProps) {
  const [customerSearch, setCustomerSearch] = React.useState("")
  const [showCustomerList, setShowCustomerList] = React.useState(false)
  const customerSearchRef = React.useRef<HTMLDivElement | null>(null)
  const isWithoutCustomer = customerType === "sin_cliente"
  const searchType: SearchableCustomerType = customerType === "cliente" ? "cliente" : "lead"
  const listLabel = searchType === "cliente" ? "clientes" : "leads"
  const searchTerm = customerSearch.trim()
  const customerQuery = useQuoteCustomerSearch(
    customerSearch,
    searchType,
    enabled && !isWithoutCustomer
  )

  React.useEffect(() => {
    setCustomerSearch("")
    setShowCustomerList(false)
  }, [resetKey])

  React.useEffect(() => {
    if (!showCustomerList) return

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (!target || customerSearchRef.current?.contains(target)) return
      setShowCustomerList(false)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowCustomerList(false)
    }

    document.addEventListener("pointerdown", handlePointerDown, true)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [showCustomerList])

  const customerResults = customerQuery.data?.data ?? []
  const hasSearchData = !!customerQuery.data
  const selectionHint = isWithoutCustomer
    ? "La cotización se guardará sin cliente asignado."
    : selectedCustomer
      ? `Seleccionado: ${selectedCustomer.display_name}.`
      : customerType === "lead"
        ? "Selecciona un lead disponible."
        : "Selecciona un cliente disponible."

  return (
    <>
      <div className="space-y-2">
        <Label>Tipo de cliente</Label>
        <Select
          value={customerType}
          onValueChange={(value) => {
            const nextType = value as CustomerType
            onCustomerTypeChange(nextType)
            onCustomerChange(null)
            setCustomerSearch("")
            setShowCustomerList(nextType !== "sin_cliente")
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lead">Lead / Prospecto</SelectItem>
            <SelectItem value="cliente">Cliente</SelectItem>
            {allowWithoutCustomer ? (
              <SelectItem value="sin_cliente">Sin cliente</SelectItem>
            ) : null}
          </SelectContent>
        </Select>
      </div>

      {isWithoutCustomer ? (
        <div className="space-y-2">
          <Label>Cliente</Label>
          <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            La cotización se guardará sin cliente asignado.
          </div>
        </div>
      ) : (
        <div ref={customerSearchRef} className="relative space-y-2">
          <Label>Cliente</Label>
          <Input
            placeholder="Buscar cliente..."
            value={selectedCustomer ? selectedCustomer.display_name : customerSearch}
            onChange={(event) => {
              setCustomerSearch(event.target.value)
              onCustomerChange(null)
              setShowCustomerList(true)
            }}
            onFocus={() => setShowCustomerList(true)}
          />

          {showCustomerList && !selectedCustomer ? (
            <Card className="absolute z-20 mt-1 max-h-60 w-full overflow-auto">
              <CardContent className="space-y-1 p-2">
                {customerQuery.isFetching && !hasSearchData ? (
                  <div className="p-2 text-sm text-muted-foreground">Buscando...</div>
                ) : null}

                {hasSearchData && customerResults.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    {searchTerm
                      ? `Sin resultados para "${searchTerm}".`
                      : `No hay ${listLabel} disponibles.`}
                  </div>
                ) : null}

                {customerResults.map((customer) => (
                  <button
                    key={`${customer.type}-${customer.id}`}
                    type="button"
                    className="flex w-full flex-col rounded-md px-3 py-2 text-left hover:bg-muted"
                    onClick={() => {
                      onCustomerChange(customer)
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
          <p className="text-xs text-muted-foreground">{selectionHint}</p>
        </div>
      )}
    </>
  )
}
