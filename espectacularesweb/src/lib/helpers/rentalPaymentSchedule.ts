import type { PaymentFrequency } from "@/types/Rental"

export type PaymentScheduleRow = {
  number: number
  periodStart: string
  periodEnd: string
  dueDate: string
  amount: number
}

function parseDate(value: string) {
  return new Date(`${value}T00:00:00Z`)
}

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10)
}

function addDays(value: Date, days: number) {
  const result = new Date(value)
  result.setUTCDate(result.getUTCDate() + days)
  return result
}

function addMonthsNoOverflow(value: Date, months: number) {
  const targetMonth = value.getUTCMonth() + months
  const targetYear = value.getUTCFullYear() + Math.floor(targetMonth / 12)
  const normalizedMonth = ((targetMonth % 12) + 12) % 12
  const lastDay = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate()

  return new Date(Date.UTC(
    targetYear,
    normalizedMonth,
    Math.min(value.getUTCDate(), lastDay),
  ))
}

function splitAmount(amount: number, parts: number) {
  const totalCents = Math.round(amount * 100)
  const base = Math.floor(totalCents / parts)
  const remainder = totalCents % parts

  return Array.from({ length: parts }, (_, index) => (
    base + (index < remainder ? 1 : 0)
  ) / 100)
}

export function buildRentalPaymentSchedule({
  startsAt,
  endsAt,
  firstPaymentDate,
  frequency,
  total,
}: {
  startsAt: string
  endsAt: string
  firstPaymentDate: string
  frequency: PaymentFrequency
  total: number
}): PaymentScheduleRow[] {
  if (!startsAt || !endsAt || !firstPaymentDate) return []

  const start = parseDate(startsAt)
  const end = parseDate(endsAt)
  const firstDueDate = parseDate(firstPaymentDate)
  if ([start, end, firstDueDate].some((date) => Number.isNaN(date.getTime())) || end < start) return []

  const periods: Omit<PaymentScheduleRow, "amount">[] = []
  let cursor = start
  let index = 0

  while (cursor <= end && periods.length < 120) {
    let periodEnd: Date
    let dueDate: Date

    if (frequency === "single") {
      periodEnd = end
      dueDate = firstDueDate
    } else if (frequency === "weekly") {
      periodEnd = addDays(cursor, 6)
      dueDate = addDays(firstDueDate, index * 7)
    } else if (frequency === "biweekly") {
      periodEnd = addDays(cursor, 13)
      dueDate = addDays(firstDueDate, index * 14)
    } else {
      periodEnd = addDays(addMonthsNoOverflow(start, index + 1), -1)
      dueDate = addMonthsNoOverflow(firstDueDate, index)
    }

    if (periodEnd > end) periodEnd = end

    periods.push({
      number: index + 1,
      periodStart: formatDate(cursor),
      periodEnd: formatDate(periodEnd),
      dueDate: formatDate(dueDate),
    })

    if (frequency === "single") break
    cursor = addDays(periodEnd, 1)
    index++
  }

  const amounts = splitAmount(total, periods.length)
  return periods.map((period, rowIndex) => ({ ...period, amount: amounts[rowIndex] }))
}
