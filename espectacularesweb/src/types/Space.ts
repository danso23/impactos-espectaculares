// Para el DataTable cuando se le da click
export type Space = {
  id: number;
  title: string;
  price?: number;
  coords: { lat: number; lng: number };
  status: "Disponible" | "Bloqueado" | "Rentado";
  createdAt: string;

  // nuevos (opcionales)
  assigned_id?: string | null;
  faces?: number;
  has_lights?: boolean;
  viewType?: "Vista natural" | "Vista cruzada" | string;
  type?: string | null;
  width_m?: string;
  height_m?: string;
};

export type SpaceFormValues = {
  faces?: number;
  latitude?: number;
  longitude?: number;
  assigned_id?: string;
  title: string;
  price?: number;
  type?: "Espectacular" | "Muro" | "Parabus";
  width_m?: number;
  height_m?: number;
  description?: string;
  has_lights?: boolean;
  viewType?: "Vista natural" | "Vista cruzada";
  images?: File[];
  comments?: string;
};

export type CreateSpaceInput = {
  title: string;
  description?: string;
  comments?: string;
  latitude?: number;
  longitude?: number;
  price?: number;
  type?: string;
  socioeconomic_level?: string;
  width_m?: number;
  height_m?: number;
  active?: boolean;
};

// PARA DATATABLE
export type SpaceApi = {
  id: number;
  title: string;
  type?: string | null;
  active?: boolean | number | null;
  created_at?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  price?: number | null;

  // nuevos
  assigned_id?: string | null;
  faces?: number | null;
  has_lights?: boolean | number | null;
  view_type?: string | null;
};
