// Tipos de espacio vigentes. Muro y Parabús se retiraron (migración 2026_11_24_000005).
export const SPACE_TYPE_MAP = {
  espectacular: "Espectacular",
  pantalla: "Pantalla",
  "valla movil": "Valla movil",
  "valla móvil": "Valla movil",
} as const

export type SpaceType = (typeof SPACE_TYPE_MAP)[keyof typeof SPACE_TYPE_MAP]
export type SpaceSubtype = "Cartelera" | "Unipolar"

export const SPACE_TYPE_OPTIONS: { label: string; value: SpaceType }[] = [
  { label: "Espectacular", value: "Espectacular" },
  { label: "Pantalla", value: "Pantalla" },
  { label: "Valla móvil", value: "Valla movil" },
]

export const SPACE_SUBTYPE_OPTIONS: { label: string; value: SpaceSubtype }[] = [
  { label: "Cartelera", value: "Cartelera" },
  { label: "Unipolar", value: "Unipolar" },
]

export function asSpaceType(v?: string | null): SpaceType | undefined {
  if (!v) return undefined
  const key = v.trim().toLowerCase() as keyof typeof SPACE_TYPE_MAP
  return SPACE_TYPE_MAP[key]
}

export function asSpaceSubtype(v?: string | null): SpaceSubtype | undefined {
  return v === "Cartelera" || v === "Unipolar" ? v : undefined
}

/** "Espectacular · Cartelera", "Valla móvil", etc. */
export function spaceTypeLabel(type?: string | null, subtype?: string | null): string {
  const normalized = asSpaceType(type)
  const label = SPACE_TYPE_OPTIONS.find((option) => option.value === normalized)?.label ?? type ?? ""
  return subtype && normalized === "Espectacular" ? `${label} · ${subtype}` : label
}
