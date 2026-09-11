import * as React from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { ArrowLeft, FileDown, RefreshCw, Save, Search, Trash2, ImagePlus, X } from "lucide-react"

import {
  useCreateQuote,
  useQuoteCatalogs,
  useUpdateQuoteConfiguration,
} from "@/lib/hooks/quoteHook"
import { useSpaces } from "@/lib/hooks/spaceHook"
import { downloadQuotePdf } from "@/lib/pdf/downloadQuotePdf"
import { previewQuote } from "@/lib/services/quoteService"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { NumericInput } from "@/components/ui/numeric-input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
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
import { QuoteCustomerSelector } from "@/pages/quotes/quoteCustomerSelector"
import type {
  CustomerType,
  QuoteAmountType,
  QuoteCatalogService,
  QuoteCreatePageSpaceSeed,
  QuoteCustomer,
  QuoteItemInput,
  QuoteKind,
  QuotePayload,
  QuotePreviewData,
  QuoteRecord,
} from "@/types/Quote"
import type { SpaceApi } from "@/types/Space"

type QuoteLocationState = {
  spaces?: QuoteCreatePageSpaceSeed[]
}

const CURRENCY = "MXN"
const ADVERTISEMENT_SERVICE_KEY = "anuncio"

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
    square_meters: 1,
    unit_price: toNumber(space.price),
    faces: space.faces ?? null,
    sort_order: index,
    discount_applies: true,
    tax_rate: 16,
  }
}

