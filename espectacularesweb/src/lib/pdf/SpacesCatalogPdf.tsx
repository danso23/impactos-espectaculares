import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import type { SpaceApi } from "@/types/Space";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#0B0F1A",
    padding: 5,
    fontSize: 11,
    color: "#FFFFFF",
  },

  image: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },

  content: {
    flex: 1,
  },

  /* ================= IMÁGENES ================= */
  imagesSection: {
    height: "70%", // 70% del alto de la página
    gap: 10,
  },

  imagesRow: {
    height: "50%", // mitad del bloque de imágenes
    flexDirection: "row",
    gap: 10,
  },

  imageBox: {
    width: "50%",
    height: "100%",
    backgroundColor: "#1A1F36",
    borderRadius: 14,
    overflow: "hidden",
  },

  /* ================= INFO ================= */
  infoSection: {
    height: "30%", // 30%
    marginTop: 5,
    padding: 3,
    backgroundColor: "#121735",
    borderRadius: 16,
    flexDirection: "row",
    gap: 24,
    border: "1 solid #1E245A",
  },

  infoColumnMain: {
    flex: 1.5,
    justifyContent: "flex-start",
    gap: 8,
  },

  infoColumn: {
    flex: 1,
    justifyContent: "flex-start",
    gap: 6,
  },

  title: {
    fontSize: 20,
    fontWeight: "bold",
  },

  subtitle: {
    fontSize: 11,
    color: "#9AA0C3",
    marginTop: 4,
  },

  price: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6EE7FF",
    marginTop: 3,
  },

  badge: {
    marginTop: 4,
    alignSelf: "flex-start",
    backgroundColor: "#22C55E",
    paddingHorizontal: 5,
    paddingVertical: 4,
    borderRadius: 20,
    fontSize: 9,
    fontWeight: "bold",
    color: "#022C22",
  },

  label: {
    fontSize: 9,
    color: "#8E93B8",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  value: {
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 3,
  },

  footer: {
    marginTop: 3,
    fontSize: 9,
    color: "#6C7199",
    textAlign: "right",
  },
});

export function SpacesCatalogDocument({ spaces }: { spaces: SpaceApi[] }) {
  return (
    <Document>
      {spaces.map((space, index) => (
        <Page
          key={space.id}
          size="A4"
          orientation="landscape"
          style={styles.page}
        >
          <View style={styles.content}>
            {/* ================= IMÁGENES ================= */}
            <View style={styles.imagesSection}>
              <View style={styles.imagesRow}>
                <View style={styles.imageBox}>
                  <Image
                    src="https://picsum.photos/seed/picsum/200/300
"
                    style={styles.image}
                  />
                </View>
                <View style={styles.imageBox}>
                  <Image
                    src="https://picsum.photos/seed/picsum/200/300
"
                    style={styles.image}
                  />
                </View>
              </View>

              <View style={styles.imagesRow}>
                <View style={styles.imageBox}>
                  <Image
                    src="https://picsum.photos/seed/picsum/200/300
"
                    style={styles.image}
                  />
                </View>
                <View style={styles.imageBox}>
                  <Image
                    src="https://picsum.photos/seed/picsum/200/300
"
                    style={styles.image}
                  />
                </View>
              </View>
            </View>

            {/* ================= INFO ================= */}
            <View style={styles.infoSection}>
              <View style={styles.infoColumnMain}>
                <View>
                  <Text style={styles.title}>{space.title}</Text>
                  <Text style={styles.subtitle}>
                    ID #{space.id} · {space.type ?? "Espacio Publicitario"}
                  </Text>

                  <Text style={styles.price}>
                    {space.price
                      ? `$${Number(space.price).toLocaleString("es-MX")}`
                      : "Precio a consultar"}
                  </Text>

                  <Text style={styles.badge}>DISPONIBLE</Text>
                </View>

                <View>
                  <Text style={styles.label}>Ubicación</Text>
                  <Text style={styles.value}>
                    {space.latitude}, {space.longitude}
                  </Text>
                </View>
              </View>

              <View style={styles.infoColumn}>
                <View>
                  <Text style={styles.label}>Dimensiones</Text>
                  <Text style={styles.value}>
                    {space.width_m ?? "-"} × {space.height_m ?? "-"} m
                  </Text>
                </View>

                <View>
                  <Text style={styles.label}>Caras</Text>
                  <Text style={styles.value}>{space.faces}</Text>
                </View>

                <View>
                  <Text style={styles.label}>Iluminación</Text>
                  <Text style={styles.value}>
                    {space.has_lights ? "Sí" : "No"}
                  </Text>
                </View>

                <View>
                  <Text style={styles.label}>Nivel Socioeconómico</Text>
                  <Text style={styles.value}>
                    {space.socioeconomic_level ?? "N/A"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* ================= FOOTER ================= */}
          <View style={styles.footer}>
            <Text>Catálogo de Espacios · Página {index + 1}</Text>
          </View>
        </Page>
      ))}
    </Document>
  );
}
