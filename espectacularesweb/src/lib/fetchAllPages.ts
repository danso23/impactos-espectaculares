type PageResponse<T> = {
  data: T[]
  meta?: { totalPages?: number | null } | null
}

/**
 * Descarga todas las páginas de un listado con los mismos filtros.
 * Se usa para exportar: el listado en pantalla solo tiene la página actual.
 */
export async function fetchAllPages<T>(
  fetchPage: (page: number, perPage: number) => Promise<PageResponse<T>>,
  { perPage = 100, maxPages = 200 }: { perPage?: number; maxPages?: number } = {},
): Promise<T[]> {
  const rows: T[] = []
  let page = 1
  let totalPages = 1

  do {
    const response = await fetchPage(page, perPage)
    rows.push(...(response.data ?? []))
    totalPages = Number(response.meta?.totalPages ?? 1) || 1
    page += 1
  } while (page <= totalPages && page <= maxPages)

  return rows
}
