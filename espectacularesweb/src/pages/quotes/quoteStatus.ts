import type { QuoteRecord, QuoteStatus } from "@/types/Quote"

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  draft: ["sent", "cancelled"],
  sent: ["draft", "accepted", "rejected", "expired", "cancelled"],
  expired: ["sent", "cancelled"],
  accepted: [],
  rejected: [],
  cancelled: [],
}

export function getAllowedQuoteStatusKeys(statusKey?: string | null) {
  if (!statusKey) return []
  return ALLOWED_TRANSITIONS[statusKey] ?? []
}

export function canChangeQuoteStatus(quote: QuoteRecord) {
  return getAllowedQuoteStatusKeys(quote.status?.key).length > 0
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
