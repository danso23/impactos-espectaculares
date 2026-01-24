// src/components/generic/row-actions-menu.tsx
import * as React from "react";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TableAction } from "@/types/TableAction";

type Props<T> = {
    row: T;
    actions: TableAction<T>[] | ((row: T) => TableAction<T>[]);
    label?: string;
    align?: "start" | "end";
};

export function RowActionsMenu<T>({
    row,
    actions,
    label = "Acciones",
    align = "end",
}: Props<T>) {
    const items = typeof actions === "function" ? actions(row) : actions;
    const visibleItems = items.filter((a) =>
        a.visible ? a.visible(row) : true,
    );

    if (visibleItems.length === 0) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Abrir acciones"
                    onClick={(e) => e.stopPropagation()}
                >
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align={align} className="min-w-44 z-50">
                <DropdownMenuLabel>{label}</DropdownMenuLabel>

                {visibleItems.map((a, idx) => {
                    const isDisabled = a.disabled ? a.disabled(row) : false;

                    return (
                        <React.Fragment key={a.key}>
                            {(a.separatorBefore || idx === 0) && idx !== 0 ? (
                                <DropdownMenuSeparator />
                            ) : null}

                            <DropdownMenuItem
                                disabled={isDisabled}
                                className={
                                    a.variant === "destructive"
                                        ? "text-destructive"
                                        : undefined
                                }
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    if (isDisabled) return;
                                    await a.onClick(row);
                                }}
                            >
                                {a.icon ? (
                                    <span className="mr-2 inline-flex">
                                        {a.icon}
                                    </span>
                                ) : null}
                                {a.label}
                            </DropdownMenuItem>
                        </React.Fragment>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
