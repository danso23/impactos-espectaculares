import { pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import { SpacesCatalogDocument, type CatalogSpace } from "./SpacesCatalogPdf";
import { env } from "@/config/env";
import { getToken } from "@/lib/auth";
import { sortByAssignedId } from "@/lib/catalog/catalogHelpers";

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
        (space.images ?? []).slice(0, 4).map(async (image) => {
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

export const createSpacesCatalogPdf = async (
  spaces: CatalogSpace[],
  options: { enableMapLinks?: boolean } = {}
) => {
  // El PDF de fichas se envía al cliente: nunca incluye precios.
  const clientSpaces = sortByAssignedId(spaces).map((space) => ({ ...space, price: undefined }))
  const hydratedSpaces = await hydrateSpaceImages(clientSpaces)
  const enableMapLinks = options.enableMapLinks ?? true
  return await pdf(<SpacesCatalogDocument spaces={hydratedSpaces} enableMapLinks={enableMapLinks} />).toBlob();
};

export const saveSpacesCatalogPdf = (blob: Blob) => {
  saveAs(blob, "catalogo-espacios.pdf");
};

export const downloadSpacesCatalog = async (spaces: CatalogSpace[]) => {
  const blob = await createSpacesCatalogPdf(spaces);
  saveSpacesCatalogPdf(blob);
};
