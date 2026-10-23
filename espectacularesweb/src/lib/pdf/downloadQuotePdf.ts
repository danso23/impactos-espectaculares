import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

import agLetterhead from "@/assets/letterheads/ag-espectaculares.jpeg"
import impactosLetterhead from "@/assets/letterheads/impactos.png"
import lookingColorsLetterhead from "@/assets/letterheads/looking-colors.jpeg"

import type {
  QuoteCatalogAgency,
  QuoteCatalogCompany,
  QuoteCatalogLetterhead,
  QuoteCustomer,
  QuoteImage,
  QuoteKind,
  QuotePreviewItem,
  QuoteStatus,
  QuoteTotals,
} from "@/types/Quote"

type QuotePdfData = {
  quote_kind?: QuoteKind | null
  folio?: string | null
  created_at?: string | null
  valid_until?: string | null
  customer?: QuoteCustomer | null
  company?: QuoteCatalogCompany | null
  letterhead?: QuoteCatalogLetterhead | null
  agency?: QuoteCatalogAgency | null
  status?: QuoteStatus | null
  items: QuotePreviewItem[]
  images?: QuoteImage[]
  totals: QuoteTotals
  notes?: string | null
  terms_html?: string | null
  includes_tax: boolean
}

const LETTERHEAD_ASSETS: Record<string, string> = {
  ag_espectaculares: agLetterhead,
  impactos: impactosLetterhead,
  looking_colors: lookingColorsLetterhead,
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("No fue posible cargar la hoja membretada seleccionada."))
    image.src = source
  })
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value || 0)
}

function formatDate(value?: string | null) {
  if (!value) return "—"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
  }).format(date)
}

function stripHtml(value?: string | null) {
  if (!value) return ""

  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
}

function hexToRgb(value?: string | null): [number, number, number] {
  const normalized = value?.trim().replace(/^#/, "")
  if (!normalized || !/^[\da-f]{6}$/i.test(normalized)) return [29, 111, 165]

  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ]
}

function nextBlockY(
  doc: jsPDF,
  currentY: number,
  lines: string[],
  drawLetterhead: () => void,
) {
  const pageHeight = doc.internal.pageSize.getHeight()
  const estimatedHeight = Math.max(12, lines.length * 5 + 8)

  if (currentY + estimatedHeight > pageHeight - 35) {
    doc.addPage()
    drawLetterhead()
    return 36
  }

  return currentY
}

export async function downloadQuotePdf(data: QuotePdfData, filename?: string) {
  const doc = new jsPDF()
  const customerLabel = data.customer?.display_name || "Sin cliente"
  const generatedAt = data.created_at || new Date().toISOString()
  const letterheadSource = data.letterhead?.template_key
    ? LETTERHEAD_ASSETS[data.letterhead.template_key]
    : undefined
  const letterheadImage = letterheadSource ? await loadImage(letterheadSource) : null
  const drawLetterhead = () => {
    if (!letterheadImage) return
    doc.addImage(letterheadImage, 0, 0, 210, 297, undefined, "FAST")
  }

  drawLetterhead()

  const tableData = data.items.map((item) => [
    item.concept || item.description || (item.item_type === "rental" ? "Renta" : "Servicio"),
    item.item_type === "rental" ? "Renta" : "Servicio",
    item.item_type === "service" ? Number(item.square_meters ?? 1).toFixed(2) : "—",
    formatCurrency(item.unit_price),
    formatCurrency(item.subtotal),
    data.includes_tax ? formatCurrency(item.tax_amount) : "—",
    formatCurrency(item.total),
  ])

  autoTable(doc, {
    startY: 70,
    margin: { top: 36, right: 14, bottom: 35, left: 14 },
    head: [["Concepto", "Tipo", "M2", "Precio / m2", "Subtotal", "IVA", "Total"]],
    body: tableData,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: hexToRgb(data.letterhead?.primary_color),
    },
    willDrawPage: ({ pageNumber }) => {
      if (pageNumber > 1) drawLetterhead()

      if (pageNumber !== 1) return

      doc.setFontSize(18)
      doc.text(data.folio ? `Cotización ${data.folio}` : "Cotización", 14, 36)
      doc.setFontSize(10)
      doc.text(`Fecha: ${formatDate(generatedAt)}`, 14, 44)
      doc.text(`Cliente: ${customerLabel}`, 14, 50)
      doc.text(`Empresa: ${data.company?.name || "—"}`, 14, 56)
      doc.text(`Estatus: ${data.status?.name || "Borrador"}`, 110, 44)
      doc.text(`Vigencia: ${formatDate(data.valid_until)}`, 110, 50)
      doc.text(`Tipo: ${data.quote_kind === "advertisement" ? "Anuncio" : "Espacio"}`, 110, 56)

      if (data.agency?.name) doc.text(`Agencia: ${data.agency.name}`, 14, 62)
      if (data.images?.length) doc.text(`Imágenes adjuntas: ${data.images.length}`, 110, 62)
    },
  })

  let y =
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY
      ? ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10)
      : 70

  if (y + 28 > doc.internal.pageSize.getHeight() - 35) {
    doc.addPage()
    drawLetterhead()
    y = 36
  }

  doc.setFontSize(10)
  doc.text(`Subtotal: ${formatCurrency(data.totals.subtotal)}`, 140, y)
  doc.text(`Descuento: ${formatCurrency(data.totals.discount_amount)}`, 140, y + 6)
  doc.text(`IVA: ${formatCurrency(data.totals.tax)}`, 140, y + 12)
  doc.setFontSize(12)
  doc.text(`TOTAL: ${formatCurrency(data.totals.total)}`, 140, y + 22)
  y += 34

  const notes = stripHtml(data.notes)
  if (notes) {
    const noteLines = doc.splitTextToSize(notes, 180)
    y = nextBlockY(doc, y, noteLines, drawLetterhead)
    doc.setFontSize(11)
    doc.text("Notas", 14, y)
    doc.setFontSize(9)
    doc.text(noteLines, 14, y + 6)
    y += noteLines.length * 5 + 12
  }

  const terms = stripHtml(data.terms_html)
  if (terms) {
    const termLines = doc.splitTextToSize(terms, 180)
    y = nextBlockY(doc, y, termLines, drawLetterhead)
    doc.setFontSize(11)
    doc.text("Condiciones", 14, y)
    doc.setFontSize(9)
    doc.text(termLines, 14, y + 6)
  }

  const safeName =
    filename ||
    `${(data.folio || "cotizacion").replace(/[^a-zA-Z0-9-_]+/g, "-").toLowerCase()}.pdf`

  doc.save(safeName)
}
