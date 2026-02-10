import { pdf } from "@react-pdf/renderer"
import { saveAs } from "file-saver"
import type { SpaceApi } from "@/types/Space"

import { SpacesCatalogDocument } from "./SpacesCatalogPdf"

export async function downloadSpacesCatalog(spaces: SpaceApi[]) {
  const blob = await pdf(
    <SpacesCatalogDocument spaces={spaces} />
  ).toBlob()

  saveAs(blob, "catalogo-espacios.pdf")
}
