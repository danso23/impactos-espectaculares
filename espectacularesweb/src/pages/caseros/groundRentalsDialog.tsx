import * as React from "react"
import { Building2, CalendarDays, CheckCircle2, ChevronDown, ChevronsUpDown, CircleDollarSign, Download, Landmark, Loader2, Plus, ReceiptText, Search, X } from "lucide-react"
import { toast } from "sonner"
import * as XLSX from "xlsx"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAvailableGroundRentSpaces, useCreateGroundProperty, useCreateGroundRentContract, useGroundRentals, useMarkGroundRentPaymentPaid } from "@/lib/hooks/groundRentHook"
import type { CaseroRecord } from "@/types/Casero"
import type { GroundProperty, GroundRentContract, GroundRentPayment } from "@/types/GroundRent"

const frequencyLabels = {
  monthly: "Mensual",
  quarterly: "Trimestral",
  semiannual: "Semestral",
  annual: "Anual",
} as const

function currency(value: number | string) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(value))
}

function date(value?: string | null) {
  if (!value) return "—"
  const parsed = new Date(`${value.slice(0, 10)}T12:00:00`)
  return Number.isNaN(parsed.getTime()) ? "—" : new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(parsed)
}

function statusLabel(status: GroundRentPayment["status"]) {
  return { pending: "Pendiente", paid: "Pagado", overdue: "Vencido", cancelled: "Cancelado" }[status]
}

function statusClass(status: GroundRentPayment["status"]) {
  return {
    pending: "border-amber-200 bg-amber-50 text-amber-700",
    paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
    overdue: "border-rose-200 bg-rose-50 text-rose-700",
    cancelled: "border-slate-200 bg-slate-50 text-slate-500",
  }[status]
}

function excelDate(value?: string | null) {
  if (!value) return ""
  const dateValue = new Date(`${value.slice(0, 10)}T12:00:00`)
  return Number.isNaN(dateValue.getTime()) ? "" : dateValue
}

function addYears(value: Date, years: number) {
  const result = new Date(value)
  result.setFullYear(result.getFullYear() + years)
  return result
}

function subtractDay(value: Date) {
  const result = new Date(value)
  result.setDate(result.getDate() - 1)
  return result
}

function contractStatus(contract: GroundRentContract) {
  if (contract.payments.length > 0 && contract.payments.every((payment) => payment.status === "paid")) return "Pagado"
  if (contract.payments.some((payment) => payment.status === "overdue")) return "Vencido"
  if (contract.payments.some((payment) => payment.status === "paid")) return "Parcial"
  return "Pendiente"
}

