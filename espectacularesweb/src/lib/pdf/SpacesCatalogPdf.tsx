import {
  Document,
  Image,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { env } from "@/config/env";
import type { Space, SpaceApi } from "@/types/Space";

export type CatalogSpace = SpaceApi | Space;

const COLORS = {
  ink: "#18152E",
  muted: "#6F7188",
  purple: "#7417EF",
  violet: "#4A32F0",
  orange: "#FF7B31",
  paper: "#F7F7FC",
  line: "#E7E5F2",
  green: "#087742",
};

const styles = StyleSheet.create({
  coverPage: {
    position: "relative",
    padding: 44,
    color: "#FFFFFF",
    backgroundColor: "#1A153D",
  },
  coverGlowTop: {
    position: "absolute",
    width: 310,
    height: 310,
    top: -150,
    right: -110,
    borderRadius: 155,
    backgroundColor: "#5B356F",
  },
  coverGlowBottom: {
    position: "absolute",
    width: 290,
    height: 290,
    bottom: -145,
    left: -145,
    borderRadius: 145,
    backgroundColor: "#5C16B8",
  },
  coverAccent: {
    position: "absolute",
    width: 150,
    height: 150,
    top: 70,
    right: -60,
    borderRadius: 75,
    borderWidth: 1,
    borderColor: "#7B6A9A",
  },
  coverHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoPill: {
    width: 168,
    height: 48,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
  },
  coverLogo: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  coverYear: {
    fontSize: 9,
    fontWeight: "bold",
    letterSpacing: 2.2,
    color: "#D5CFE5",
  },
  coverMain: {
    marginTop: 160,
    width: 480,
  },
  coverEyebrow: {
    marginBottom: 18,
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 2.4,
    color: "#C7B7FF",
  },
  coverTitle: {
    fontSize: 37,
    lineHeight: 0.98,
    fontWeight: "bold",
    letterSpacing: -1.2,
  },
  coverTitleAccent: {
    color: COLORS.orange,
  },
  coverDescription: {
    width: 390,
    marginTop: 24,
    fontSize: 13,
    lineHeight: 1.55,
    color: "#DCD9EE",
  },
  coverRule: {
    width: 66,
    height: 6,
    marginTop: 26,
    borderRadius: 3,
    backgroundColor: COLORS.orange,
  },
  coverRulePurple: {
    width: 34,
    height: 6,
    marginTop: -6,
    marginLeft: 50,
    borderRadius: 3,
    backgroundColor: "#B71EFF",
  },
  coverFooter: {
    position: "absolute",
    left: 44,
    right: 44,
    bottom: 42,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  coverTags: {
    flexDirection: "row",
  },
  coverTag: {
    marginRight: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#766A9A",
    borderRadius: 14,
    fontSize: 7,
    color: "#EAE8F7",
  },
  coverCity: {
    textAlign: "right",
    fontSize: 15,
    fontWeight: "bold",
  },
  coverState: {
    marginTop: 2,
    textAlign: "right",
    fontSize: 8,
    fontWeight: "normal",
    color: "#C7C3DC",
  },

  catalogPage: {
    position: "relative",
    paddingHorizontal: 36,
    paddingTop: 28,
    paddingBottom: 30,
    backgroundColor: COLORS.paper,
  },
  header: {
    height: 34,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    width: 132,
    height: 32,
    objectFit: "contain",
    objectPosition: "left center",
  },
  sheetIndex: {
    fontSize: 7,
    letterSpacing: 1.2,
    color: COLORS.muted,
  },
  hero: {
    position: "relative",
    height: 250,
    marginTop: 12,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#DFDDE8",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  heroTop: {
    position: "absolute",
    top: 14,
    left: 14,
    right: 14,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  availabilityBadge: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 14,
    fontSize: 7,
    fontWeight: "bold",
    letterSpacing: 0.6,
    color: COLORS.green,
    backgroundColor: "#EAFFF2",
  },
  idBadge: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 14,
    fontSize: 7,
    fontWeight: "bold",
    letterSpacing: 0.5,
    color: "#FFFFFF",
    backgroundColor: "#201947",
  },
  heroCaption: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 14,
    backgroundColor: "rgba(24, 21, 46, 0.72)",
  },
  heroMeta: {
    marginBottom: 3,
    fontSize: 8,
    color: "#DED9EB",
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  contentRow: {
    height: 178,
    marginTop: 14,
    flexDirection: "row",
  },
  technicalPanel: {
    width: "64%",
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },
  locationPanel: {
    width: "33%",
    marginLeft: "3%",
    padding: 14,
    borderRadius: 14,
    color: "#FFFFFF",
    backgroundColor: "#5420BD",
  },
  sectionLabel: {
    marginBottom: 8,
    fontSize: 7,
    fontWeight: "bold",
    letterSpacing: 1.1,
    color: COLORS.purple,
  },
  sectionLabelLight: {
    marginBottom: 8,
    fontSize: 7,
    fontWeight: "bold",
    letterSpacing: 1.1,
    color: "#D9CAFF",
  },
  description: {
    minHeight: 28,
    marginBottom: 8,
    fontSize: 8,
    lineHeight: 1.4,
    color: "#4E5067",
  },
  specs: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  spec: {
    width: "31.4%",
    height: 46,
    marginRight: "1.9%",
    marginBottom: 6,
    padding: 8,
    borderRadius: 9,
    backgroundColor: "#F5F3FB",
  },
  specLabel: {
    marginBottom: 4,
    fontSize: 5.5,
    letterSpacing: 0.5,
    color: "#85859A",
  },
  specValue: {
    fontSize: 8,
    fontWeight: "bold",
    color: COLORS.ink,
  },
  locationTitle: {
    marginBottom: 6,
    fontSize: 13,
    fontWeight: "bold",
  },
  coordinates: {
    fontSize: 8,
    lineHeight: 1.5,
    color: "#DDD6F5",
  },
  qrRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  qr: {
    width: 48,
    height: 48,
    padding: 3,
    borderRadius: 5,
    backgroundColor: "#FFFFFF",
  },
  qrCopy: {
    flex: 1,
    marginLeft: 8,
    fontSize: 7,
    lineHeight: 1.35,
    color: "#E9E4FA",
  },
  mapLink: {
    marginTop: 8,
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderRadius: 7,
    textAlign: "center",
    fontSize: 7,
    fontWeight: "bold",
    color: "#5420BD",
    backgroundColor: "#FFFFFF",
    textDecoration: "none",
  },
  galleryRow: {
    height: 112,
    marginTop: 14,
    flexDirection: "row",
  },
  galleryImages: {
    width: "52%",
    flexDirection: "row",
  },
  galleryImage: {
    height: "100%",
    borderRadius: 12,
    objectFit: "cover",
    backgroundColor: "#DFDDE8",
  },
  valuePanel: {
    width: "45%",
    marginLeft: "3%",
    padding: 14,
    borderWidth: 1,
    borderColor: "#FFD6BE",
    borderRadius: 12,
    backgroundColor: "#FFF1E8",
  },
  valueLabel: {
    marginBottom: 6,
    fontSize: 6.5,
    fontWeight: "bold",
    letterSpacing: 1,
    color: "#C94E0A",
  },
  valueTitle: {
    marginBottom: 6,
    fontSize: 11,
    lineHeight: 1.15,
    fontWeight: "bold",
    color: COLORS.ink,
  },
  valueCopy: {
    fontSize: 7,
    lineHeight: 1.4,
    color: "#6E4B39",
  },
  availableLine: {
    marginTop: 8,
    fontSize: 7,
    fontWeight: "bold",
    color: COLORS.green,
  },
  footer: {
    position: "absolute",
    left: 36,
    right: 36,
    bottom: 18,
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: "#DEDDEA",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerContacts: {
    flexDirection: "row",
  },
  footerText: {
    marginRight: 14,
    fontSize: 5.5,
    color: "#68697D",
  },
  footerBrand: {
    fontSize: 6,
    fontWeight: "bold",
    letterSpacing: 0.6,
    color: "#4420A3",
  },
});

function getStorageBaseUrl() {
  const apiUrl = env.apiUrl?.replace(/\/+$/, "") ?? "";
  return apiUrl ? `${apiUrl}/storage` : `${window.location.origin}/storage`;
}

function resolveSpaceImageUrl(path?: string | null) {
  if (!path) return null;
  if (/^(https?:\/\/|data:)/i.test(path)) return path;

  return `${getStorageBaseUrl()}/${path.replace(/^\/+/, "")}`;
}

function getCatalogImages(space: CatalogSpace) {
  const urls = (space.images ?? [])
    .map((image) => resolveSpaceImageUrl(image.path))
    .filter((value): value is string => Boolean(value));

  return {
    main: urls[0] ?? `${window.location.origin}/img/img1.png`,
    gallery: urls.slice(1, 3),
  };
}

function getGoogleMapsUrl(space: CatalogSpace) {
  return `https://www.google.com/maps/search/?api=1&query=${space.latitude ?? 0},${space.longitude ?? 0}`;
}

function displayValue(value: unknown, fallback = "—") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function hasLights(value: CatalogSpace["has_lights"]) {
  return value === true || value === 1 || value === "1" || value === "true";
}

function isAvailable(space: CatalogSpace) {
  if ("active" in space && space.active !== null && space.active !== undefined) {
    return space.active === true || space.active === 1 || space.active === "1" || space.active === "true";
  }

  return "status" in space && space.status === "Disponible";
}

function getViewType(space: CatalogSpace) {
  if ("view_type" in space && space.view_type) return space.view_type;
  if ("viewType" in space) return space.viewType;
  return null;
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.spec}>
      <Text style={styles.specLabel}>{label.toUpperCase()}</Text>
      <Text style={styles.specValue}>{value}</Text>
    </View>
  );
}

