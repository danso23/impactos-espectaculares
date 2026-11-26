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
  if (isAvailable(space)) return null;
  // Se libera al día siguiente del fin de la renta o del bloqueo (lo más tarde).
  const candidates = [space.blocked_until, space.occupied_until]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.slice(0, 10))
    .sort();
  const until = candidates.at(-1);
  if (!until) return null;

  const date = new Date(`${until}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;

  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function hasLights(value: CatalogSpaceLike["has_lights"]) {
  return value === true || value === 1 || value === "1" || value === "true";
}

export function isOccupied(space: CatalogSpaceLike) {
  return Boolean(space.occupied_until);
}

export function isAvailable(space: CatalogSpaceLike) {
  if (isOccupied(space)) return false;
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

const assignedIdCollator = new Intl.Collator("es", { numeric: true, sensitivity: "base" });

/** Orden natural por ID asignado (2, 10, 233, AN-001…); sin ID al final. */
export function sortByAssignedId<T extends { assigned_id?: string | number | null; id?: number }>(spaces: T[]): T[] {
  return [...spaces].sort((a, b) => {
    const left = a.assigned_id != null ? String(a.assigned_id).trim() : "";
    const right = b.assigned_id != null ? String(b.assigned_id).trim() : "";
    if (!left || !right) return left ? -1 : right ? 1 : (a.id ?? 0) - (b.id ?? 0);
    return assignedIdCollator.compare(left, right) || (a.id ?? 0) - (b.id ?? 0);
  });
}
