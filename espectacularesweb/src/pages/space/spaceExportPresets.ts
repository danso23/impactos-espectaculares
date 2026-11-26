import type { ExportPreset, ExportSpec } from "@/components/generic/excel-export-button"
import { excelDate } from "@/lib/exportExcel"
import { spaceTypeLabel } from "@/lib/helpers/spaceTypeHelper"
import type { Space } from "@/types/Space"

const num = (value?: number | string | null) =>
  value === undefined || value === null || value === "" ? "" : Number(value)

const area = (space: Space) =>
  space.width_m && space.height_m ? Math.round(Number(space.width_m) * Number(space.height_m) * 100) / 100 : ""

const mapsLink = (space: Space) =>
  space.latitude != null && space.longitude != null
    ? `https://www.google.com/maps?q=${space.latitude},${space.longitude}`
    : ""

/** Lista de precios: lo necesario para cotizar un anuncio. */
const priceListSpecs: ExportSpec<Space>[] = [
  { label: "ID anuncio", value: (s) => s.assigned_id ?? "" },
  { label: "Nombre", value: (s) => s.title },
  { label: "Tipo", value: (s) => spaceTypeLabel(s.type, s.subtype) },
  { label: "Ancho (m)", value: (s) => num(s.width_m) },
  { label: "Alto (m)", value: (s) => num(s.height_m) },
  { label: "Medida (m²)", value: area },
  { label: "Caras", value: (s) => num(s.faces) },
  { label: "Iluminación", value: (s) => (s.type === "Valla movil" ? "No aplica" : s.has_lights ? "Sí" : "No") },
  { label: "Estatus", value: (s) => s.status },
  { label: "Precio", value: (s) => num(s.price) },
]

/** General: todos los datos del espacio. */
const generalSpecs: ExportSpec<Space>[] = [
  { label: "ID anuncio", value: (s) => s.assigned_id ?? "" },
  { label: "Nombre", value: (s) => s.title },
  { label: "Tipo", value: (s) => (s.type ? spaceTypeLabel(s.type, null) : "") },
  { label: "Subtipo", value: (s) => s.subtype ?? "" },
  { label: "Estatus", value: (s) => s.status },
  { label: "Ancho (m)", value: (s) => num(s.width_m) },
  { label: "Alto (m)", value: (s) => num(s.height_m) },
  { label: "Medida (m²)", value: area },
  { label: "Caras", value: (s) => num(s.faces) },
  { label: "Iluminación", value: (s) => (s.type === "Valla movil" ? "No aplica" : s.has_lights ? "Sí" : "No") },
  { label: "Rotativo", value: (s) => (s.is_rotating ? "Sí" : "No") },
  { label: "Tipo de vista", value: (s) => s.viewType ?? "" },
  { label: "Nivel socioeconómico", value: (s) => s.socioeconomic_level ?? "" },
  { label: "Precio", value: (s) => num(s.price) },
  { label: "Latitud", value: (s) => s.latitude ?? "" },
  { label: "Longitud", value: (s) => s.longitude ?? "" },
  { label: "Mapa", value: mapsLink },
  { label: "Descripción", value: (s) => s.description ?? "" },
  { label: "Comentarios", value: (s) => s.comments ?? "" },
  { label: "Ocupado hasta", value: (s) => excelDate(s.occupied_until) },
  { label: "Bloqueado desde", value: (s) => excelDate(s.blocked_from) },
  { label: "Bloqueado hasta", value: (s) => excelDate(s.blocked_until) },
  { label: "Alta", value: (s) => excelDate(s.createdAt) },
]

export const SPACE_EXPORT_PRESETS: ExportPreset<Space>[] = [
  { key: "price-list", label: "Lista de precios", filenameSuffix: "lista-precios", specs: priceListSpecs },
  { key: "general", label: "General (todos los datos)", filenameSuffix: "general", specs: generalSpecs },
]
