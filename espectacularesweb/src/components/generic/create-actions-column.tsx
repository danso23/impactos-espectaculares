// src/components/table/createActionsColumn.tsx
import * as React from "react"
import type { ColumnDef, Row } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type TableAction<T> = {
  key: string
  label: string
  icon?: React.ReactNode
  variant?: "default" | "destructive"
  separatorBefore?: boolean
  onClick: (row: T) => void | Promise<void>

  /** Para ocultar/deshabilitar según permisos/estado */
  visible?: (row: T) => boolean
  disabled?: (row: T) => boolean
}

type CreateActionsColumnOptions<T> = {
  id?: string
  header?: string
  label?: string
  actions: TableAction<T>[] | ((row: T) => TableAction<T>[])
  /** Si quieres el menú alineado a la derecha */
  align?: "start" | "end"
}

export function createActionsColumn<T>(
  opts: CreateActionsColumnOptions<T>
): ColumnDef<T> {
  const id = opts.id ?? "actions"
  const headerText = opts.header ?? "Acciones"

  return {
    id,
    header: headerText,
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => {
      const original = (row as Row<T>).original
      const items =
        typeof opts.actions === "function" ? opts.actions(original) : opts.actions

      // aplica visible()
      const visibleItems = items.filter((a) => (a.visible ? a.visible(original) : true))

      if (visibleItems.length === 0) return null

      return (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Abrir acciones">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align={opts.align ?? "end"} className="min-w-44">
              <DropdownMenuLabel>{opts.label ?? "Acciones"}</DropdownMenuLabel>

              {visibleItems.map((a, idx) => {
                const isDisabled = a.disabled ? a.disabled(original) : false
                return (
                  <React.Fragment key={a.key}>
                    {(a.separatorBefore || idx === 0) && idx !== 0 ? (
                      <DropdownMenuSeparator />
                    ) : null}

                    <DropdownMenuItem
                      disabled={isDisabled}
                      className={a.variant === "destructive" ? "text-destructive" : undefined}
                      onClick={async () => {
                        if (isDisabled) return
                        await a.onClick(original)
                      }}
                    >
                      {a.icon ? <span className="mr-2 inline-flex">{a.icon}</span> : null}
                      {a.label}
                    </DropdownMenuItem>
                  </React.Fragment>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  }
}