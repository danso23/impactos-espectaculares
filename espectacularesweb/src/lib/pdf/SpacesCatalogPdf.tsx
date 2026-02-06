import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

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
};

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    padding: 40,
    fontSize: 12,
    backgroundColor: "#ffffff",
  },

  header: {
    marginBottom: 20,
    borderBottom: "2 solid #000",
    paddingBottom: 10,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
  },

  subtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },

  body: {
    flex: 1,
    marginTop: 20,
    flexDirection: "row",
    gap: 30,
  },

  column: {
    flex: 1,
    gap: 8,
  },

  label: {
    fontSize: 10,
    color: "#555",
  },

  value: {
    fontSize: 14,
    fontWeight: "bold",
  },

  footer: {
    marginTop: 30,
    borderTop: "1 solid #eee",
    paddingTop: 10,
    fontSize: 10,
    color: "#999",
    textAlign: "right",
  },
});

export function SpacesCatalogDocument({ spaces }: { spaces: Space[] }) {
  return (
    <Document>
      {spaces.map((space, index) => (
        <Page
          key={space.id}
          size="A4"
          orientation="landscape"
          style={styles.page}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.title}>{space.title}</Text>
            <Text style={styles.subtitle}>
              ID #{space.id} · Tipo: {space.type ?? "N/A"}
            </Text>
          </View>

          {/* BODY */}
          <View style={styles.body}>
            <View style={styles.column}>
              <Text style={styles.label}>Precio</Text>
              <Text style={styles.value}>
                {space.price
                  ? `$${Number(space.price).toLocaleString("es-MX")}`
                  : "N/A"}
              </Text>

              <Text style={styles.label}>Caras</Text>
              <Text style={styles.value}>{space.faces}</Text>

              <Text style={styles.label}>Dimensiones</Text>
              <Text style={styles.value}>
                {space.width_m ?? "-"} × {space.height_m ?? "-"} m
              </Text>
            </View>

            <View style={styles.column}>
              <Text style={styles.label}>Nivel socioeconómico</Text>
              <Text style={styles.value}>
                {space.socioeconomic_level ?? "N/A"}
              </Text>

              <Text style={styles.label}>Iluminación</Text>
              <Text style={styles.value}>{space.has_lights ? "Sí" : "No"}</Text>

              <Text style={styles.label}>Ubicación</Text>
              <Text style={styles.value}>
                {space.latitude}, {space.longitude}
              </Text>
            </View>
          </View>

          {/* FOOTER */}
          <View style={styles.footer}>
            <Text>Catálogo de Espacios · Página {index + 1}</Text>
          </View>
        </Page>
      ))}
    </Document>
  );
}
