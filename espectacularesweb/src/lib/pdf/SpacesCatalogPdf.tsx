import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Link,
} from "@react-pdf/renderer";
import type { SpaceApi } from "@/types/Space";
import { env } from "@/config/env";

const styles = StyleSheet.create({
  /* ================= PORTADA ================= */
  coverPage: {
    backgroundColor: "#EDEDED",
  },

  coverContainer: {
    flex: 1,
    position: "relative",
    padding: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  /* 🔷 FORMAS */
  blueTop: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "65%",
    height: 180,
    backgroundColor: "#1D6FA5",
  },

  blueBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "65%",
    height: 180,
    backgroundColor: "#1D6FA5",
  },

  blueLight: {
    position: "absolute",
    bottom: 120,
    left: 0,
    width: "55%",
    height: 120,
    backgroundColor: "#2CA6D9",
  },

  /* 🟣 BLOQUES */
  purpleTop: {
    position: "absolute",
    top: 90,
    right: 60,
    width: 120,
    height: 60,
    backgroundColor: "#2E2A6D",
  },

  purpleBottom: {
    position: "absolute",
    bottom: 60,
    left: 40,
    width: 160,
    height: 70,
    backgroundColor: "#2E2A6D",
  },

  /* CONTENIDO */

  title: {
    fontSize: 44,
    fontWeight: "bold",
    color: "#2E2A6D",
    letterSpacing: 2,
  },

  subtitle: {
    fontSize: 16,
    marginTop: 10,
    color: "#2E2A6D",
    letterSpacing: 3,
  },

  subLogo: {
    width: 100,
    marginTop: 20,
  },

  yearBox: {
    position: "absolute",
    bottom: 50,
    right: 50,
    border: "2 solid #2E2A6D",
    padding: 12,
  },

  yearText: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#2E2A6D",
    textAlign: "center",
  },

  /* ================= PÁGINA ESPACIO ================= */
  page: {
    backgroundColor: "#FFFFFF",
    padding: 20,
  },

  logoBox: {
    width: 120,
    height: 40,
  },

  titleSpace: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 8,
  },

  subtitleSpace: {
    fontSize: 10,
    color: "#555",
    marginBottom: 6,
  },

  bottomSection: {
    flexDirection: "row",
    marginTop: 12,
    gap: 10,
  },
  label: {
    fontSize: 10,
    fontWeight: "bold",
  },

  text: {
    fontSize: 9,
  },

  qrSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  rightImages: {
    flex: 1,
    gap: 6,
  },

  footer: {
    position: "absolute",
    bottom: 10,
    right: 20,
    fontSize: 9,
    color: "#999",
  },

  catalogPage: {
    backgroundColor: "#F4F4F4",
    padding: 20,
    position: "relative",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  logo: {
    width: 140,
  },

  sideLabel: {
    position: "absolute",
    right: 0,
    top: 120,
    width: 40,
    height: 300,
    backgroundColor: "#2CA6D9",
    justifyContent: "center",
    alignItems: "center",
  },

  sideLabelText: {
    transform: "rotate(-90deg)",
    fontSize: 12,
    color: "#FFFFFF",
    letterSpacing: 2,
  },

  mainImage: {
    width: "100%",
    height: 260,
    objectFit: "cover",
    marginTop: 10,
  },

  contentRow: {
    flexDirection: "row",
    marginTop: 15,
    gap: 10,
  },

  leftInfo: {
    flex: 1.2,
  },

  iconText: {
    fontSize: 10,
    marginBottom: 4,
  },

  highlight: {
    color: "red",
    fontSize: 10,
    marginTop: 6,
    fontWeight: "bold",
  },

  qr: {
    width: 100,
    height: 100,
    marginTop: 10,
  },

  mapLink: {
    marginTop: 8,
    fontSize: 9,
    color: "#1D6FA5",
    textDecoration: "none",
  },

  rightColumn: {
    flex: 1,
    gap: 6,
  },

  smallImage: {
    width: "100%",
    height: 100,
  },

  mapImage: {
    width: "100%",
    height: 120,
  },

  footerBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "100%",
    height: 40,
    backgroundColor: "#2E2A6D",
    justifyContent: "center",
    alignItems: "center",
  },

  footerText: {
    color: "#FFFFFF",
    fontSize: 12,
    letterSpacing: 3,
  },
});

function getStorageBaseUrl() {
  const apiUrl = env.apiUrl?.replace(/\/+$/, "") ?? ""
  return apiUrl ? `${apiUrl}/storage` : `${window.location.origin}/storage`
}

