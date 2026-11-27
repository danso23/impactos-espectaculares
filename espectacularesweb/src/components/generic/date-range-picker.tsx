import * as React from "react"
import { DayPicker, type DateRange } from "react-day-picker"
import { es } from "react-day-picker/locale"
import "react-day-picker/style.css"
import { CalendarRange, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

/** Rango como cadenas YYYY-MM-DD (lo que viaja a la API). */
export type DateRangeValue = { from?: string; to?: string }

type Props = {
  value: DateRangeValue
  onChange: (value: DateRangeValue) => void
  placeholder?: string
  className?: string
  id?: string
}

function toDate(value?: string) {
  if (!value) return undefined
  const [y, m, d] = value.split("-").map(Number)
  return y && m && d ? new Date(y, m - 1, d) : undefined
}

function toIso(date?: Date) {
  if (!date) return undefined
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const shortDate = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric" })

function useIsWide() {
  const query = "(min-width: 640px)"
  const [wide, setWide] = React.useState(() => typeof window !== "undefined" && window.matchMedia(query).matches)
  React.useEffect(() => {
    const media = window.matchMedia(query)
    const update = () => setWide(media.matches)
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])
  return wide
}

/** Selector de rango de fechas: un botón que abre un calendario de dos meses (uno en móvil). */
export function DateRangePicker({ value, onChange, placeholder = "Cualquier fecha", className, id }: Props) {
  const [open, setOpen] = React.useState(false)
  const isWide = useIsWide()
  const from = toDate(value.from)
  const to = toDate(value.to)
  const selected: DateRange | undefined = from || to ? { from, to } : undefined

  const label = from && to
    ? `${shortDate.format(from)} – ${shortDate.format(to)}`
    : from
      ? `Desde ${shortDate.format(from)}`
      : to
        ? `Hasta ${shortDate.format(to)}`
        : placeholder

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start gap-2 rounded-lg border-gray-300 bg-white px-3 font-normal shadow-sm",
            !selected && "text-muted-foreground",
            className
          )}
        >
          <CalendarRange className="h-4 w-4 shrink-0 text-purple-600" />
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-3">
        <DayPicker
          mode="range"
          locale={es}
          numberOfMonths={isWide ? 2 : 1}
          defaultMonth={from ?? to}
          selected={selected}
          onSelect={(range) => onChange({ from: toIso(range?.from), to: toIso(range?.to) })}
          className="text-sm"
          // La hoja de react-day-picker no está en una capa de Tailwind: sus variables se
          // sobrescriben en línea para usar los morados de la app.
          style={{
            "--rdp-accent-color": "#9333ea",
            "--rdp-accent-background-color": "#f3e8ff",
            "--rdp-range_middle-color": "#581c87",
            "--rdp-today-color": "#9333ea",
            "--rdp-day-height": "2.25rem",
            "--rdp-day-width": "2.25rem",
            "--rdp-day_button-height": "2.1rem",
            "--rdp-day_button-width": "2.1rem",
          } as React.CSSProperties}
        />
        <div className="mt-2 flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            disabled={!selected}
            onClick={() => onChange({})}
          >
            <X className="h-4 w-4" />
            Borrar
          </Button>
          <Button type="button" size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={() => setOpen(false)}>
            Listo
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
