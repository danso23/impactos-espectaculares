export type TableAction<T> = {
  key: string
  label: string
  icon?: React.ReactNode
  variant?: "default" | "destructive"
  separatorBefore?: boolean
  onClick: (row: T) => void | Promise<void>
  visible?: (row: T) => boolean
  disabled?: (row: T) => boolean
}