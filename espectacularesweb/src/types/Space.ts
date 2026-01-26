export type Space = {
  id: number
  title: string
  price?: number
  coords: { lat: number; lng: number }
  status: "Disponible" | "Bloqueado" | "Rentado"
}

export type SpaceFormValues = {
    title: string
    description?: string
    comments?: string
    latitude?: number
    longitude?: number
    images ?: File[]
}


export type CreateSpaceInput = {
  title: string
  description?: string
  comments?: string
  latitude?: number
  longitude?: number
  price?: number
  type?: string
  socioeconomic_level?: string
  width_m?: number
  height_m?: number
  active?: boolean
}