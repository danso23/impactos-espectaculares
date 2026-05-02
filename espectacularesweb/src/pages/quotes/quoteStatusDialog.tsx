import * as React from "react"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useChangeQuoteStatus, useQuoteHistory } from "@/lib/hooks/quoteHook"
import type { QuoteRecord, QuoteStatus } from "@/types/Quote"
import { getAllowedQuoteStatusKeys, toneClass } from "@/pages/quotes/quoteStatus"

function formatDateTime(value?: string | null) {
  if (!value) return "—"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function actorLabel(historyActor?: {
  name?: string | null
  username?: string | null
  email?: string | null
} | null) {
  return historyActor?.name || historyActor?.username || historyActor?.email || "Sistema"
}

function historyTitle(entry: {
  from_status?: { name?: string | null } | null
  to_status?: { name?: string | null } | null
  meta?: Record<string, unknown> | null
}) {
  if (entry.meta?.event === "converted_to_rental") {
    return `Convertida a renta #${String(entry.meta?.rental_id ?? "—")}`
  }

  return `${entry.from_status?.name ?? "Inicio"} -> ${entry.to_status?.name ?? "—"}`
}

type QuoteStatusDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  quote: QuoteRecord | null
  statuses: QuoteStatus[]
}

export function QuoteStatusDialog({
  open,
  onOpenChange,
  quote,
  statuses,
}: QuoteStatusDialogProps) {
  const historyQuery = useQuoteHistory(quote?.id ?? null, open && !!quote)
  const changeStatusMutation = useChangeQuoteStatus()

  const allowedStatusKeys = React.useMemo(
    () => getAllowedQuoteStatusKeys(quote?.status?.key),
    [quote?.status?.key]
  )

  const allowedStatuses = React.useMemo(
    () => statuses.filter((status) => allowedStatusKeys.includes(status.key)),
    [allowedStatusKeys, statuses]
  )

  const [nextStatusKey, setNextStatusKey] = React.useState<string>("")
  const [reason, setReason] = React.useState("")
  const [notes, setNotes] = React.useState("")

  React.useEffect(() => {
    if (!open) return

    setNextStatusKey(allowedStatuses[0]?.key ?? "")
    setReason("")
    setNotes("")
  }, [allowedStatuses, open, quote?.id])

  const handleSubmit = async () => {
    if (!quote || !nextStatusKey) return

    try {
      const response = await changeStatusMutation.mutateAsync({
        id: quote.id,
        payload: {
          to_status: nextStatusKey,
          reason: reason.trim() || null,
          notes: notes.trim() || null,
        },
      })

      toast.success(response.data.status?.name ? `Estatus actualizado a ${response.data.status.name}.` : "Estatus actualizado.")
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible actualizar el estatus.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Cambiar estatus</DialogTitle>
          <DialogDescription>
            {quote ? `Cotización ${quote.folio}` : "Selecciona el nuevo estatus de la cotización."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Estatus actual</Label>
              <div className="rounded-md border px-3 py-2">
                {quote?.status ? (
                  <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${toneClass(quote.status)}`}>
                    {quote.status.name}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">Sin estatus</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nuevo estatus</Label>
              <Select value={nextStatusKey} onValueChange={setNextStatusKey} disabled={!allowedStatuses.length}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un estatus" />
                </SelectTrigger>
                <SelectContent>
                  {allowedStatuses.map((status) => (
                    <SelectItem key={status.id} value={status.key}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!allowedStatuses.length ? (
                <div className="text-xs text-muted-foreground">
                  Esta cotización ya no admite cambios de estatus.
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>Motivo</Label>
              <Textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Ej. enviado al cliente, aprobado por llamada, se venció la vigencia..."
                className="min-h-[90px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Notas internas sobre este cambio de estatus"
                className="min-h-[120px]"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-sm font-medium">Historial</div>
              <div className="text-xs text-muted-foreground">
                Fecha, usuario, cambio realizado y observaciones.
              </div>
            </div>

            <div className="max-h-[420px] space-y-3 overflow-y-auto rounded-md border p-3">
              {historyQuery.isLoading ? (
                <div className="text-sm text-muted-foreground">Cargando historial...</div>
              ) : null}

              {historyQuery.isError ? (
                <div className="text-sm text-red-600">No fue posible cargar el historial.</div>
              ) : null}

              {!historyQuery.isLoading && !historyQuery.isError && (historyQuery.data?.data.length ?? 0) === 0 ? (
                <div className="text-sm text-muted-foreground">Sin movimientos registrados.</div>
              ) : null}

              {historyQuery.data?.data.map((entry) => (
                <div key={entry.id} className="rounded-md border bg-muted/20 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-medium">
                      {historyTitle(entry)}
                    </div>
                    <div className="text-xs text-muted-foreground">{formatDateTime(entry.changed_at)}</div>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Por: {actorLabel(entry.changed_by)}
                  </div>
                  {entry.reason ? (
                    <div className="mt-2 text-sm">
                      <span className="font-medium">Motivo:</span> {entry.reason}
                    </div>
                  ) : null}
                  {entry.notes ? (
                    <div className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                      {entry.notes}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!quote || !nextStatusKey || changeStatusMutation.isPending}
          >
            {changeStatusMutation.isPending ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Guardar estatus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
