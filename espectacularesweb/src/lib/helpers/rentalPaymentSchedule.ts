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

function addYearsNoOverflow(value: Date, years: number) {
  const targetYear = value.getUTCFullYear() + years
  const month = value.getUTCMonth()
  const lastDay = new Date(Date.UTC(targetYear, month + 1, 0)).getUTCDate()

  return new Date(Date.UTC(targetYear, month, Math.min(value.getUTCDate(), lastDay)))
}

export function calculateRentalEndDate(
  startsAt: string,
  frequency: PaymentFrequency,
  renewalCount: number,
) {
  if (!startsAt) return ""
  const start = parseDate(startsAt)
  if (Number.isNaN(start.getTime())) return ""
  if (frequency === "single") return startsAt

  const count = Math.min(120, Math.max(1, Math.trunc(renewalCount)))
  if (frequency === "weekly") return formatDate(addDays(start, count * 7 - 1))
  if (frequency === "biweekly") return formatDate(addDays(start, count * 14 - 1))
  if (frequency === "annual") return formatDate(addDays(addYearsNoOverflow(start, count), -1))
  return formatDate(addDays(addMonthsNoOverflow(start, count), -1))
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
  firstPaymentDate,
  frequency,
  renewalCount,
  total,
}: {
  startsAt: string
  firstPaymentDate: string
  frequency: PaymentFrequency
  renewalCount: number
  total: number
}): PaymentScheduleRow[] {
  const normalizedRenewalCount = frequency === "single"
    ? 1
    : Math.min(120, Math.max(1, Math.trunc(renewalCount)))
  const endsAt = calculateRentalEndDate(startsAt, frequency, normalizedRenewalCount)
  if (!startsAt || !endsAt || !firstPaymentDate) return []

  const start = parseDate(startsAt)
  const end = parseDate(endsAt)
  const firstDueDate = parseDate(firstPaymentDate)
  if ([start, end, firstDueDate].some((date) => Number.isNaN(date.getTime())) || end < start) return []

  const periods: Omit<PaymentScheduleRow, "amount">[] = []
  let cursor = start
  let index = 0

  while (cursor <= end && periods.length < normalizedRenewalCount) {
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
    } else if (frequency === "annual") {
      periodEnd = addDays(addYearsNoOverflow(start, index + 1), -1)
      dueDate = addYearsNoOverflow(firstDueDate, index)
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
