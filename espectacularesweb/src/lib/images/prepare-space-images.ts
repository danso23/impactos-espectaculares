const MAX_DIMENSION = 2560
const TARGET_BYTES = 4 * 1024 * 1024
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error("No se pudo procesar la imagen.")),
      "image/jpeg",
      quality,
    )
  })
}

async function prepareImage(file: File) {
  if (!ACCEPTED_TYPES.has(file.type)) {
    throw new Error(`${file.name}: utiliza una imagen JPG, PNG o WebP.`)
  }

  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" })
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))

  const context = canvas.getContext("2d")
  if (!context) {
    bitmap.close()
    throw new Error(`No se pudo procesar ${file.name}.`)
  }

  context.fillStyle = "#ffffff"
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  let quality = 0.9
  let blob = await canvasToBlob(canvas, quality)
  while (blob.size > TARGET_BYTES && quality > 0.5) {
    quality -= 0.1
    blob = await canvasToBlob(canvas, quality)
  }

  const basename = file.name.replace(/\.[^.]+$/, "") || "espacio"
  return new File([blob], `${basename}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  })
}

export async function prepareSpaceImages(files: File[]) {
  return Promise.all(files.map(prepareImage))
}
