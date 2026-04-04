import * as React from "react"
import type { Space } from "@/types/Space"
import { SpacesList } from "./spaces-map-list"
import { SpacesMap } from "./spaces-map"

export function SpacesMapWithList({ spaces }: { spaces: Space[] }) {
  const [selectedId, setSelectedId] = React.useState<number | null>(null)

  const selected = React.useMemo(
    () => spaces.find((s) => s.id === selectedId) ?? null,
    [spaces, selectedId]
  )

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-[360px_1fr]">
      <SpacesList
        spaces={spaces}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      <SpacesMap
        spaces={spaces}
        selected={selected}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
    </div>
  )
}