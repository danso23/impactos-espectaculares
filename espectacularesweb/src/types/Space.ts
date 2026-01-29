export type Space = {
  id: number;
  title: string;
  price?: number;
  coords: { lat: number; lng: number };
  status: "Disponible" | "Bloqueado" | "Rentado";
  createdAt: string;
};

export type SpaceFormValues = {
  faces?: number;
  latitude?: number;
  longitude?: number;
  idAsignado?: string;
  title: string;
  price?: number;
  type?: "Espectacular" | "Muro" | "Parabus";
  width?: number;
  height?: number;
  description?: string;
  hasLights?: boolean;
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
};