function downloadReport(casero: CaseroRecord | null, properties: GroundProperty[]) {
  const contracts = properties.flatMap((property) => property.contracts.map((contract) => ({ property, contract })))
  const maximumPayments = Math.max(1, ...contracts.map(({ contract }) => contract.payments.length))
  const paymentHeaders = Array.from({ length: maximumPayments }, (_, index) => `PAGO ${index + 1}`)
  const columns = ["NO. CONTRATO", "ESPECTACULAR", "PROPIETARIO (CASERO)", "UBICACIÓN", "TIPO", "VISTA", "ILUM", "MEDIDAS MTS.", "DEL", "AL", "DEL", "AL", "DEL", "AL", "DEL", "AL", "PERIODICIDAD DE PAGO", "FECHA DE INICIO REAL", "ESTATUS", ...paymentHeaders]
  const rows: Array<Array<string | number | Date>> = [["", "", "", "", "", "", "", "", "CONTRATO", "", "PRIMER AÑO", "", "SEGUNDO AÑO", "", "TERCER AÑO", "", "", "", "", "FECHA DE PAGO", ...Array(Math.max(0, maximumPayments - 1)).fill("")], columns]
  const caseroName = [casero?.nombre, casero?.apellido_paterno, casero?.apellido_materno].filter(Boolean).join(" ")

  contracts.forEach(({ property, contract }) => {
    const start = excelDate(contract.starts_at)
    const lastPayment = contract.payments.at(-1)
    const end = excelDate(lastPayment?.period_end)
    const contractStart = start instanceof Date ? start : ""
    const contractEnd = end instanceof Date ? end : ""
    const yearRange = (year: number) => {
      if (!(start instanceof Date)) return ["", ""]
      const yearStart = addYears(start, year)
      const yearEnd = subtractDay(addYears(start, year + 1))
      if (end instanceof Date && yearStart > end) return ["", ""]
      return [yearStart, end instanceof Date && yearEnd > end ? end : yearEnd]
    }
    const [firstYearStart, firstYearEnd] = yearRange(0)
    const [secondYearStart, secondYearEnd] = yearRange(1)
    const [thirdYearStart, thirdYearEnd] = yearRange(2)
    const spaces = property.spaces.length > 0 ? property.spaces : [{ id: 0, title: "—" }]

    spaces.forEach((space) => rows.push([
      contract.contract_number || `Contrato #${contract.id}`,
      space.title,
      caseroName,
      property.address || property.name,
      space.type || "—",
      space.view_type || "—",
      space.has_lights === null || space.has_lights === undefined ? "—" : space.has_lights ? "Sí" : "No",
      space.width_m && space.height_m ? `${space.width_m} × ${space.height_m}` : "—",
      contractStart,
      contractEnd,
      firstYearStart,
      firstYearEnd,
      secondYearStart,
      secondYearEnd,
      thirdYearStart,
      thirdYearEnd,
      frequencyLabels[contract.payment_frequency],
      contractStart,
      contractStatus(contract),
      ...contract.payments.map((payment) => excelDate(payment.paid_at || payment.due_date)),
      ...Array(Math.max(0, maximumPayments - contract.payments.length)).fill(""),
    ]))
  })

  const worksheet = XLSX.utils.aoa_to_sheet(rows, { cellDates: true })
  worksheet["!merges"] = [
    { s: { r: 0, c: 8 }, e: { r: 0, c: 9 } },
    { s: { r: 0, c: 10 }, e: { r: 0, c: 11 } },
    { s: { r: 0, c: 12 }, e: { r: 0, c: 13 } },
    { s: { r: 0, c: 14 }, e: { r: 0, c: 15 } },
    { s: { r: 0, c: 19 }, e: { r: 0, c: 19 + maximumPayments - 1 } },
  ]
  worksheet["!cols"] = [19, 16, 26, 34, 15, 18, 10, 16, 13, 13, 13, 13, 13, 13, 13, 13, 21, 20, 14, ...Array(maximumPayments).fill(14)].map((wch) => ({ wch }))
  worksheet["!autofilter"] = { ref: `A2:${XLSX.utils.encode_col(columns.length - 1)}${rows.length}` }
  worksheet["!freeze"] = { xSplit: 0, ySplit: 2 }

  const headerStyle = { fill: { fgColor: { rgb: "21413F" } }, font: { bold: true, color: { rgb: "FFFFFF" } }, alignment: { horizontal: "center", vertical: "center", wrapText: true } }
  const border = { top: { style: "thin", color: { rgb: "D1D5DB" } }, bottom: { style: "thin", color: { rgb: "D1D5DB" } }, left: { style: "thin", color: { rgb: "D1D5DB" } }, right: { style: "thin", color: { rgb: "D1D5DB" } } }
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    for (let columnIndex = 0; columnIndex < columns.length; columnIndex++) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex })]
      if (!cell) continue
      cell.s = rowIndex < 2 ? headerStyle : { border, alignment: { vertical: "center" } }
      if (rowIndex >= 2 && ([8, 9, 10, 11, 12, 13, 14, 15, 17].includes(columnIndex) || columnIndex >= 19) && cell.v instanceof Date) cell.z = "dd mmm yyyy"
    }
  }

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Rentas de piso")
  XLSX.writeFile(workbook, `rentas-de-piso-${casero?.id ?? "casero"}.xlsx`, { compression: true })
}

