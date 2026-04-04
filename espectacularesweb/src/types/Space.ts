// Para el DataTable cuando se le da click
export type Space = {
  id: number;
  title: string;
  price?: number;
  coords: { lat: number; lng: number };
  status: "Disponible" | "Bloqueado" | "Rentado";
  createdAt: string;
  socioeconomic_level?: string | null;
  // nuevos (opcionales)
  assigned_id?: string | null;
  faces?: number;
  has_lights?: boolean;
  viewType?: "Vista natural" | "Vista cruzada" | string;
  type?: string | null;
  width_m?: number;
  height_m?: number;
  description?: string | null;
  comments?: string | null;
  active?: boolean | null;
  latitude?: number | null;
  longitude?: number | null;
  images?: SpaceImageApi[];
  coverImageUrl?: string | null;
};

export type SpaceImageApi = {
  id: number;
  filename?: string | null;
  path: string;
  is_cover?: boolean;
  position?: number;
  order_index?: number;
  created_at?: string | null;
  updated_at?: string | null;
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
  socioeconomic_level?: string;
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
  viewType?: "Vista natural" | "Vista cruzada";
  width_m?: number;
  height_m?: number;
  active?: boolean;
  images?: File[];
};

// PARA DATATABLE
export type SpaceApi = {
  id: number;
  title: string;

  type?: string | null;
  price?: number | string | null;

  active?: boolean | number | string | null;
  created_at?: string | null;

  latitude?: number | string | null;
  longitude?: number | string | null;

  assigned_id?: string | null;
  faces?: number | string | null;
  has_lights?: boolean | number | string | null;
  view_type?: string | null;

  socioeconomic_level?: string | null;
  width_m?: number | string | null;
  height_m?: number | string | null;
  description?: string | null;
  comments?: string | null;
  images?: SpaceImageApi[];
};

export type SpaceFormPayload = SpaceFormValues & { images: File[] };
