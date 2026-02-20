export const SPACE_TYPE_MAP = {
  espectacular: "Espectacular",
  muro: "Muro",
  parabus: "Parabus",
  parabús: "Parabus",
} as const

export type SpaceType = (typeof SPACE_TYPE_MAP)[keyof typeof SPACE_TYPE_MAP]

export function asSpaceType(v?: string | null): SpaceType | undefined {
  if (!v) return undefined
  const key = v.trim().toLowerCase() as keyof typeof SPACE_TYPE_MAP
  return SPACE_TYPE_MAP[key]
}