import * as React from "react"
import { useLocation } from "react-router-dom"
import { toast } from "sonner"
import { FileDown, Minus, Plus, RefreshCw, Save, Trash2 } from "lucide-react"

import { useCreateQuote, useQuoteCatalogs, useQuoteCustomerSearch } from "@/lib/hooks/quoteHook"
import { downloadQuotePdf } from "@/lib/pdf/downloadQuotePdf"
import { previewQuote } from "@/lib/services/quoteService"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type {
  CustomerType,
  QuoteAmountType,
  QuoteCatalogService,
  QuoteCreatePageSpaceSeed,
  QuoteCustomer,
  QuoteItemInput,
  QuotePayload,
  QuotePreviewData,
  QuoteRecord,
} from "@/types/Quote"

type QuoteLocationState = {
  spaces?: QuoteCreatePageSpaceSeed[]
}

const CURRENCY = "MXN"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: CURRENCY,
  }).format(value || 0)
}

function toNumber(value: string | number | null | undefined) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function plusDaysISO(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function normalizeSpaceSeed(space: QuoteCreatePageSpaceSeed, index: number): QuoteItemInput {
  return {
    item_type: "rental",
    space_id: Number(space.id),
    concept: space.title,
    start_date: todayISO(),
    end_date: plusDaysISO(30),
    qty: 1,
    unit_price: toNumber(space.price),
    faces: space.faces ?? null,
    sort_order: index,
    discount_applies: true,
    tax_rate: 16,
  }
}

function isQuoteAmountType(value: string): value is QuoteAmountType {
  return value === "none" || value === "percent" || value === "fixed"
}

function QuoteField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

export default function QuoteCreatePage() {
  const location = useLocation()
  const seededSpaces = (location.state as QuoteLocationState | null)?.spaces ?? []

  const catalogsQuery = useQuoteCatalogs()
  const createQuoteMutation = useCreateQuote()

  const [customerType, setCustomerType] = React.useState<CustomerType>("lead")
  const [customerSearch, setCustomerSearch] = React.useState("")
  const [selectedCustomer, setSelectedCustomer] = React.useState<QuoteCustomer | null>(null)
  const [showCustomerList, setShowCustomerList] = React.useState(false)

  const [companyId, setCompanyId] = React.useState<number | null>(null)
  const [letterheadId, setLetterheadId] = React.useState<number | null>(null)
  const [agencyId, setAgencyId] = React.useState<number | null>(null)
  const [validUntil, setValidUntil] = React.useState(plusDaysISO(15))
  const [includeTax, setIncludeTax] = React.useState(true)
  const [taxRate, setTaxRate] = React.useState(16)
  const [discountType, setDiscountType] = React.useState<QuoteAmountType>("none")
  const [discountValue, setDiscountValue] = React.useState(0)
  const [commissionType, setCommissionType] = React.useState<QuoteAmountType>("none")
  const [commissionValue, setCommissionValue] = React.useState(0)
  const [termsHtml, setTermsHtml] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [selectedServiceId, setSelectedServiceId] = React.useState<string>("")

  const [items, setItems] = React.useState<QuoteItemInput[]>(
    seededSpaces.map((space, index) => normalizeSpaceSeed(space, index))
  )
  const [preview, setPreview] = React.useState<QuotePreviewData | null>(null)
  const [previewError, setPreviewError] = React.useState<string | null>(null)
  const [isPreviewLoading, setIsPreviewLoading] = React.useState(false)
  const [savedQuote, setSavedQuote] = React.useState<QuoteRecord | null>(null)
  const previewRequestId = React.useRef(0)

  const customerQuery = useQuoteCustomerSearch(customerSearch, customerType)

  const catalogs = catalogsQuery.data?.data
  const companies = catalogs?.companies ?? []
  const agencies = catalogs?.agencies ?? []
  const services = catalogs?.services ?? []
  const letterheads = catalogs?.letterheads ?? []

  const selectedCompany = React.useMemo(
    () => companies.find((company) => company.id === companyId) ?? null,
    [companies, companyId]
  )

  const companyLetterheads = React.useMemo(
    () => letterheads.filter((letterhead) => letterhead.company_id === companyId),
    [letterheads, companyId]
  )

  const selectedAgency = React.useMemo(
    () => agencies.find((agency) => agency.id === agencyId) ?? null,
    [agencies, agencyId]
  )

  React.useEffect(() => {
    if (!companies.length || companyId) return

    const defaultCompany = companies[0]
    setCompanyId(defaultCompany.id)
    setTermsHtml(defaultCompany.default_terms_html ?? "")
  }, [companies, companyId])

  React.useEffect(() => {
    if (!selectedCompany) return

    const validLetterhead = companyLetterheads.find((letterhead) => letterhead.id === letterheadId)
    if (validLetterhead) return

    const defaultLetterhead =
      companyLetterheads.find((letterhead) => letterhead.is_default) ?? companyLetterheads[0] ?? null
    setLetterheadId(defaultLetterhead?.id ?? null)
  }, [companyLetterheads, letterheadId, selectedCompany])

  const filteredCustomerResults = customerQuery.data?.data ?? []

  const payload = React.useMemo<QuotePayload | null>(() => {
    if (!selectedCustomer || !companyId || items.length === 0) return null

    return {
      customer: {
        type: customerType,
        id: selectedCustomer.id,
      },
      issuer_company_id: companyId,
      letterhead_id: letterheadId,
      agency_id: agencyId,
      valid_until: validUntil || null,
      includes_tax: includeTax,
      tax_rate: taxRate,
      discount: {
        type: discountType,
        value: discountValue,
      },
      commission: {
        type: commissionType,
        value: commissionValue,
      },
      terms_html: termsHtml || null,
      notes: notes || null,
      items: items.map((item, index) => ({
        ...item,
        qty: Math.max(1, item.qty),
        unit_price: toNumber(item.unit_price),
        tax_rate: toNumber(item.tax_rate ?? taxRate),
        sort_order: index,
      })),
    }
  }, [
    agencyId,
    companyId,
    commissionType,
    commissionValue,
    customerType,
    discountType,
    discountValue,
    includeTax,
    items,
    letterheadId,
    notes,
    selectedCustomer,
    taxRate,
    termsHtml,
    validUntil,
  ])

  const canPreview = React.useMemo(() => {
    if (!payload) return false

    return payload.items.every((item) => {
      if (item.item_type === "service") return true
      return !!item.space_id && !!item.start_date && !!item.end_date
    })
  }, [payload])

  React.useEffect(() => {
    setSavedQuote(null)
  }, [payload])

  React.useEffect(() => {
    if (!canPreview || !payload) {
      setPreview(null)
      setPreviewError(null)
      return
    }

    const requestId = ++previewRequestId.current
    const timer = window.setTimeout(async () => {
      setIsPreviewLoading(true)
      try {
        const response = await previewQuote(payload)
        if (previewRequestId.current !== requestId) return
        setPreview(response.data)
        setPreviewError(null)
      } catch (error) {
        if (previewRequestId.current !== requestId) return
        setPreview(null)
        setPreviewError(error instanceof Error ? error.message : "No fue posible calcular la cotización.")
      } finally {
        if (previewRequestId.current === requestId) {
          setIsPreviewLoading(false)
        }
      }
    }, 500)

    return () => {
      window.clearTimeout(timer)
    }
  }, [canPreview, payload])

  const updateItem = (index: number, changes: Partial<QuoteItemInput>) => {
    setItems((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              ...changes,
            }
          : item
      )
    )
  }

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index))
  }

  const addService = (service: QuoteCatalogService) => {
    setItems((prev) => [
      ...prev,
      {
        item_type: "service",
        service_id: service.id,
        concept: service.name,
        description: service.description ?? null,
        qty: 1,
        unit_price: toNumber(service.base_price),
        sort_order: prev.length,
        discount_applies: false,
        tax_rate: toNumber(service.tax_rate),
      },
    ])
    setSelectedServiceId("")
  }

  const addManualService = () => {
    setItems((prev) => [
      ...prev,
      {
        item_type: "service",
        concept: "",
        description: null,
        qty: 1,
        unit_price: 0,
        sort_order: prev.length,
        discount_applies: false,
        tax_rate: taxRate,
      },
    ])
  }

  const handleCompanyChange = (value: string) => {
    const nextCompany = companies.find((company) => company.id === Number(value)) ?? null
    setCompanyId(nextCompany?.id ?? null)
    if (nextCompany) {
      setTermsHtml(nextCompany.default_terms_html ?? "")
    }
  }

  const handleAgencyChange = (value: string) => {
    const nextAgency = agencies.find((agency) => agency.id === Number(value)) ?? null
    setAgencyId(nextAgency?.id ?? null)

    if (!nextAgency) {
      setDiscountType("none")
      setDiscountValue(0)
      setCommissionType("none")
      setCommissionValue(0)
      return
    }

    setDiscountType(nextAgency.discount_type)
    setDiscountValue(toNumber(nextAgency.discount_value))
    setCommissionType(nextAgency.commission_type)
    setCommissionValue(toNumber(nextAgency.commission_value))
  }

  const handleSave = async () => {
    if (!payload) {
      toast.error("Completa cliente, empresa e items antes de guardar.")
      return
    }

    try {
      const response = await createQuoteMutation.mutateAsync(payload)
      setSavedQuote(response.data)
      setPreview(null)
      toast.success(`Cotización ${response.data.folio} guardada correctamente.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible guardar la cotización.")
    }
  }

  const handleDownloadPdf = () => {
    if (savedQuote) {
      downloadQuotePdf(savedQuote, `${savedQuote.folio}.pdf`)
      return
    }

    if (!preview) {
      toast.error("Genera primero la vista previa para descargar el PDF.")
      return
    }

    downloadQuotePdf(
      {
        customer: preview.customer,
        company: preview.company,
        agency: preview.agency,
        items: preview.items,
        totals: preview.totals,
        notes: notes || null,
        terms_html: preview.resolved.terms_html ?? termsHtml ?? null,
        includes_tax: preview.resolved.includes_tax,
        valid_until: validUntil || null,
      },
      "cotizacion-preliminar.pdf"
    )
  }

  const localSubtotal = React.useMemo(
    () => items.reduce((sum, item) => sum + Math.max(1, item.qty) * toNumber(item.unit_price), 0),
    [items]
  )

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Nueva cotización</h1>
        <p className="text-sm text-muted-foreground">
          Esta pantalla ya consume catálogos y cálculo comercial desde el backend de cotizaciones.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,380px)] xl:grid-cols-[minmax(0,2fr)_380px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Datos comerciales</CardTitle>
              <CardDescription>Cliente, empresa emisora, agencia y vigencia.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <QuoteField label="Tipo de cliente">
                <Select
                  value={customerType}
                  onValueChange={(value) => {
                    setCustomerType(value as CustomerType)
                    setSelectedCustomer(null)
                    setCustomerSearch("")
                    setShowCustomerList(false)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead / Prospecto</SelectItem>
                    <SelectItem value="cliente">Cliente</SelectItem>
                  </SelectContent>
                </Select>
              </QuoteField>

              <div className="relative space-y-2">
                <Label>Cliente</Label>
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

                      {!customerQuery.isFetching && filteredCustomerResults.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">Sin resultados.</div>
                      ) : null}

                      {filteredCustomerResults.map((customer) => (
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

              <QuoteField label="Empresa emisora">
                <Select
                  value={companyId ? String(companyId) : undefined}
                  onValueChange={handleCompanyChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={String(company.id)}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </QuoteField>

              <QuoteField label="Hoja membretada">
                <Select
                  value={letterheadId ? String(letterheadId) : "none"}
                  onValueChange={(value) => setLetterheadId(value === "none" ? null : Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona membrete" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin membrete</SelectItem>
                    {companyLetterheads.map((letterhead) => (
                      <SelectItem key={letterhead.id} value={String(letterhead.id)}>
                        {letterhead.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </QuoteField>

              <QuoteField label="Agencia">
                <Select
                  value={agencyId ? String(agencyId) : "none"}
                  onValueChange={handleAgencyChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin agencia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin agencia</SelectItem>
                    {agencies.map((agency) => (
                      <SelectItem key={agency.id} value={String(agency.id)}>
                        {agency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </QuoteField>

              <QuoteField label="Vigencia">
                <Input
                  type="date"
                  value={validUntil}
                  onChange={(event) => setValidUntil(event.target.value)}
                />
              </QuoteField>

              <QuoteField label="IVA">
                <div className="flex items-center gap-3 rounded-md border px-3 py-2">
                  <Checkbox
                    checked={includeTax}
                    onCheckedChange={(checked) => setIncludeTax(Boolean(checked))}
                  />
                  <span className="text-sm">Incluir IVA</span>
                  <Input
                    className="ml-auto w-24"
                    type="number"
                    min="0"
                    step="0.01"
                    value={taxRate}
                    onChange={(event) => setTaxRate(toNumber(event.target.value))}
                  />
                </div>
              </QuoteField>

              <QuoteField label="Descuento">
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  <Select
                    value={discountType}
                    onValueChange={(value) => {
                      if (isQuoteAmountType(value)) setDiscountType(value)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin descuento</SelectItem>
                      <SelectItem value="percent">Porcentaje</SelectItem>
                      <SelectItem value="fixed">Monto fijo</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discountValue}
                    onChange={(event) => setDiscountValue(toNumber(event.target.value))}
                  />
                </div>
              </QuoteField>

              <QuoteField label="Comisión">
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  <Select
                    value={commissionType}
                    onValueChange={(value) => {
                      if (isQuoteAmountType(value)) setCommissionType(value)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin comisión</SelectItem>
                      <SelectItem value="percent">Porcentaje</SelectItem>
                      <SelectItem value="fixed">Monto fijo</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={commissionValue}
                    onChange={(event) => setCommissionValue(toNumber(event.target.value))}
                  />
                </div>
              </QuoteField>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Items de cotización</CardTitle>
              <CardDescription>Rentas precargadas desde espacios y servicios agregados desde catálogo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row">
                <Select
                  value={selectedServiceId}
                  onValueChange={(value) => {
                    setSelectedServiceId(value)
                    const service = services.find((entry) => entry.id === Number(value))
                    if (service) addService(service)
                  }}
                >
                  <SelectTrigger className="md:max-w-sm">
                    <SelectValue placeholder="Agregar servicio desde catálogo" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={String(service.id)}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={addManualService}>
                  Agregar servicio libre
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] text-sm">
                  <thead className="border-b text-muted-foreground">
                    <tr>
                      <th className="py-3 text-left">Tipo</th>
                      <th className="text-left">Concepto</th>
                      <th className="text-left">Desde</th>
                      <th className="text-left">Hasta</th>
                      <th className="text-center">Cant.</th>
                      <th className="text-left">Precio</th>
                      <th className="text-center">Desc.</th>
                      <th className="text-right">Subtotal</th>
                      <th className="text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => {
                      const subtotal = Math.max(1, item.qty) * toNumber(item.unit_price)

                      return (
                        <tr key={`${item.item_type}-${item.space_id ?? item.service_id ?? index}`} className="border-b align-top">
                          <td className="py-4">
                            <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium">
                              {item.item_type === "rental" ? "Renta" : "Servicio"}
                            </span>
                          </td>
                          <td className="py-4">
                            <div className="space-y-2">
                              <Input
                                value={item.concept ?? ""}
                                onChange={(event) => updateItem(index, { concept: event.target.value })}
                                placeholder="Concepto"
                              />
                              <Input
                                value={item.description ?? ""}
                                onChange={(event) => updateItem(index, { description: event.target.value })}
                                placeholder="Descripción opcional"
                              />
                            </div>
                          </td>
                          <td className="py-4">
                            <Input
                              type="date"
                              value={item.start_date ?? ""}
                              disabled={item.item_type === "service"}
                              onChange={(event) => updateItem(index, { start_date: event.target.value })}
                            />
                          </td>
                          <td className="py-4">
                            <Input
                              type="date"
                              value={item.end_date ?? ""}
                              disabled={item.item_type === "service"}
                              onChange={(event) => updateItem(index, { end_date: event.target.value })}
                            />
                          </td>
                          <td className="py-4">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() =>
                                  updateItem(index, {
                                    qty: Math.max(1, item.qty - 1),
                                  })
                                }
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-6 text-center">{item.qty}</span>
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() =>
                                  updateItem(index, {
                                    qty: item.qty + 1,
                                  })
                                }
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                          <td className="py-4">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unit_price}
                              onChange={(event) =>
                                updateItem(index, {
                                  unit_price: toNumber(event.target.value),
                                })
                              }
                            />
                          </td>
                          <td className="py-4">
                            <div className="flex justify-center">
                              <Checkbox
                                checked={item.discount_applies ?? item.item_type === "rental"}
                                disabled={item.item_type === "service"}
                                onCheckedChange={(checked) =>
                                  updateItem(index, { discount_applies: Boolean(checked) })
                                }
                              />
                            </div>
                          </td>
                          <td className="py-4 text-right font-medium">{formatCurrency(subtotal)}</td>
                          <td className="py-4 text-right">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => removeItem(index)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Condiciones y notas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <QuoteField label="Condiciones de la cotización">
                <Textarea
                  className="min-h-[150px]"
                  value={termsHtml}
                  onChange={(event) => setTermsHtml(event.target.value)}
                  placeholder="Términos, forma de pago, vigencia, observaciones..."
                />
              </QuoteField>

              <QuoteField label="Notas internas">
                <Textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Notas para el equipo comercial..."
                />
              </QuoteField>
            </CardContent>
          </Card>
        </div>

        <div className="order-first space-y-6 lg:order-none lg:sticky lg:top-20 lg:self-start">
          <Card className="border-primary/15 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Resumen</CardTitle>
              <CardDescription>
                {isPreviewLoading ? "Calculando vista previa..." : "Totales calculados por backend."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Subtotal local</span>
                <span>{formatCurrency(localSubtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Subtotal rentas</span>
                <span>{formatCurrency(preview?.totals.rentals_subtotal ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Subtotal servicios</span>
                <span>{formatCurrency(preview?.totals.services_subtotal ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Descuento</span>
                <span>{formatCurrency(preview?.totals.discount_amount ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>IVA</span>
                <span>{formatCurrency(preview?.totals.tax ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Comisión agencia</span>
                <span>{formatCurrency(preview?.totals.commission_amount ?? 0)}</span>
              </div>
              <div className="flex justify-between border-t pt-3 text-base font-semibold">
                <span>Total</span>
                <span>{formatCurrency(preview?.totals.total ?? 0)}</span>
              </div>

              {previewError ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {previewError}
                </div>
              ) : null}

              <div className="rounded-md border bg-muted/50 p-3 text-xs text-muted-foreground">
                <div>Cliente: {selectedCustomer?.display_name ?? "Pendiente"}</div>
                <div>Empresa: {selectedCompany?.name ?? "Pendiente"}</div>
                <div>Agencia: {selectedAgency?.name ?? "Sin agencia"}</div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={handleDownloadPdf}
                  disabled={!preview && !savedQuote}
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  Descargar cotización PDF
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!preview || createQuoteMutation.isPending}
                >
                  {createQuoteMutation.isPending ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Guardar cotización
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
