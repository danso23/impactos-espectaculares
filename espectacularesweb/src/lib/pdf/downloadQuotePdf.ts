import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

import type {
  QuoteCatalogAgency,
  QuoteCatalogCompany,
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
  agency?: QuoteCatalogAgency | null
  status?: QuoteStatus | null
  items: QuotePreviewItem[]
  images?: QuoteImage[]
  totals: QuoteTotals
  notes?: string | null
  terms_html?: string | null
  includes_tax: boolean
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

function nextBlockY(doc: jsPDF, currentY: number, lines: string[]) {
  const pageHeight = doc.internal.pageSize.getHeight()
  const estimatedHeight = Math.max(12, lines.length * 5 + 8)

  if (currentY + estimatedHeight > pageHeight - 18) {
    doc.addPage()
    return 20
  }

  return currentY
}

export function downloadQuotePdf(data: QuotePdfData, filename?: string) {
  const doc = new jsPDF()
  const customerLabel = data.customer?.display_name || "Sin cliente"
  const generatedAt = data.created_at || new Date().toISOString()

  doc.setFontSize(18)
  doc.text(data.folio ? `Cotización ${data.folio}` : "Cotización", 14, 18)

  doc.setFontSize(10)
  doc.text(`Fecha: ${formatDate(generatedAt)}`, 14, 26)
  doc.text(`Cliente: ${customerLabel}`, 14, 32)
  doc.text(`Empresa: ${data.company?.name || "—"}`, 14, 38)
  doc.text(`Estatus: ${data.status?.name || "Borrador"}`, 14, 44)
  doc.text(`Vigencia: ${formatDate(data.valid_until)}`, 14, 50)
  doc.text(`Tipo: ${data.quote_kind === "advertisement" ? "Anuncio" : "Espacio"}`, 110, 26)
  if (data.images?.length) {
    doc.text(`Imágenes adjuntas: ${data.images.length}`, 14, 56)
  }

  if (data.agency?.name) {
    doc.text(`Agencia: ${data.agency.name}`, 110, 32)
  }

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
    startY: data.images?.length ? 64 : 58,
    head: [["Concepto", "Tipo", "M2", "Precio / m2", "Subtotal", "IVA", "Total"]],
    body: tableData,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [29, 111, 165],
    },
  })

  let y =
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY
      ? ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10)
      : 70

  doc.setFontSize(10)
  doc.text(`Subtotal: ${formatCurrency(data.totals.subtotal)}`, 140, y)
  doc.text(`Descuento: ${formatCurrency(data.totals.discount_amount)}`, 140, y + 6)
  doc.text(`IVA: ${formatCurrency(data.totals.tax)}`, 140, y + 12)
  doc.text(`Comisión: ${formatCurrency(data.totals.commission_amount)}`, 140, y + 18)
  doc.setFontSize(12)
  doc.text(`TOTAL: ${formatCurrency(data.totals.total)}`, 140, y + 28)
  y += 40

  const notes = stripHtml(data.notes)
  if (notes) {
    const noteLines = doc.splitTextToSize(notes, 180)
    y = nextBlockY(doc, y, noteLines)
    doc.setFontSize(11)
    doc.text("Notas", 14, y)
    doc.setFontSize(9)
    doc.text(noteLines, 14, y + 6)
    y += noteLines.length * 5 + 12
  }

  const terms = stripHtml(data.terms_html)
  if (terms) {
    const termLines = doc.splitTextToSize(terms, 180)
    y = nextBlockY(doc, y, termLines)
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
