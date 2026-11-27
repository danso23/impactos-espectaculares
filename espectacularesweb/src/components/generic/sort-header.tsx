import { ArrowDown, ArrowUp } from "lucide-react"

import { Button } from "@/components/ui/button"

export type SortDirection = "asc" | "desc"

/** Encabezado de columna que alterna el orden ascendente/descendente (ordenado en el servidor). */
export function SortHeader({
  label,
  direction,
  onToggle,
}: {
  label: string
  direction: SortDirection
  onToggle: () => void
}) {
  const Icon = direction === "asc" ? ArrowUp : ArrowDown

  return (
    <Button
      type="button"
      variant="ghost"
      className="-ml-3 gap-1.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-white/15 hover:text-white"
      onClick={onToggle}
      title={direction === "asc" ? "Orden ascendente: clic para invertir" : "Orden descendente: clic para invertir"}
      aria-label={`${label}: ${direction === "asc" ? "orden ascendente" : "orden descendente"}`}
    >
      {label}
      <Icon className="h-3.5 w-3.5" />
    </Button>
  )
}
