import { pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import { SpacesCatalogDocument } from "./SpacesCatalogPdf";

export async function downloadSpacesCatalog(spaces: any[]) {
  const blob = await pdf(<SpacesCatalogDocument spaces={spaces} />).toBlob();

  saveAs(blob, "catalogo-espacios.pdf");
}
