import { pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import { SpacesCatalogDocument, type CatalogSpace } from "./SpacesCatalogPdf";
import { SpacesCatalogDocumentV1 } from "./SpacesCatalogPdfV1";
import { env } from "@/config/env";
import { getToken } from "@/lib/auth";

async function blobToDataUrl(blob: Blob) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(String(reader.result ?? ""))
    reader.onerror = () => reject(new Error("No se pudo leer la imagen"))
    reader.readAsDataURL(blob)
  })
}

async function hydrateSpaceImages(spaces: CatalogSpace[]) {
  const token = getToken()

  return await Promise.all(
    spaces.map(async (space) => {
      const images = await Promise.all(
        (space.images ?? []).slice(0, 3).map(async (image) => {
          if (!image?.id || !env.apiUrl) return image

          const response = await fetch(
            `${env.apiUrl.replace(/\/+$/, "")}/api/spaces/${space.id}/images/${image.id}`,
            {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            }
          )

          if (!response.ok) return image

          const blob = await response.blob()
          const dataUrl = await blobToDataUrl(blob)

          return {
            ...image,
            path: dataUrl,
          }
        })
      )

      return {
        ...space,
        images,
      }
    })
  )
}

export type SpacesCatalogVersion = "v1" | "v2";

export const downloadSpacesCatalog = async (
  spaces: CatalogSpace[],
  version: SpacesCatalogVersion = "v2"
) => {
  const hydratedSpaces = await hydrateSpaceImages(spaces)
  const document = version === "v1"
    ? <SpacesCatalogDocumentV1 spaces={hydratedSpaces} />
    : <SpacesCatalogDocument spaces={hydratedSpaces} />
  const blob = await pdf(document).toBlob();

  saveAs(blob, `catalogo-espacios-${version.toUpperCase()}.pdf`);
};