function calculateItemSubtotal(item: QuoteItemInput) {
  const quantity = Math.max(1, item.qty)
  const squareMeters = Math.max(0.01, toNumber(item.square_meters ?? 1))
  const unitPrice = toNumber(item.unit_price)

  if (item.item_type === "service") {
    return quantity * squareMeters * unitPrice
  }

  return quantity * unitPrice
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
  const navigate = useNavigate()
  const seededSpaces = (location.state as QuoteLocationState | null)?.spaces ?? []

  const catalogsQuery = useQuoteCatalogs()
  const createQuoteMutation = useCreateQuote()
  const updateConfigurationMutation = useUpdateQuoteConfiguration()

  const [customerType, setCustomerType] = React.useState<CustomerType>("lead")
  const [selectedCustomer, setSelectedCustomer] = React.useState<QuoteCustomer | null>(null)
  const [quoteKind, setQuoteKind] = React.useState<QuoteKind>("space")

  const [companyId, setCompanyId] = React.useState<number | null>(null)
  const [letterheadId, setLetterheadId] = React.useState<number | null>(null)
  const [agencyId, setAgencyId] = React.useState<number | null>(null)
  const [validUntil, setValidUntil] = React.useState(plusDaysISO(15))
  const [includeTax, setIncludeTax] = React.useState(true)
  const [taxRate, setTaxRate] = React.useState(16)
  const [discountType, setDiscountType] = React.useState<QuoteAmountType>("none")
  const [discountValue, setDiscountValue] = React.useState(0)
  const [termsHtml, setTermsHtml] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [selectedServiceId, setSelectedServiceId] = React.useState<string>("")
  const [advertisementIdSearch, setAdvertisementIdSearch] = React.useState("")
  const [debouncedAdvertisementId, setDebouncedAdvertisementId] = React.useState("")
  const [squareMeterPrice, setSquareMeterPrice] = React.useState(0)
  const [quoteImages, setQuoteImages] = React.useState<File[]>([])
  const [quoteImageUrls, setQuoteImageUrls] = React.useState<string[]>([])

  const [items, setItems] = React.useState<QuoteItemInput[]>(
    seededSpaces.map((space, index) => normalizeSpaceSeed(space, index))
  )
  const [preview, setPreview] = React.useState<QuotePreviewData | null>(null)
  const [previewError, setPreviewError] = React.useState<string | null>(null)
  const [isPreviewLoading, setIsPreviewLoading] = React.useState(false)
  const [savedQuote, setSavedQuote] = React.useState<QuoteRecord | null>(null)
  const [exitDialogOpen, setExitDialogOpen] = React.useState(false)
  const previewRequestId = React.useRef(0)
  const initialFormFingerprint = React.useRef<string | null>(null)
  const allowNavigation = React.useRef(false)
  const isWithoutCustomer = customerType === "sin_cliente"

  const catalogs = catalogsQuery.data?.data
  const companies = React.useMemo(() => catalogs?.companies ?? [], [catalogs])
  const agencies = React.useMemo(() => catalogs?.agencies ?? [], [catalogs])
  const services = React.useMemo(() => catalogs?.services ?? [], [catalogs])
  const letterheads = React.useMemo(() => catalogs?.letterheads ?? [], [catalogs])
  const showRentalDates = React.useMemo(() => items.some((item) => item.item_type === "rental"), [items])
  const selectedAdvertisementService = React.useMemo(
    () => services.find(
      (service) => service.id === Number(selectedServiceId) && service.key === ADVERTISEMENT_SERVICE_KEY,
    ) ?? null,
    [selectedServiceId, services],
  )
  const advertisementSearchQuery = useSpaces({
    page: 1,
    per_page: 10,
    assigned_id: debouncedAdvertisementId,
  }, Boolean(selectedAdvertisementService && debouncedAdvertisementId))
  const advertisementMatches = advertisementSearchQuery.data?.data ?? []

  React.useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedAdvertisementId(advertisementIdSearch.trim()),
      300,
    )

    return () => window.clearTimeout(timer)
  }, [advertisementIdSearch])

  React.useEffect(() => {
    if (catalogs?.configuration?.price_per_square_meter === undefined) return
    setSquareMeterPrice(toNumber(catalogs.configuration.price_per_square_meter))
  }, [catalogs?.configuration?.price_per_square_meter])

  React.useEffect(() => {
    const urls = quoteImages.map((file) => URL.createObjectURL(file))
    setQuoteImageUrls(urls)

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [quoteImages])

  const selectedCompany = React.useMemo(
    () => companies.find((company) => company.id === companyId) ?? null,
    [companies, companyId]
  )

  const companyLetterheads = React.useMemo(
    () => letterheads.filter((letterhead) => letterhead.company_id === companyId),
    [letterheads, companyId]
  )

  const selectedLetterhead = React.useMemo(
    () => companyLetterheads.find((letterhead) => letterhead.id === letterheadId) ?? null,
    [companyLetterheads, letterheadId]
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

  const formFingerprint = React.useMemo(
    () => JSON.stringify({
      quoteKind,
      customerType,
      customerId: selectedCustomer?.id ?? null,
      companyId,
      letterheadId,
      agencyId,
      validUntil,
      includeTax,
      taxRate,
      discountType,
      discountValue,
      termsHtml,
      notes,
      items,
      images: quoteImages.map((file) => ({
        name: file.name,
        size: file.size,
        lastModified: file.lastModified,
      })),
    }),
    [
      agencyId,
      companyId,
      customerType,
      discountType,
      discountValue,
      includeTax,
      items,
      letterheadId,
      notes,
      quoteImages,
      quoteKind,
      selectedCustomer?.id,
      taxRate,
      termsHtml,
      validUntil,
    ],
  )

  React.useEffect(() => {
    if (initialFormFingerprint.current !== null) return
    if (catalogsQuery.isLoading) return
    if (companies.length > 0 && !companyId) return
    if (companyLetterheads.length > 0 && !letterheadId) return

    initialFormFingerprint.current = formFingerprint
  }, [
    catalogsQuery.isLoading,
    companies.length,
    companyId,
    companyLetterheads.length,
    formFingerprint,
    letterheadId,
  ])

  const hasUnsavedChanges =
    seededSpaces.length > 0 ||
    (initialFormFingerprint.current !== null && initialFormFingerprint.current !== formFingerprint)

  React.useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges || allowNavigation.current) return
      event.preventDefault()
      event.returnValue = ""
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [hasUnsavedChanges])

  React.useEffect(() => {
    const handleLinkNavigation = (event: MouseEvent) => {
      if (!hasUnsavedChanges || allowNavigation.current || event.defaultPrevented) return
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const target = event.target
      if (!(target instanceof Element)) return

      const link = target.closest("a[href]")
      if (!(link instanceof HTMLAnchorElement)) return

      const destination = new URL(link.href, window.location.href)
      if (destination.origin !== window.location.origin) return
      if (destination.pathname === window.location.pathname && destination.search === window.location.search) return

      const shouldLeave = window.confirm(
        "Tienes cambios sin guardar. Si sales perderás todos los avances de esta cotización. ¿Deseas continuar?",
      )

      if (!shouldLeave) {
        event.preventDefault()
        event.stopImmediatePropagation()
        return
      }

      allowNavigation.current = true
    }

    document.addEventListener("click", handleLinkNavigation, true)
    return () => document.removeEventListener("click", handleLinkNavigation, true)
  }, [hasUnsavedChanges])

  const customerDisplayName = isWithoutCustomer
    ? "Sin cliente"
    : selectedCustomer?.display_name ?? "Pendiente"
  const saveBlockingMessage =
    !companyId
      ? "Selecciona una empresa emisora."
      : items.length === 0
        ? "Agrega al menos un item."
        : !isWithoutCustomer && !selectedCustomer
          ? "Selecciona un cliente, o cambia el tipo a Sin cliente para guardar sin asignarlo."
          : null

  const payload = React.useMemo<QuotePayload | null>(() => {
    if (!companyId || items.length === 0) return null
    if (!isWithoutCustomer && !selectedCustomer) return null

    return {
      quote_kind: quoteKind,
      customer: {
        type: customerType,
        id: isWithoutCustomer ? null : selectedCustomer?.id ?? null,
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
      terms_html: termsHtml || null,
      notes: notes || null,
      items: items.map((item, index) => ({
        ...item,
        qty: Math.max(1, item.qty),
        square_meters: Math.max(0.01, toNumber(item.square_meters ?? 1)),
        unit_price: toNumber(item.unit_price),
        tax_rate: toNumber(item.tax_rate ?? taxRate),
        sort_order: index,
      })),
    }
  }, [
    agencyId,
    companyId,
    customerType,
    discountType,
    discountValue,
    includeTax,
    isWithoutCustomer,
    items,
    letterheadId,
    notes,
    quoteKind,
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
        square_meters: 1,
        unit_price: squareMeterPrice,
        sort_order: prev.length,
        discount_applies: false,
        tax_rate: toNumber(service.tax_rate),
      },
    ])
    setSelectedServiceId("")
  }

  const addAdvertisement = (service: QuoteCatalogService, advertisement: SpaceApi) => {
    const assignedId = advertisement.assigned_id?.trim() || String(advertisement.id)
    const width = toNumber(advertisement.width_m)
    const height = toNumber(advertisement.height_m)
    const squareMeters = width > 0 && height > 0 ? width * height : 1

    setItems((prev) => [
      ...prev,
      {
        item_type: "service",
        service_id: service.id,
        space_id: advertisement.id,
        concept: `Anuncio ${assignedId}`,
        description: advertisement.title,
        qty: 1,
        square_meters: squareMeters,
        unit_price: squareMeterPrice || toNumber(service.base_price),
        faces: toNumber(advertisement.faces) || null,
        sort_order: prev.length,
        discount_applies: false,
        tax_rate: toNumber(service.tax_rate),
      },
    ])
    setSelectedServiceId("")
    setAdvertisementIdSearch("")
    setDebouncedAdvertisementId("")
  }

  const addManualService = () => {
    setItems((prev) => [
      ...prev,
      {
        item_type: "service",
        concept: "",
        description: null,
        qty: 1,
        square_meters: 1,
        unit_price: squareMeterPrice,
        sort_order: prev.length,
        discount_applies: false,
        tax_rate: taxRate,
      },
    ])
  }

  const appendQuoteImages = (files: FileList | File[]) => {
    const nextFiles = Array.from(files)

    setQuoteImages((prev) => {
      const merged = [...prev]

      nextFiles.forEach((file) => {
        const alreadyExists = merged.some(
          (existing) =>
            existing.name === file.name &&
            existing.size === file.size &&
            existing.lastModified === file.lastModified
        )

        if (!alreadyExists) {
          merged.push(file)
        }
      })

      return merged.slice(0, 10)
    })
  }

  const removeQuoteImage = (index: number) => {
    setQuoteImages((prev) => prev.filter((_, currentIndex) => currentIndex !== index))
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
      return
    }

    setDiscountType(nextAgency.discount_type)
    setDiscountValue(toNumber(nextAgency.discount_value))
  }

  const handleSaveSquareMeterPrice = async () => {
    try {
      const response = await updateConfigurationMutation.mutateAsync({
        price_per_square_meter: squareMeterPrice,
      })
      setSquareMeterPrice(toNumber(response.data.price_per_square_meter))
      toast.success("Precio por m2 actualizado correctamente.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible actualizar la configuración.")
    }
  }

  const handleSave = async () => {
    if (!payload) {
      toast.error("Completa empresa e items antes de guardar.")
      return
    }

    try {
      const response = await createQuoteMutation.mutateAsync({
        payload,
        images: quoteImages,
      })
      setSavedQuote(response.data)
      setPreview(null)
      setQuoteImages([])
      toast.success(`Cotización ${response.data.folio} guardada correctamente.`)
      allowNavigation.current = true
      if (window.history.length > 1) {
        navigate(-1)
      } else {
        navigate("/cotizaciones", { replace: true })
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible guardar la cotización.")
    }
  }

  const handleDownloadPdf = async () => {
    try {
      if (savedQuote) {
        await downloadQuotePdf(savedQuote, `${savedQuote.folio}.pdf`)
        return
      }

      if (!preview) {
        toast.error("Genera primero la vista previa para descargar el PDF.")
        return
      }

      await downloadQuotePdf(
        {
          quote_kind: quoteKind,
          customer: preview.customer,
          company: preview.company,
          letterhead: selectedLetterhead ?? preview.letterhead,
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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible generar el PDF.")
    }
  }

  const localSubtotal = React.useMemo(
    () => items.reduce((sum, item) => sum + calculateItemSubtotal(item), 0),
    [items]
  )

  const handleBackToQuotes = () => {
    if (hasUnsavedChanges) {
      setExitDialogOpen(true)
      return
    }

    navigate("/cotizaciones")
  }

  const confirmExit = () => {
    allowNavigation.current = true
    setExitDialogOpen(false)
    navigate("/cotizaciones")
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Nueva cotización</h1>
          <p className="text-sm text-muted-foreground">
            Esta pantalla ya consume catálogos y cálculo comercial desde el backend de cotizaciones.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={handleBackToQuotes}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a cotizaciones
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,380px)] xl:grid-cols-[minmax(0,2fr)_380px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Datos comerciales</CardTitle>
              <CardDescription>Cliente, empresa emisora, agencia y vigencia.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <QuoteField label="Tipo de cotización">
                <Select
                  value={quoteKind}
                  onValueChange={(value) => setQuoteKind(value as QuoteKind)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="advertisement">Anuncio</SelectItem>
                    <SelectItem value="space">Espacio</SelectItem>
                  </SelectContent>
                </Select>
              </QuoteField>

              <QuoteCustomerSelector
                customerType={customerType}
                selectedCustomer={selectedCustomer}
                onCustomerTypeChange={setCustomerType}
                onCustomerChange={setSelectedCustomer}
              />

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
                  <NumericInput
                    className="ml-auto w-24"
                    value={taxRate}
                    onValueChange={setTaxRate}
                  />
                </div>
              </QuoteField>

              <QuoteField label="Descuento">
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  <Select
                    value={discountType}
                    onValueChange={(value) => {
                      if (!isQuoteAmountType(value)) return
                      setDiscountType(value)
                      if (value === "none") {
                        setDiscountValue(0)
                      }
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
                  <NumericInput
                    disabled={discountType === "none"}
                    value={discountValue}
                    onValueChange={setDiscountValue}
                  />
                </div>
              </QuoteField>

              <div className="md:col-span-2">
                <div className="rounded-lg border bg-muted/20 p-4">
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold">Configuración de servicios</h3>
                    <p className="text-xs text-muted-foreground">
                      Este valor se usa como precio por defecto al agregar servicios por metros cuadrados.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="space-y-2 sm:max-w-xs sm:flex-1">
                      <Label>Precio por m2</Label>
                      <NumericInput
                        value={squareMeterPrice}
                        onValueChange={setSquareMeterPrice}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSaveSquareMeterPrice}
                      disabled={updateConfigurationMutation.isPending}
                    >
                      {updateConfigurationMutation.isPending ? "Guardando..." : "Guardar precio"}
                    </Button>
                  </div>
                </div>
              </div>
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
                    if (service && service.key !== ADVERTISEMENT_SERVICE_KEY) addService(service)
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

              {selectedAdvertisementService ? (
                <div className="space-y-3 rounded-xl border border-sky-200 bg-sky-50/50 p-4">
                  <div>
                    <h3 className="text-sm font-semibold text-sky-950">Seleccionar anuncio</h3>
                    <p className="text-xs text-sky-800">
                      Busca el ID asignado manualmente al anuncio, no el ID interno del sistema.
                    </p>
                  </div>

                  <div className="relative max-w-md">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      autoFocus
                      className="bg-white pl-9"
                      value={advertisementIdSearch}
                      onChange={(event) => setAdvertisementIdSearch(event.target.value)}
                      placeholder="Ej. AN-001"
                    />
                  </div>

                  {debouncedAdvertisementId ? (
                    <div className="max-h-56 space-y-2 overflow-y-auto">
                      {advertisementSearchQuery.isFetching ? (
                        <p className="text-sm text-muted-foreground">Buscando anuncios...</p>
                      ) : advertisementMatches.length ? (
                        advertisementMatches.map((advertisement) => (
                          <button
                            key={advertisement.id}
                            type="button"
                            className="flex w-full items-center justify-between gap-3 rounded-lg border border-sky-100 bg-white px-3 py-2 text-left transition-colors hover:border-sky-300 hover:bg-sky-50"
                            onClick={() => addAdvertisement(selectedAdvertisementService, advertisement)}
                          >
                            <span>
                              <span className="block text-sm font-semibold text-slate-900">
                                ID {advertisement.assigned_id || "sin ID asignado"}
                              </span>
                              <span className="block text-xs text-muted-foreground">{advertisement.title}</span>
                            </span>
                            <span className="text-xs font-medium text-sky-700">Agregar</span>
                          </button>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No se encontró un anuncio con ese ID.
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="overflow-x-auto">
                <table className={`w-full text-sm ${showRentalDates ? "min-w-[1040px]" : "min-w-[920px]"}`}>
                  <thead className="border-b text-muted-foreground">
                    <tr>
                      <th className="py-3 text-left">Tipo</th>
                      <th className="text-left">Concepto</th>
                      {showRentalDates ? <th className="text-left">Desde</th> : null}
                      {showRentalDates ? <th className="text-left">Hasta</th> : null}
                      <th className="text-left">Metros cuadrados</th>
                      <th className="text-left">Precio / m2</th>
                      <th className="text-right">Subtotal</th>
                      <th className="text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => {
                      const subtotal = calculateItemSubtotal(item)

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
                          {showRentalDates ? (
                            <td className="py-4">
                              {item.item_type === "rental" ? (
                                <Input
                                  type="date"
                                  value={item.start_date ?? ""}
                                  onChange={(event) => updateItem(index, { start_date: event.target.value })}
                                />
                              ) : (
                                <div className="py-2 text-center text-muted-foreground">—</div>
                              )}
                            </td>
                          ) : null}
                          {showRentalDates ? (
                            <td className="py-4">
                              {item.item_type === "rental" ? (
                                <Input
                                  type="date"
                                  value={item.end_date ?? ""}
                                  onChange={(event) => updateItem(index, { end_date: event.target.value })}
                                />
                              ) : (
                                <div className="py-2 text-center text-muted-foreground">—</div>
                              )}
                            </td>
                          ) : null}
                          <td className="py-4">
                            {item.item_type === "service" ? (
                              <NumericInput
                                value={item.square_meters ?? 1}
                                onValueChange={(value) =>
                                  updateItem(index, { square_meters: Math.max(0.01, value) })
                                }
                              />
                            ) : (
                              <div className="py-2 text-center text-muted-foreground">—</div>
                            )}
                          </td>
                          <td className="py-4">
                            <NumericInput
                              value={item.unit_price}
                              onValueChange={(value) => updateItem(index, { unit_price: value })}
                            />
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

              <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
                <div>
                  <h3 className="text-sm font-semibold">Imágenes de la cotización</h3>
                  <p className="text-xs text-muted-foreground">
                    Puedes adjuntar varias imágenes para respaldar la cotización.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) => {
                      if (event.target.files?.length) {
                        appendQuoteImages(event.target.files)
                      }
                      event.target.value = ""
                    }}
                    className="sm:max-w-md"
                  />
                  <div className="text-xs text-muted-foreground">
                    {quoteImages.length}/10 imágenes seleccionadas
                  </div>
                </div>

                {quoteImages.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {quoteImages.map((file, index) => (
                      <div key={`${file.name}-${file.lastModified}-${index}`} className="overflow-hidden rounded-lg border bg-background">
                        <div className="relative aspect-video bg-muted">
                          <img
                            src={quoteImageUrls[index]}
                            alt={file.name}
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeQuoteImage(index)}
                            className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white shadow hover:bg-black"
                            aria-label={`Eliminar ${file.name}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
                          <ImagePlus className="h-4 w-4 shrink-0" />
                          <span className="truncate">{file.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed bg-background px-3 py-6 text-center text-xs text-muted-foreground">
                    No hay imágenes agregadas todavía.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="order-first space-y-6 lg:order-none lg:sticky lg:top-20 lg:self-start">
          <Card className="border-primary/15 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Resumen</CardTitle>
              <CardDescription>
                {isPreviewLoading ? "Calculando vista previa..." : "Totales calculados"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
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
              <div className="flex justify-between border-t pt-3 text-base font-semibold">
                <span>Total</span>
                <span>{formatCurrency(preview?.totals.total ?? 0)}</span>
              </div>

              {previewError ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {previewError}
                </div>
              ) : null}

              {saveBlockingMessage ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  {saveBlockingMessage}
                </div>
              ) : null}

              <div className="rounded-md border bg-muted/50 p-3 text-xs text-muted-foreground">
                <div>Cliente: {customerDisplayName}</div>
                <div>Empresa: {selectedCompany?.name ?? "Pendiente"}</div>
                <div>Membretado: {selectedLetterhead?.name ?? "Sin membrete"}</div>
                <div>Agencia: {selectedAgency?.name ?? "Sin agencia"}</div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={handleDownloadPdf}
                  disabled={(!preview && !savedQuote) || isPreviewLoading}
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

      <AlertDialog open={exitDialogOpen} onOpenChange={setExitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Salir de la nueva cotización?</AlertDialogTitle>
            <AlertDialogDescription>
              Tienes cambios sin guardar. Si sales ahora perderás todos los avances de esta cotización.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Seguir editando</AlertDialogCancel>
            <AlertDialogAction onClick={confirmExit}>
              Salir sin guardar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
