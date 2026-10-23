import { env } from "@/config/env";
import type { Space, SpaceApi, SpaceImageApi } from "@/types/Space";

export type CatalogSpaceLike = Space | SpaceApi;

function getStorageBaseUrl() {
  const apiUrl = env.apiUrl?.replace(/\/+$/, "") ?? "";
  return apiUrl ? `${apiUrl}/storage` : `${window.location.origin}/storage`;
}

export function resolveSpaceImageUrl(path?: string | null) {
  if (!path) return null;
  if (/^(https?:\/\/|data:)/i.test(path)) return path;

  return `${getStorageBaseUrl()}/${path.replace(/^\/+/, "")}`;
}

export function resolveCatalogImageUrl(
  spaceId: number,
  image: Pick<SpaceImageApi, "id" | "path">
) {
  const apiUrl = env.apiUrl?.replace(/\/+$/, "") ?? "";
  if (apiUrl && image.id) return `${apiUrl}/api/spaces/${spaceId}/images/${image.id}`;
  return resolveSpaceImageUrl(image.path);
}

export function getGoogleMapsUrl(space: CatalogSpaceLike) {
  const latitude = space.latitude ?? ("coords" in space ? space.coords?.lat : undefined);
  const longitude = space.longitude ?? ("coords" in space ? space.coords?.lng : undefined);
  return `https://www.google.com/maps/search/?api=1&query=${latitude ?? 0},${longitude ?? 0}`;
}

export function displayValue(value: unknown, fallback = "—") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

export function formatCatalogPrice(value: unknown, fallback = "Por consultar") {
  const amount = typeof value === "number" ? value : Number(value);
  if (value === null || value === undefined || value === "" || !Number.isFinite(amount)) {
    return fallback;
  }

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatCatalogDate(value: unknown, fallback = "Disponibilidad inmediata") {
  if (typeof value !== "string" || !value.trim()) return fallback;

  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function getAvailabilityDate(space: CatalogSpaceLike) {
  if (isAvailable(space) || !space.blocked_until) return null;

  const date = new Date(`${space.blocked_until.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;

  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function hasLights(value: CatalogSpaceLike["has_lights"]) {
  return value === true || value === 1 || value === "1" || value === "true";
}

export function isAvailable(space: CatalogSpaceLike) {
  if (space.is_blocked_now !== null && space.is_blocked_now !== undefined) {
    const blocked =
      space.is_blocked_now === true ||
      space.is_blocked_now === 1 ||
      space.is_blocked_now === "1" ||
      space.is_blocked_now === "true";
    return !blocked;
  }

  if ("active" in space && space.active !== null && space.active !== undefined) {
    return space.active === true || space.active === 1 || space.active === "1" || space.active === "true";
  }

  return "status" in space && space.status === "Disponible";
}

export function getViewType(space: CatalogSpaceLike) {
  if ("view_type" in space && space.view_type) return space.view_type;
  if ("viewType" in space) return space.viewType;
  return null;
}
