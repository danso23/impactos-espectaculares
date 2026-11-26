import "@tanstack/react-table"

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Encabezado en español para Excel cuando `header` no es texto. */
    exportLabel?: string
    /** Valor legible para Excel (etiquetas en lugar de códigos internos). */
    exportValue?: (record: TData) => unknown
    /** Una columna de la tabla que se exporta como varias (p. ej. Total, Pagado, Saldo). */
    exportColumns?: { label: string; value: (record: TData) => unknown }[]
    /** false para no incluir la columna en la exportación. */
    exportable?: boolean
  }
}