function resolveSpaceImageUrl(path?: string | null) {
  if (!path) return null
  if (/^(https?:\/\/|data:)/i.test(path)) return path

  const cleanPath = path.replace(/^\/+/, "")
  return `${getStorageBaseUrl()}/${cleanPath}`
}

function getCatalogImages(space: SpaceApi) {
  const urls = (space.images ?? [])
    .map((image) => resolveSpaceImageUrl(image.path))
    .filter((value): value is string => Boolean(value))

  const fallbackMain = `${window.location.origin}/img/img1.png`
  const fallbackAlt1 = `${window.location.origin}/img/img2.png`
  const fallbackAlt2 = `${window.location.origin}/img/img3.png`

  return {
    main: urls[0] ?? fallbackMain,
    secondary: urls[1] ?? urls[0] ?? fallbackAlt1,
    tertiary: urls[2] ?? urls[1] ?? urls[0] ?? fallbackAlt2,
  }
}

function getGoogleMapsUrl(space: SpaceApi) {
  return `https://www.google.com/maps/search/?api=1&query=${space.latitude},${space.longitude}`
}

export function SpacesCatalogDocument({ spaces }: { spaces: SpaceApi[] }) {
  return (
    <Document>
      {/* ================= PORTADA ================= */}
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.coverContainer}>
          <View style={styles.blueTop} />
          <View style={styles.blueBottom} />
          <View style={styles.blueLight} />
          <View style={styles.purpleTop} />
          <View style={styles.purpleBottom} />

          {/* LOGO PRINCIPAL */}
          <Image
            src={window.location.origin + "/img/logo.png"}
            style={styles.logo}
          />

          <Text style={styles.title}>CATÁLOGO</Text>
          <Text style={styles.subtitle}>CARTELERAS MÉRIDA</Text>

          {/* LOGO SECUNDARIO */}
          <Image
            src={window.location.origin + "/img/logo-secundario.png"}
            style={styles.subLogo}
          />

          {/* AÑO */}
          <View style={styles.yearBox}>
            <Text style={styles.yearText}>20{"\n"}26</Text>
          </View>
        </View>
      </Page>

      {/* ================= ESPACIOS ================= */}
      {spaces.map((space) => {
        const catalogImages = getCatalogImages(space)
        const googleMapsUrl = getGoogleMapsUrl(space)
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(googleMapsUrl)}`;

        const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${space.latitude},${space.longitude}&zoom=15&size=400x300&markers=color:red%7C${space.latitude},${space.longitude}`;

        return (
          <Page key={space.id} size="A4" style={styles.catalogPage}>
            {/* HEADER */}
            <View style={styles.header}>
              <Image
                src={window.location.origin + "/img/logo.png"}
                style={styles.logo}
              />

              <Image
                src={window.location.origin + "/img/logo-secundario.png"}
                style={styles.logo}
              />
            </View>

            {/* ETIQUETA LATERAL */}
            <View style={styles.sideLabel}>
              <Text style={styles.sideLabelText}>Carteleras Mérida</Text>
            </View>

            {/* IMAGEN PRINCIPAL */}
            <Image src={catalogImages.main} style={styles.mainImage} />

            {/* CONTENIDO */}
            <View style={styles.contentRow}>
              {/* IZQUIERDA */}
              <View style={styles.leftInfo}>
                <Text style={styles.iconText}>
                  {space.width_m ?? "-"} x {space.height_m ?? "-"} MTS
                </Text>

                <Text style={styles.iconText}>UBICACIÓN:</Text>

                <Text style={styles.iconText}>
                  {space.latitude}, {space.longitude}
                </Text>

                <Text style={styles.highlight}>DISPONIBILIDAD INMEDIATA</Text>

                <Link src={googleMapsUrl}>
                  <Image src={qrUrl} style={styles.qr} />
                </Link>

                <Link src={googleMapsUrl} style={styles.mapLink}>
                  Ver ubicacion en Google Maps
                </Link>
              </View>

              {/* DERECHA */}
              <View style={styles.rightColumn}>
                <Image src={catalogImages.secondary} style={styles.smallImage} />

                <Image src={catalogImages.tertiary} style={styles.smallImage} />

                {/* MAPA */}
                <Image src={mapUrl} style={styles.mapImage} />
              </View>
            </View>

            {/* FOOTER */}
            <View style={styles.footerBar}>
              <Text style={styles.footerText}>MÉRIDA ESPECTACULAR</Text>
            </View>
          </Page>
        );
      })}
    </Document>
  );
}
