import type { QuoteRecord, QuoteStatus } from "@/types/Quote"

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  draft: ["sent", "cancelled"],
  sent: ["draft", "accepted", "rejected", "expired", "cancelled"],
  expired: ["sent", "cancelled"],
  // Aceptada → rechazada (el cliente no la aceptó así) o cancelada (el servicio no se hizo).
  accepted: ["rejected", "cancelled"],
  rejected: [],
  cancelled: [],
}

export const QUOTE_STATUS_HINTS: Record<string, string> = {
  rejected: "El cliente no aceptó la cotización en esos términos.",
  cancelled: "El servicio no se realizó (o la cotización fue reemplazada por otra).",
}

function isConvertedToRental(quote: QuoteRecord) {
  return Boolean(quote.converted_to_rental_at || quote.rental)
}

export function getAllowedQuoteStatusKeys(statusKey?: string | null) {
  if (!statusKey) return []
  return ALLOWED_TRANSITIONS[statusKey] ?? []
}

export function canChangeQuoteStatus(quote: QuoteRecord) {
  if (isConvertedToRental(quote)) return false
  return getAllowedQuoteStatusKeys(quote.status?.key).length > 0
}

export function canDuplicateQuote(quote: QuoteRecord) {
  return !isConvertedToRental(quote)
}

/** Solo Borrador o Enviada, y sin renta generada. */
export function canEditQuote(quote: QuoteRecord) {
  return ["draft", "sent"].includes(quote.status?.key ?? "") && !isConvertedToRental(quote)
}

// Solo un borrador se puede eliminar: nunca se envió al cliente ni tiene renta.
export function canDeleteQuote(quote: QuoteRecord) {
  return quote.status?.key === "draft" && !isConvertedToRental(quote)
}

export function canConvertQuoteToRental(quote: QuoteRecord) {
  return (
    quote.status?.key === "accepted" &&
    !quote.converted_to_rental_at &&
    !quote.rental
  )
}

export function toneClass(status?: QuoteStatus | null) {
  switch (status?.color) {
    case "green":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
    case "blue":
      return "border-sky-200 bg-sky-50 text-sky-700"
    case "purple":
      return "border-violet-200 bg-violet-50 text-violet-700"
    case "red":
      return "border-rose-200 bg-rose-50 text-rose-700"
    case "orange":
      return "border-amber-200 bg-amber-50 text-amber-700"
    default:
      return "border-slate-200 bg-slate-50 text-slate-700"
  }
}
