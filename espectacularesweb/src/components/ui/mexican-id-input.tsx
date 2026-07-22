import * as React from "react"

import { Input } from "@/components/ui/input"
import { CURP_REGEX, RFC_REGEX } from "@/lib/helpers/mexicanId"

type MexicanIdInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "value" | "defaultValue" | "onChange" | "maxLength" | "pattern"
> & {
  value?: string | null
  onValueChange: (value: string) => void
}

function normalize(value: string, allowedCharacters: RegExp, maxLength: number) {
  return value
    .toUpperCase()
    .split("")
    .filter((character) => allowedCharacters.test(character))
    .join("")
    .slice(0, maxLength)
}

export const RfcInput = React.forwardRef<HTMLInputElement, MexicanIdInputProps>(
  ({ onValueChange, placeholder = "RFC o XXXXXXXXXXXXX", value, ...props }, ref) => (
    <Input
      ref={ref}
      value={value ?? ""}
      maxLength={13}
      pattern={RFC_REGEX.source}
      autoCapitalize="characters"
      spellCheck={false}
      placeholder={placeholder}
      title="Captura un RFC válido de 12 o 13 caracteres, o rellena todos los caracteres con X."
      onChange={(event) =>
        onValueChange(normalize(event.target.value, /[A-Z0-9Ñ&]/, 13))
      }
      {...props}
    />
  )
)

RfcInput.displayName = "RfcInput"

export const CurpInput = React.forwardRef<HTMLInputElement, MexicanIdInputProps>(
  ({ onValueChange, placeholder = "CURP o XXXXXXXXXXXXXXXXXX", value, ...props }, ref) => (
    <Input
      ref={ref}
      value={value ?? ""}
      maxLength={18}
      pattern={CURP_REGEX.source}
      autoCapitalize="characters"
      spellCheck={false}
      placeholder={placeholder}
      title="Captura una CURP válida de 18 caracteres, o rellena todos los caracteres con X."
      onChange={(event) =>
        onValueChange(normalize(event.target.value, /[A-Z0-9]/, 18))
      }
      {...props}
    />
  )
)

CurpInput.displayName = "CurpInput"