function SpaceMultiSelect({ spaces, selectedIds, onChange, loading }: { spaces: Array<{ id: number; title: string }>; selectedIds: number[]; onChange: (ids: number[]) => void; loading: boolean }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const filteredSpaces = React.useMemo(() => spaces.filter((space) => space.title.toLocaleLowerCase("es-MX").includes(search.toLocaleLowerCase("es-MX"))), [spaces, search])
  const selectionLabel = selectedIds.length === 0 ? "Selecciona uno o varios espacios" : selectedIds.length === 1 ? spaces.find((space) => space.id === selectedIds[0])?.title || "1 espacio seleccionado" : `${selectedIds.length} espacios seleccionados`

  function toggle(id: number) {
    onChange(selectedIds.includes(id) ? selectedIds.filter((selectedId) => selectedId !== id) : [...selectedIds, id])
  }

  return <div className="relative">
    <Button type="button" variant="outline" className="h-11 w-full justify-between rounded-xl bg-white px-3 font-normal" disabled={loading || spaces.length === 0} onClick={() => setIsOpen((current) => !current)}>
      <span className="truncate text-left">{loading ? "Cargando espacios…" : selectionLabel}</span><ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
    </Button>
    {isOpen && <div className="absolute z-50 mt-2 w-full rounded-xl border border-violet-100 bg-white p-2 shadow-xl shadow-violet-950/10">
      <div className="relative mb-2"><Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar espacio…" className="h-9 bg-slate-50 pl-8" /></div>
      <div className="max-h-48 space-y-1 overflow-y-auto">{filteredSpaces.length === 0 ? <p className="px-2 py-3 text-sm text-muted-foreground">No se encontraron espacios.</p> : filteredSpaces.map((space) => <label key={space.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-violet-50"><Checkbox checked={selectedIds.includes(space.id)} onCheckedChange={() => toggle(space.id)} />{space.title}</label>)}</div>
      <div className="mt-2 flex justify-between border-t border-violet-100 pt-2"><Button type="button" variant="ghost" size="sm" disabled={selectedIds.length === 0} onClick={() => onChange([])}><X className="mr-1 h-3.5 w-3.5" />Limpiar</Button><Button type="button" variant="ghost" size="sm" onClick={() => setIsOpen(false)}>Listo</Button></div>
    </div>}
  </div>
}

function PaymentSchedule({ contract, canEdit, paymentIsUpdating, onPay }: { contract: GroundRentContract; canEdit: boolean; paymentIsUpdating: boolean; onPay: (payment: GroundRentPayment) => void }) {
  const [isOpen, setIsOpen] = React.useState(false)

  return <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-3 overflow-hidden rounded-xl border last:mb-0">
    <CollapsibleTrigger asChild>
      <button type="button" className="flex w-full flex-wrap items-center justify-between gap-2 bg-slate-50 px-3 py-3 text-left text-sm transition-colors hover:bg-violet-50">
        <span className="font-medium">{contract.contract_number || `Contrato #${contract.id}`} · {frequencyLabels[contract.payment_frequency]}</span>
        <span className="flex items-center gap-3"><span>{currency(contract.payment_amount)} × {contract.payment_count}</span><span className="inline-flex items-center gap-1 text-violet-700">{isOpen ? "Ocultar calendario" : "Ver calendario"}<ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} /></span></span>
      </button>
    </CollapsibleTrigger>
    <CollapsibleContent>
      <div className="overflow-x-auto border-t"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-white text-xs uppercase text-slate-500"><tr><th className="px-3 py-2">#</th><th className="px-3 py-2">Periodo</th><th className="px-3 py-2">Vence</th><th className="px-3 py-2">Importe</th><th className="px-3 py-2">Estatus</th><th className="px-3 py-2 text-right">Acción</th></tr></thead><tbody>{contract.payments.map((payment) => <tr key={payment.id} className="border-t"><td className="px-3 py-2">{payment.installment_number}</td><td className="px-3 py-2">{date(payment.period_start)} – {date(payment.period_end)}</td><td className="px-3 py-2">{date(payment.due_date)}</td><td className="px-3 py-2">{currency(payment.amount)}</td><td className="px-3 py-2"><span className={`rounded-full border px-2 py-1 text-xs font-medium ${statusClass(payment.status)}`}>{statusLabel(payment.status)}</span></td><td className="px-3 py-2 text-right">{payment.status === "paid" ? <span className="inline-flex items-center gap-1 text-xs text-emerald-700"><CheckCircle2 className="h-4 w-4" />{date(payment.paid_at)}</span> : canEdit && payment.status !== "cancelled" ? <Button size="sm" variant="outline" disabled={paymentIsUpdating} onClick={() => onPay(payment)}>Marcar pagado</Button> : "—"}</td></tr>)}</tbody></table></div>
    </CollapsibleContent>
  </Collapsible>
}

export function GroundRentalsDialog({ casero, open, onOpenChange, canEdit }: { casero: CaseroRecord | null; open: boolean; onOpenChange: (open: boolean) => void; canEdit: boolean }) {
  const caseroId = casero?.id ?? null
  const rentalsQuery = useGroundRentals(caseroId)
  const spacesQuery = useAvailableGroundRentSpaces(open)
  const createProperty = useCreateGroundProperty(caseroId ?? 0)
  const createContract = useCreateGroundRentContract(caseroId ?? 0)
  const markPaid = useMarkGroundRentPaymentPaid(caseroId ?? 0)
  const [propertyName, setPropertyName] = React.useState("")
  const [propertyAddress, setPropertyAddress] = React.useState("")
  const [selectedSpaceIds, setSelectedSpaceIds] = React.useState<number[]>([])
  const [propertyId, setPropertyId] = React.useState("")
  const [contractNumber, setContractNumber] = React.useState("")
  const [startsAt, setStartsAt] = React.useState("")
  const [firstPaymentDate, setFirstPaymentDate] = React.useState("")
  const [frequency, setFrequency] = React.useState<keyof typeof frequencyLabels>("monthly")
  const [paymentCount, setPaymentCount] = React.useState("12")
  const [paymentAmount, setPaymentAmount] = React.useState("")

  const properties = React.useMemo(() => rentalsQuery.data?.data ?? [], [rentalsQuery.data])
  const spaces = spacesQuery.data?.data ?? []

  React.useEffect(() => {
    setPropertyName("")
    setPropertyAddress("")
    setSelectedSpaceIds([])
    setPropertyId("")
    setContractNumber("")
    setStartsAt("")
    setFirstPaymentDate("")
    setFrequency("monthly")
    setPaymentCount("12")
    setPaymentAmount("")
  }, [caseroId])

  React.useEffect(() => {
    if (!propertyId && properties[0]) setPropertyId(String(properties[0].id))
  }, [properties, propertyId])

  async function submitProperty(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!caseroId || !propertyName.trim()) return
    try {
      await createProperty.mutateAsync({ name: propertyName.trim(), address: propertyAddress.trim() || undefined, space_ids: selectedSpaceIds })
      toast.success("Predio registrado correctamente")
      setPropertyName("")
      setPropertyAddress("")
      setSelectedSpaceIds([])
    } catch (error) {
      toast.error("No se pudo registrar el predio", { description: error instanceof Error ? error.message : "Intenta nuevamente." })
    }
  }

  async function submitContract(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const amount = Number(paymentAmount)
    const count = Number(paymentCount)
    if (!propertyId || !contractNumber.trim() || !startsAt || !firstPaymentDate || !Number.isFinite(amount) || amount <= 0 || !Number.isInteger(count) || count < 1) {
      toast.error("Completa el contrato, importe, fechas y número de pagos válidos.")
      return
    }
    try {
      await createContract.mutateAsync({ ground_property_id: Number(propertyId), contract_number: contractNumber.trim(), starts_at: startsAt, first_payment_date: firstPaymentDate, payment_frequency: frequency, payment_count: count, payment_amount: amount })
      toast.success("Contrato y calendario registrados correctamente")
      setContractNumber("")
      setStartsAt("")
      setFirstPaymentDate("")
      setPaymentAmount("")
    } catch (error) {
      toast.error("No se pudo crear el calendario", { description: error instanceof Error ? error.message : "Intenta nuevamente." })
    }
  }

  async function pay(payment: GroundRentPayment) {
    if (!caseroId) return
    try {
      await markPaid.mutateAsync({ id: payment.id })
      toast.success("Pago marcado como efectuado")
    } catch (error) {
      toast.error("No se pudo actualizar el pago", { description: error instanceof Error ? error.message : "Intenta nuevamente." })
    }
  }

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
      <DialogHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <DialogTitle className="flex items-center gap-2"><Landmark className="h-5 w-5 text-violet-600" />Predios y rentas de piso</DialogTitle>
          <Button type="button" variant="outline" size="sm" disabled={properties.length === 0} onClick={() => downloadReport(casero, properties)}><Download className="mr-2 h-4 w-4" />Generar Excel</Button>
        </div>
        <DialogDescription>Administra los inmuebles de {casero ? [casero.nombre, casero.apellido_paterno, casero.apellido_materno].filter(Boolean).join(" ") : "este casero"}, sus espacios y los pagos que se le realizarán.</DialogDescription>
      </DialogHeader>

      {rentalsQuery.isLoading ? <div className="flex min-h-52 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Cargando información…</div> : <div className="space-y-7">
        {canEdit && <div className="grid gap-5 lg:grid-cols-2">
          <form onSubmit={submitProperty} className="rounded-2xl border border-violet-100 bg-violet-50/40 p-4">
            <div className="mb-4 flex items-center gap-2 font-semibold text-slate-800"><Building2 className="h-4 w-4 text-violet-600" />Nuevo predio</div>
            <div className="space-y-3">
              <div><Label htmlFor="ground-property-name">Nombre o referencia</Label><Input id="ground-property-name" value={propertyName} onChange={(event) => setPropertyName(event.target.value)} placeholder="Casa García / Terreno norte" required /></div>
              <div><Label htmlFor="ground-property-address">Dirección</Label><Input id="ground-property-address" value={propertyAddress} onChange={(event) => setPropertyAddress(event.target.value)} placeholder="Opcional" /></div>
              <div className="space-y-2"><Label>Espacios en este predio</Label>{spaces.length === 0 && !spacesQuery.isLoading ? <p className="rounded-xl border bg-white px-3 py-3 text-sm text-muted-foreground">No hay espacios sin predio asignado.</p> : <SpaceMultiSelect spaces={spaces} selectedIds={selectedSpaceIds} onChange={setSelectedSpaceIds} loading={spacesQuery.isLoading} />}</div>
              <Button type="submit" size="sm" disabled={createProperty.isPending}>{createProperty.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}Agregar predio</Button>
            </div>
          </form>

          <form onSubmit={submitContract} className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
            <div className="mb-4 flex items-center gap-2 font-semibold text-slate-800"><CalendarDays className="h-4 w-4 text-emerald-600" />Nuevo contrato y calendario</div>
            {properties.length === 0 ? <p className="text-sm text-muted-foreground">Registra primero un predio para crear su calendario de pagos.</p> : <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2"><Label htmlFor="ground-property">Predio</Label><select id="ground-property" value={propertyId} onChange={(event) => setPropertyId(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-violet-100 bg-white px-3 text-sm"><option value="">Selecciona un predio</option>{properties.map((property) => <option key={property.id} value={property.id}>{property.name}</option>)}</select></div>
              <div><Label htmlFor="contract-number">No. contrato</Label><Input id="contract-number" value={contractNumber} onChange={(event) => setContractNumber(event.target.value)} placeholder="Ej. CP-2026-001" required /></div>
              <div><Label htmlFor="payment-amount">Importe por pago</Label><Input id="payment-amount" type="number" min="0.01" step="0.01" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} placeholder="$0.00" required /></div>
              <div><Label htmlFor="contract-start">Inicio de vigencia</Label><Input id="contract-start" type="date" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} required /></div>
              <div><Label htmlFor="first-payment">Primer pago</Label><Input id="first-payment" type="date" value={firstPaymentDate} onChange={(event) => setFirstPaymentDate(event.target.value)} required /></div>
              <div><Label htmlFor="frequency">Periodicidad</Label><select id="frequency" value={frequency} onChange={(event) => setFrequency(event.target.value as keyof typeof frequencyLabels)} className="mt-1 h-11 w-full rounded-xl border border-violet-100 bg-white px-3 text-sm">{Object.entries(frequencyLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
              <div><Label htmlFor="payment-count">Número de pagos</Label><Input id="payment-count" type="number" min="1" max="120" value={paymentCount} onChange={(event) => setPaymentCount(event.target.value)} required /></div>
              <Button type="submit" size="sm" className="sm:col-span-2" disabled={createContract.isPending}>{createContract.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ReceiptText className="mr-2 h-4 w-4" />}Generar calendario</Button>
            </div>}
          </form>
        </div>}

        <section className="space-y-3">
          <div className="flex items-center gap-2"><CircleDollarSign className="h-5 w-5 text-violet-600" /><h3 className="font-semibold text-slate-900">Predios registrados</h3></div>
          {properties.length === 0 ? <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">Aún no hay predios registrados para este casero.</div> : properties.map((property) => <article key={property.id} className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="flex flex-col gap-2 border-b bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><div><h4 className="font-semibold text-slate-900">{property.name}</h4>{property.address && <p className="text-sm text-muted-foreground">{property.address}</p>}</div><div className="text-sm text-muted-foreground">{property.spaces.length} espacio{property.spaces.length === 1 ? "" : "s"}</div></div>
            <div className="p-4">{property.spaces.length > 0 && <div className="mb-4 flex flex-wrap gap-2">{property.spaces.map((space) => <span key={space.id} className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">{space.title}</span>)}</div>}
              {property.contracts.length === 0 ? <p className="text-sm text-muted-foreground">Sin contrato o calendario de pagos.</p> : property.contracts.map((contract) => <PaymentSchedule key={contract.id} contract={contract} canEdit={canEdit} paymentIsUpdating={markPaid.isPending} onPay={pay} />)}</div>
          </article>)}
        </section>
      </div>}
    </DialogContent>
  </Dialog>
}
