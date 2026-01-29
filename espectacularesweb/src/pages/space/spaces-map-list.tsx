import type { Space } from "@/types/Space"

export function SpacesList({
  spaces,
  selectedId,
  onSelect,
}: {
  spaces: Space[]
  selectedId: number | null
  onSelect: (id: number) => void
}) {
  return (
    <div className="h-[560px] overflow-auto rounded-md border">
      {spaces.map((s) => {
        const active = s.id === selectedId
        return (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={[
              "w-full text-left px-3 py-3 border-b",
              active ? "bg-green-50 border-l-4 border-l-green-600" : "hover:bg-muted",
            ].join(" ")}
          >
            <div className="font-medium">{s.title}</div>
            <div className="text-sm opacity-70">
              {s.price ? `$${s.price.toLocaleString()} MXN` : ""} • {s.coords.lat.toFixed(5)}, {s.coords.lng.toFixed(5)}
            </div>
          </button>
        )
      })}
    </div>
  )
}