import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertCircle, X } from "lucide-react"

type DeleteConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title?: string
  description?: string
  itemName?: string
  loading?: boolean
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Confirmar eliminación",
  description = "Esta acción no se puede deshacer",
  itemName,
  loading = false,
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[400px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
        <div className="bg-red-600 p-6 text-white relative">
          <button 
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 hover:bg-red-700 p-1 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-2 rounded-xl">
              <AlertCircle className="h-8 w-8 text-white" />
            </div>
            <div>
              <AlertDialogTitle className="text-xl font-bold text-white">
                {title}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-red-100 text-sm mt-0.5">
                {description}
              </AlertDialogDescription>
            </div>
          </div>
        </div>

        <div className="p-8 bg-white">
          <p className="text-gray-700 text-center text-lg leading-relaxed">
            ¿Estás seguro de que deseas eliminar{" "}
            {itemName ? (
              <span className="font-bold text-gray-900 italic">"{itemName}"</span>
            ) : (
              "este elemento"
            )}
            ?
          </p>

          <AlertDialogFooter className="mt-8 sm:justify-center gap-3">
            <AlertDialogCancel 
              className="rounded-xl px-8 py-6 border-none bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold"
              disabled={loading}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                onConfirm()
              }}
              className="rounded-xl px-8 py-6 bg-red-600 hover:bg-red-700 text-white font-semibold shadow-lg shadow-red-200 border-none"
              disabled={loading}
            >
              {loading ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
