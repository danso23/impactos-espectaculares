import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

type Space = {
  id: number;
  title: string;
  price: string | null;
  type: string | null;
  has_lights: boolean;
  faces: number;
  width_m: string | null;
  height_m: string | null;
  socioeconomic_level: string | null;
  latitude: string;
  longitude: string;
  assigned_id?: string;
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#F5F5F5",
    padding: 20,
    fontSize: 10,
  },

  /* HEADER */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  logoBox: {
    width: 120,
    height: 40,
    border: "1 dashed #999", // placeholder para logo
    justifyContent: "center",
    alignItems: "center",
  },

  logoText: {
    fontSize: 8,
    color: "#999",
  },

  /* MAIN IMAGE */
  mainImage: {
    width: "100%",
    height: 260,
    borderRadius: 8,
    marginBottom: 12,
  },

  contentRow: {
    flexDirection: "row",
    gap: 12,
  },

  /* LEFT SIDE */
  left: {
    width: "55%",
    gap: 6,
  },

  dimension: {
    fontSize: 12,
    fontWeight: "bold",
  },

  locationLabel: {
    fontSize: 9,
    marginTop: 4,
    fontWeight: "bold",
  },

  locationText: {
    fontSize: 9,
    lineHeight: 1.3,
  },

  availability: {
    marginTop: 6,
    color: "red",
    fontWeight: "bold",
    fontSize: 10,
  },

  contact: {
    marginTop: 10,
    fontSize: 9,
    gap: 3,
  },

  /* RIGHT SIDE */
  right: {
    width: "45%",
    gap: 8,
  },

  qr: {
    width: 100,
    height: 100,
  },

  smallImage: {
    width: "100%",
    height: 100,
    borderRadius: 6,
  },

  map: {
    width: "100%",
    height: 100,
    borderRadius: 6,
  },

  /* FOOTER BAR */
  footerBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#2E2A72",
    padding: 10,
    alignItems: "center",
  },

  footerText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
});

export function SpacesCatalogDocument({ spaces }: { spaces: Space[] }) {
  return (
    <Document>
      {spaces.map((space, index) => (
        <Page key={space.id} size="A4" style={styles.page}>
          {/* HEADER LOGOS */}
          <View style={styles.header}>
            <View style={styles.logoBox}>
              <img src="../../img/logo.png" alt="Impactos Espectaculares" />
            </View>

            <View style={styles.logoBox}>
              <Text style={styles.logoText}>LOGO 2</Text>
            </View>
          </View>

          {/* IMAGEN PRINCIPAL */}
          <Image src="https://picsum.photos/800/400" style={styles.mainImage} />

          <View style={styles.contentRow}>
            {/* IZQUIERDA */}
            <View style={styles.left}>
              <Text style={styles.dimension}>
                {space.width_m ?? "-"} x {space.height_m ?? "-"} MTS
              </Text>

              <Text style={styles.locationLabel}>UBICACIÓN:</Text>

              <Text style={styles.locationText}>
                {space.latitude}, {space.longitude}
              </Text>

              <Text style={styles.availability}>DISPONIBILIDAD INMEDIATA</Text>

              {/* CONTACTO */}
              <View style={styles.contact}>
                <Text>Impactos espectaculares</Text>
                <Text>www.impactosespectaculares.com.mx</Text>
                <Text>contacto@email.com</Text>
                <Text>999 000 0000</Text>
              </View>
            </View>

            {/* DERECHA */}
            <View style={styles.right}>
              {/* QR */}
              <Image
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://maps.google.com/?q=${space.latitude},${space.longitude}`}
                style={styles.qr}
              />

              {/* IMAGEN SECUNDARIA */}
              <Image
                src="https://picsum.photos/300/200"
                style={styles.smallImage}
              />

              {/* MAPA */}
              <Image
                src={`https://maps.googleapis.com/maps/api/staticmap?center=${space.latitude},${space.longitude}&zoom=15&size=300x200&markers=color:red|${space.latitude},${space.longitude}`}
                style={styles.map}
              />
            </View>
          </View>

          {/* FOOTER */}
          <View style={styles.footerBar}>
            <Text style={styles.footerText}>MÉRIDA ESPECTACULAR</Text>
          </View>
        </Page>
      ))}
    </Document>
  );
}
