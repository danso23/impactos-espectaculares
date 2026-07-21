import * as React from "react"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

type PhoneInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "type" | "inputMode" | "value" | "defaultValue" | "onChange"
> & {
  value?: string | number | null
  onValueChange: (value: string) => void
}

const PHONE_PREFIXES = [
  { value: "+52", label: "MX +52" },
  { value: "+1", label: "US/CA +1" },
  { value: "+501", label: "BZ +501" },
  { value: "+502", label: "GT +502" },
  { value: "+53", label: "CU +53" },
  { value: "+34", label: "ES +34" },
] as const

const DEFAULT_PREFIX = "+52"

function getStoredPrefix(value: string) {
  return PHONE_PREFIXES
    .map((option) => option.value)
    .sort((a, b) => b.length - a.length)
    .find((prefix) => value.startsWith(prefix))
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, autoComplete, disabled, maxLength = 10, onValueChange, value, ...props }, ref) => {
    const storedValue = value == null ? "" : String(value)
    const storedPrefix = getStoredPrefix(storedValue)
    const prefix = storedPrefix ?? DEFAULT_PREFIX
    const localValue = storedPrefix ? storedValue.slice(storedPrefix.length) : storedValue

    const updateValue = (nextPrefix: string, nextLocalValue: string) => {
      onValueChange(nextLocalValue ? `${nextPrefix}${nextLocalValue}` : "")
    }

    return (
      <div className="flex gap-2">
        <Select
          value={prefix}
          disabled={disabled}
          onValueChange={(nextPrefix) => updateValue(nextPrefix, localValue)}
        >
          <SelectTrigger className="w-[108px] shrink-0" aria-label="Prefijo telefónico">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PHONE_PREFIXES.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          ref={ref}
          className={cn("min-w-0 flex-1", className)}
          type="tel"
          inputMode="tel"
          autoComplete={autoComplete ?? "tel-national"}
          disabled={disabled}
          maxLength={maxLength}
          value={localValue}
          onChange={(event) => updateValue(prefix, event.target.value)}
          {...props}
        />
      </div>
    )
  }
)

PhoneInput.displayName = "PhoneInput"

export { PhoneInput }
