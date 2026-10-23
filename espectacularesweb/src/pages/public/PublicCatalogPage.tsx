import * as React from "react";
import { ExternalLink, ImageOff, LoaderCircle, MapPin, ShieldCheck } from "lucide-react";
import { useParams } from "react-router-dom";

import {
  displayValue,
  formatCatalogDate,
  formatCatalogPrice,
  getGoogleMapsUrl,
  getAvailabilityDate,
  getViewType,
  hasLights,
  isAvailable,
  resolveCatalogImageUrl,
} from "@/lib/catalog/catalogHelpers";
import {
  getPublicCatalogShare,
  PublicCatalogShareError,
  type PublicCatalogShare,
} from "@/lib/services/spaceCatalogShareService";
import type { SpaceApi } from "@/types/Space";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function PublicSpaceCard({ space }: { space: SpaceApi }) {
  const images = (space.images ?? [])
    .slice(0, 4)
    .map((image) => resolveCatalogImageUrl(space.id, image))
    .filter((value): value is string => Boolean(value));
  const mainImage = images[0];
  const secondaryImages = images.slice(1, 4);
  const googleMapsUrl = getGoogleMapsUrl(space);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(googleMapsUrl)}`;
  const blockedUntil = formatCatalogDate(space.blocked_until, "Por confirmar");

  return (
    <article className="overflow-hidden rounded-[28px] border border-violet-100 bg-white shadow-xl shadow-violet-950/10">
      <div className="relative h-72 bg-slate-100 sm:h-[430px]">
        {mainImage ? (
          <img src={mainImage} alt={space.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">
            <ImageOff className="h-12 w-12" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent px-6 pb-6 pt-24 text-white sm:px-8">
          <div className="mb-3 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide">
            <span className="rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">
              {displayValue(space.type, "Espacio publicitario")}
            </span>
            <span className={`rounded-full px-3 py-1.5 ${isAvailable(space) ? "bg-emerald-500" : "bg-amber-500"}`}>
              {isAvailable(space)
                ? "Disponible"
                : space.blocked_until
                  ? `Bloqueado hasta ${blockedUntil}`
                  : "Consultar disponibilidad"}
            </span>
          </div>
          <h2 className="text-3xl font-extrabold sm:text-4xl">{displayValue(space.title, "Espacio sin título")}</h2>
          {space.assigned_id ? <p className="mt-2 text-sm text-white/75">ID {space.assigned_id}</p> : null}
        </div>
      </div>

      <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_290px]">
        <div className="space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">Ficha técnica</p>
            <p className="mt-3 leading-relaxed text-slate-600">
              {displayValue(space.description, "Descripción no disponible.")}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              ["Dimensiones", `${displayValue(space.width_m)} × ${displayValue(space.height_m)} m`],
              ["Caras", displayValue(space.faces)],
              ["Tipo", displayValue(space.type)],
              ["Tipo de vista", displayValue(getViewType(space))],
              ["Nivel", displayValue(space.socioeconomic_level)],
              ["Iluminación", hasLights(space.has_lights) ? "Sí" : "No"],
              ["Precio", formatCatalogPrice(space.price)],
              [
                "Fecha disponible",
                formatCatalogDate(
                  getAvailabilityDate(space),
                  isAvailable(space) ? "Disponibilidad inmediata" : "Por confirmar"
                ),
              ],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-violet-50/70 p-4">
                <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</dt>
                <dd className="mt-1 font-semibold text-slate-900">{value}</dd>
              </div>
            ))}
          </dl>

          {secondaryImages.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {secondaryImages.map((image, index) => (
                <img
                  key={image}
                  src={image}
                  alt={`${space.title}, imagen ${index + 2}`}
                  className={`h-72 w-full rounded-2xl object-cover sm:h-80 ${
                    secondaryImages.length === 1 ||
                    (secondaryImages.length === 3 && index === 0)
                      ? "sm:col-span-2 sm:h-[420px]"
                      : ""
                  }`}
                />
              ))}
            </div>
          ) : null}
        </div>

        <aside className="flex flex-col justify-between rounded-3xl bg-gradient-to-br from-violet-700 to-indigo-700 p-6 text-white">
          <div>
            <MapPin className="h-8 w-8" />
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-violet-200">Ubicación</p>
            <h3 className="mt-2 text-2xl font-bold">Mérida, Yucatán</h3>
            <p className="mt-3 text-sm text-violet-100">
              {displayValue(space.latitude)}, {displayValue(space.longitude)}
            </p>
            <div className="mt-8 flex items-center gap-4 rounded-2xl bg-white/10 p-4">
              <img
                src={qrUrl}
                alt={`Código QR de la ubicación de ${space.title}`}
                className="h-28 w-28 shrink-0 rounded-xl bg-white p-2"
              />
              <p className="text-sm leading-relaxed text-violet-100">
                Escanea el código para abrir esta ubicación en Google Maps.
              </p>
            </div>
          </div>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 font-semibold text-violet-700 transition hover:bg-violet-50"
          >
            Abrir en Google Maps
            <ExternalLink className="h-4 w-4" />
          </a>
        </aside>
      </div>
    </article>
  );
}

export default function PublicCatalogPage() {
  const { token = "" } = useParams();
  const [catalog, setCatalog] = React.useState<PublicCatalogShare | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;

    getPublicCatalogShare(token)
      .then((data) => {
        if (active) setCatalog(data);
      })
      .catch((cause) => {
        if (!active) return;
        setError(
          cause instanceof PublicCatalogShareError
            ? cause.message
            : "No se pudo cargar este catálogo."
        );
      });

    return () => {
      active = false;
    };
  }, [token]);

  if (!catalog && !error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center text-slate-600">
          <LoaderCircle className="mx-auto h-10 w-10 animate-spin text-violet-600" />
          <p className="mt-4">Cargando catálogo...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-lg rounded-3xl border border-violet-100 bg-white p-10 text-center shadow-xl">
          <img src="/img/logo.png" alt="Impactos Espectaculares" className="mx-auto h-16 w-auto object-contain" />
          <h1 className="mt-8 text-2xl font-bold text-slate-900">Este enlace ya no está disponible</h1>
          <p className="mt-3 text-slate-600">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#ede9fe,_transparent_35%),linear-gradient(#f8fafc,#f5f3ff)] text-slate-900">
      <header className="border-b border-violet-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <img src="/img/logo.png" alt="Impactos Espectaculares" className="h-14 w-auto object-contain" />
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            Enlace vigente hasta {formatDate(catalog!.expires_at)}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-violet-600">Catálogo compartido</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Espacios que hacen impacto</h1>
          <p className="mt-4 text-lg text-slate-600">
            Consulta los espacios seleccionados y abre cada ubicación directamente en Google Maps.
          </p>
        </div>

        <div className="space-y-10">
          {catalog!.spaces.map((space) => <PublicSpaceCard key={space.id} space={space} />)}
        </div>
      </main>

      <footer className="border-t border-violet-100 bg-white px-6 py-8 text-center text-sm text-slate-500">
        Impactos Espectaculares · Mérida, Yucatán
      </footer>
    </div>
  );
}
