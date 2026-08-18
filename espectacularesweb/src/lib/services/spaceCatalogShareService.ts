import { env } from "@/config/env";
import { apiFetch } from "@/lib/services/clientService";
import type { SpaceApi } from "@/types/Space";

export type CatalogShareCreated = {
  token: string;
  url: string;
  expires_at: string;
};

export type PublicCatalogShare = {
  spaces: SpaceApi[];
  created_at: string;
  expires_at: string;
};

type ApiEnvelope<T> = {
  message?: string;
  data: T;
};

export class PublicCatalogShareError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "PublicCatalogShareError";
    this.status = status;
  }
}

export async function createCatalogShare(
  spaceIds: number[],
  expiresInHours = 48
) {
  const response = await apiFetch<ApiEnvelope<CatalogShareCreated>>(
    "/api/spaces/catalog-shares",
    {
      method: "POST",
      body: JSON.stringify({
        space_ids: spaceIds,
        expires_in_hours: expiresInHours,
      }),
    }
  );

  return response.data;
}

export async function getPublicCatalogShare(token: string) {
  const apiBase = env.apiUrl?.replace(/\/+$/, "") ?? "";
  const response = await fetch(
    `${apiBase}/api/public/catalog-shares/${encodeURIComponent(token)}`,
    { headers: { Accept: "application/json" } }
  );

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new PublicCatalogShareError(
      typeof body?.message === "string"
        ? body.message
        : "Este enlace no está disponible.",
      response.status
    );
  }

  return (body as ApiEnvelope<PublicCatalogShare>).data;
}
