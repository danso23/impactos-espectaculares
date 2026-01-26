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
};