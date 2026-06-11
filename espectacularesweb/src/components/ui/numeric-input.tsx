import * as React from "react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type NumericInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "type" | "value" | "defaultValue" | "onChange" | "onFocus" | "onBlur"
> & {
  value?: number | string | null
  onValueChange: (value: number) => void
  onFocus?: React.FocusEventHandler<HTMLInputElement>
  onBlur?: React.FocusEventHandler<HTMLInputElement>
}

function formatNumericValue(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return ""

  const parsed = Number(value)
  return Number.isFinite(parsed) ? String(parsed) : ""
}

function normalizeNumericString(value: string) {
  if (value === "") return ""
  if (value === ".") return "0."

  const cleaned = value.replace(/[^\d.]/g, "")
  if (cleaned === "") return ""

  const [integerPart = "", ...decimalParts] = cleaned.split(".")
  const integerNormalized = integerPart.replace(/^0+(?=\d)/, "") || (integerPart.length > 0 ? "0" : "")

  if (decimalParts.length === 0) {
    return integerNormalized
  }

  const decimalPart = decimalParts.join("")
  return `${integerNormalized || "0"}.${decimalPart}`
}

function parseNumericValue(value: string) {
  if (value === "" || value === "." || value === "0.") return 0

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function NumericInput({
  value,
  onValueChange,
  onFocus,
  onBlur,
  className,
  ...props
}: NumericInputProps) {
  const [displayValue, setDisplayValue] = React.useState(() => formatNumericValue(value))
  const isFocused = React.useRef(false)

  React.useEffect(() => {
    if (!isFocused.current) {
      setDisplayValue(formatNumericValue(value))
    }
  }, [value])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const normalized = normalizeNumericString(event.target.value)
    setDisplayValue(normalized)
    onValueChange(parseNumericValue(normalized))
  }

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    isFocused.current = true
    onFocus?.(event)
  }

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    isFocused.current = false
    if (displayValue === "") {
      setDisplayValue(formatNumericValue(value))
    }
    onBlur?.(event)
  }

  return (
    <Input
      {...props}
      type="text"
      inputMode="decimal"
      className={cn(className)}
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  )
}
