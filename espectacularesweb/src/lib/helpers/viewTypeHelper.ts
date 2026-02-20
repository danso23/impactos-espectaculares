const VIEW_TYPE_MAP = {
  "vista natural": "Vista natural",
  "vista cruzada": "Vista cruzada",
} as const

export type ViewType = (typeof VIEW_TYPE_MAP)[keyof typeof VIEW_TYPE_MAP]

export function asViewType(v?: string | null): ViewType | undefined {
  if (!v) return undefined
  const key = v.trim().toLowerCase() as keyof typeof VIEW_TYPE_MAP
  return VIEW_TYPE_MAP[key]
}