import jsPDF, { GState } from "jspdf"
import autoTable from "jspdf-autotable"

import type { PaymentEntry, ReceivableRecord } from "@/types/Payment"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value)
}

function formatDate(value?: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "long", timeZone: "UTC" })
    .format(new Date(`${value.slice(0, 10)}T00:00:00Z`))
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("No fue posible cargar el logotipo."))
    image.src = source
  })
}

const UNITS = ["", "UNO", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"]
const TEENS = ["DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISÉIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE"]
const TENS = ["", "", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"]
const HUNDREDS = ["", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"]

function underThousand(value: number): string {
  if (value === 0) return ""
  if (value === 100) return "CIEN"
  const hundreds = Math.floor(value / 100)
  const rest = value % 100
  const parts = hundreds ? [HUNDREDS[hundreds]] : []
  if (rest < 10) parts.push(UNITS[rest])
  else if (rest < 20) parts.push(TEENS[rest - 10])
  else if (rest < 30) parts.push(rest === 20 ? "VEINTE" : `VEINTI${UNITS[rest - 20].toLowerCase()}`.toUpperCase())
  else parts.push(rest % 10 ? `${TENS[Math.floor(rest / 10)]} Y ${UNITS[rest % 10]}` : TENS[Math.floor(rest / 10)])
  return parts.filter(Boolean).join(" ")
}

function amountInWords(value: number): string {
  const normalized = Math.max(0, Math.round(value * 100))
  const whole = Math.floor(normalized / 100)
  const cents = String(normalized % 100).padStart(2, "0")
  if (whole === 0) return `CERO PESOS ${cents}/100 M.N.`

  const millions = Math.floor(whole / 1_000_000)
  const thousands = Math.floor((whole % 1_000_000) / 1_000)
  const units = whole % 1_000
  const parts: string[] = []
  if (millions) parts.push(`${millions === 1 ? "UN MILLÓN" : `${underThousand(millions)} MILLONES`}`)
  if (thousands) parts.push(thousands === 1 ? "MIL" : `${underThousand(thousands)} MIL`)
  if (units) parts.push(underThousand(units))
  return `${parts.join(" ")} PESOS ${cents}/100 M.N.`
}

export async function downloadRemissionNotePdf(receivable: ReceivableRecord, payment: PaymentEntry) {
  const doc = new jsPDF()
  const noteNumber = `NR-${String(payment.id).padStart(6, "0")}`
  const description = `Pago de renta #${receivable.rental_id} · periodo ${formatDate(receivable.period_start)} al ${formatDate(receivable.period_end)}`
  let logo: HTMLImageElement | null = null

  try {
    logo = await loadImage("/img/logo.png")
    doc.addImage(logo, "PNG", 14, 8, 36, 36, undefined, "FAST")
  } catch {
    doc.setFontSize(18)
    doc.text("IMPACTOS ESPECTACULARES", 14, 22)
  }

  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text("RFC: IES-070917-LB6", 76, 16)
  doc.setFont("helvetica", "normal")
  doc.text("Régimen General de Ley Personas Morales", 76, 23)
  doc.text("Calle 21-A No.301x20. Fracc. Privada Álamos.", 76, 30)
  doc.text("C.P. 97138. Mérida, Yucatán, México.", 76, 37)

  doc.setFillColor(35, 58, 58)
  doc.roundedRect(151, 8, 45, 28, 2, 2, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.text("REMISIÓN No.", 155, 16)
  doc.setFontSize(12)
  doc.text(noteNumber, 155, 25)
  doc.setFontSize(8)
  doc.text(formatDate(payment.paid_at), 155, 32)
  doc.setTextColor(20, 30, 35)

  doc.setFontSize(20)
  doc.text("NOTA DE REMISIÓN", 14, 67)

  doc.setDrawColor(180, 185, 190)
  doc.roundedRect(14, 74, 182, 37, 2, 2, "S")
  doc.setFontSize(9)
  doc.setTextColor(90, 95, 100)
  doc.text("CLIENTE", 18, 82)
  doc.setTextColor(20, 30, 35)
  doc.setFontSize(12)
  doc.text(receivable.customer_name || "Cliente no identificado", 18, 90)
  doc.setFontSize(9)
  doc.text(`Tipo: ${receivable.customer_type || "—"}`, 18, 99)
  doc.text(`Renta: #${receivable.rental_id} · Cargo: #${receivable.id}`, 100, 99)
  doc.text(`Referencia: ${payment.reference || "—"}`, 18, 106)

  if (logo) {
    doc.setGState(new GState({ opacity: 0.08 }))
    doc.addImage(logo, "PNG", 69, 142, 72, 72, undefined, "FAST")
    doc.setGState(new GState({ opacity: 1 }))
  }

  autoTable(doc, {
    startY: 119,
    head: [["CANTIDAD", "U. MEDIDA", "DESCRIPCIÓN", "P. UNITARIO", "IMPORTE"]],
    body: [["1", "Servicio", description, formatCurrency(payment.amount), formatCurrency(payment.amount)]],
    margin: { left: 14, right: 14 },
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [35, 58, 58] },
    columnStyles: { 0: { cellWidth: 20 }, 1: { cellWidth: 25 }, 2: { cellWidth: 77 }, 3: { cellWidth: 30 }, 4: { cellWidth: 30 } },
  })

  const y = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 125) + 14
  doc.setFontSize(9)
  doc.setTextColor(90, 95, 100)
  doc.text("CANTIDAD EN LETRAS", 14, y)
  doc.setTextColor(20, 30, 35)
  const words = doc.splitTextToSize(amountInWords(payment.amount), 118)
  doc.text(words, 14, y + 7)
  doc.setFontSize(10)
  doc.text(`FORMA DE PAGO: ${payment.method}`, 14, y + 24)
  doc.setFontSize(12)
  doc.text(`TOTAL: ${formatCurrency(payment.amount)}`, 143, y + 18)

  doc.setDrawColor(100, 105, 110)
  doc.line(65, y + 58, 145, y + 58)
  doc.setFontSize(9)
  doc.text("FIRMA DE CONFORMIDAD", 84, y + 64)
  doc.setTextColor(90, 95, 100)
  doc.text(payment.requires_invoice ? "Factura solicitada por el cliente." : "No requiere factura.", 14, y + 78)
  doc.setTextColor(20, 30, 35)
  doc.setFontSize(8)
  doc.text("Impactos Espectaculares · Mérida, Yucatán, México", 14, 285)

  doc.save(`${noteNumber.toLowerCase()}.pdf`)
}