export function SpacesCatalogDocument({ spaces }: { spaces: CatalogSpace[] }) {
  const year = new Date().getFullYear();
  const logoUrl = `${window.location.origin}/img/logo.png`;

  return (
    <Document title={`Catálogo de espacios ${year}`} author="Impactos Espectaculares">
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.coverGlowTop} />
        <View style={styles.coverGlowBottom} />
        <View style={styles.coverAccent} />

        <View style={styles.coverHeader}>
          <View style={styles.logoPill}>
            <Image src={logoUrl} style={styles.coverLogo} />
          </View>
          <Text style={styles.coverYear}>EDICIÓN {year}</Text>
        </View>

        <View style={styles.coverMain}>
          <Text style={styles.coverEyebrow}>CATÁLOGO COMERCIAL</Text>
          <Text style={styles.coverTitle}>ESPACIOS QUE</Text>
          <Text style={[styles.coverTitle, styles.coverTitleAccent]}>HACEN IMPACTO</Text>
          <Text style={styles.coverDescription}>
            Ubicaciones estratégicas para conectar marcas con miles de personas todos los días.
          </Text>
          <View style={styles.coverRule} />
          <View style={styles.coverRulePurple} />
        </View>

        <View style={styles.coverFooter}>
          <View style={styles.coverTags}>
            <Text style={styles.coverTag}>Carteleras</Text>
            <Text style={styles.coverTag}>Espectaculares</Text>
            <Text style={styles.coverTag}>Publicidad exterior</Text>
          </View>
          <View>
            <Text style={styles.coverCity}>Mérida</Text>
            <Text style={styles.coverState}>Yucatán, México</Text>
          </View>
        </View>
      </Page>

      {spaces.map((space, index) => {
        const catalogImages = getCatalogImages(space);
        const googleMapsUrl = getGoogleMapsUrl(space);
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(googleMapsUrl)}`;
        const latitude = displayValue(space.latitude);
        const longitude = displayValue(space.longitude);
        const available = isAvailable(space);

        return (
          <Page key={space.id} size="A4" style={styles.catalogPage}>
            <View style={styles.header}>
              <Image src={logoUrl} style={styles.logo} />
              <Text style={styles.sheetIndex}>
                FICHA DE ESPACIO · {String(index + 1).padStart(2, "0")} / {year}
              </Text>
            </View>

            <View style={styles.hero}>
              <Image src={catalogImages.main} style={styles.heroImage} />
              <View style={styles.heroTop}>
                <Text style={styles.availabilityBadge}>
                  {available ? "DISPONIBILIDAD INMEDIATA" : "CONSULTAR DISPONIBILIDAD"}
                </Text>
                <Text style={styles.idBadge}>ID {displayValue(space.assigned_id, String(space.id))}</Text>
              </View>
              <View style={styles.heroCaption}>
                <Text style={styles.heroMeta}>{displayValue(space.type, "Espacio publicitario")} · Mérida, Yucatán</Text>
                <Text style={styles.heroTitle}>{displayValue(space.title, "Espacio sin título")}</Text>
              </View>
            </View>

            <View style={styles.contentRow}>
              <View style={styles.technicalPanel}>
                <Text style={styles.sectionLabel}>FICHA TÉCNICA</Text>
                <Text style={styles.description}>{displayValue(space.description, "Descripción no disponible.")}</Text>
                <View style={styles.specs}>
                  <Spec label="Dimensiones" value={`${displayValue(space.width_m)} × ${displayValue(space.height_m)} m`} />
                  <Spec label="Caras" value={displayValue(space.faces)} />
                  <Spec label="Tipo" value={displayValue(space.type)} />
                  <Spec label="Tipo de vista" value={displayValue(getViewType(space))} />
                  <Spec label="Nivel" value={displayValue(space.socioeconomic_level)} />
                  <Spec label="Iluminación" value={hasLights(space.has_lights) ? "Sí" : "No"} />
                </View>
              </View>

              <View style={styles.locationPanel}>
                <Text style={styles.sectionLabelLight}>UBICACIÓN</Text>
                <Text style={styles.locationTitle}>Mérida, Yucatán</Text>
                <Text style={styles.coordinates}>{latitude}{"\n"}{longitude}</Text>
                <View style={styles.qrRow}>
                  <Link src={googleMapsUrl}>
                    <Image src={qrUrl} style={styles.qr} />
                  </Link>
                  <Text style={styles.qrCopy}>Escanea para consultar la ubicación exacta.</Text>
                </View>
                <Link src={googleMapsUrl} style={styles.mapLink}>Abrir en Google Maps →</Link>
              </View>
            </View>

            <View style={styles.galleryRow}>
              <View style={styles.galleryImages}>
                {catalogImages.gallery.length > 0 ? (
                  catalogImages.gallery.map((image, imageIndex) => (
                    <Image
                      key={`${space.id}-${imageIndex}`}
                      src={image}
                      style={[
                        styles.galleryImage,
                        {
                          width: catalogImages.gallery.length === 1 ? "100%" : "49%",
                          marginRight: imageIndex === 0 && catalogImages.gallery.length > 1 ? "2%" : 0,
                        },
                      ]}
                    />
                  ))
                ) : (
                  <Image src={catalogImages.main} style={[styles.galleryImage, { width: "100%" }]} />
                )}
              </View>

              <View style={styles.valuePanel}>
                <Text style={styles.valueLabel}>VALOR DEL ESPACIO</Text>
                <Text style={styles.valueTitle}>Visibilidad que trabaja por tu marca</Text>
                <Text style={styles.valueCopy}>
                  Formato de gran escala para campañas de alto impacto. Consulta vigencia y condiciones comerciales con nuestro equipo.
                </Text>
                <Text style={styles.availableLine}>
                  ● {available ? "Disponible para cotizar" : "Disponibilidad bajo consulta"}
                </Text>
              </View>
            </View>

            <View style={styles.footer}>
              <View style={styles.footerContacts}>
                <Text style={styles.footerText}>impactosespectaculares.com.mx</Text>
                <Text style={styles.footerText}>gguendulainf@hotmail.com</Text>
                <Text style={styles.footerText}>999 285 92 53 · 999 317 00 98</Text>
              </View>
              <Text style={styles.footerBrand}>MÉRIDA ESPECTACULAR</Text>
            </View>
          </Page>
        );
      })}
    </Document>
  );
}
