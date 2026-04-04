import { pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import { SpacesCatalogDocument } from "./SpacesCatalogPdf";
import { env } from "@/config/env";
import { getToken } from "@/lib/auth";
import type { SpaceApi } from "@/types/Space";

async function blobToDataUrl(blob: Blob) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(String(reader.result ?? ""))
    reader.onerror = () => reject(new Error("No se pudo leer la imagen"))
    reader.readAsDataURL(blob)
  })
}

async function hydrateSpaceImages(spaces: SpaceApi[]) {
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

export const downloadSpacesCatalog = async (spaces: SpaceApi[]) => {
  const hydratedSpaces = await hydrateSpaceImages(spaces)
  const blob = await pdf(<SpacesCatalogDocument spaces={hydratedSpaces} />).toBlob();

  saveAs(blob, "catalogo-espacios.pdf");
};
