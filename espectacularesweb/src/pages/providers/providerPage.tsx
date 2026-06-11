import * as React from "react"
import { Search, UserCheck2, UserX, UsersRound } from "lucide-react"
import { toast } from "sonner"

import { DataTable } from "@/components/generic/data-table"
import { DeleteConfirmDialog } from "@/components/generic/delete-confirm-dialog"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  useCreateProvider,
  useDeleteProvider,
  useProviders,
  useUpdateProvider,
} from "@/lib/hooks/providerHook"
import type { ProviderFormValues, ProviderRecord } from "@/types/Provider"
import { ProviderForm } from "./providerForm"
import { useProviderTable } from "./providerTable"

export default function ProviderPage() {
  const createMutation = useCreateProvider()
  const updateMutation = useUpdateProvider()
  const deleteMutation = useDeleteProvider()

  const [page, setPage] = React.useState(1)
  const [searchInput, setSearchInput] = React.useState("")
  const [search, setSearch] = React.useState("")
  const perPage = 10

  const [editRecord, setEditRecord] = React.useState<ProviderRecord | null>(null)
  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [providerToDelete, setProviderToDelete] = React.useState<ProviderRecord | null>(null)

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 350)

    return () => window.clearTimeout(timer)
  }, [searchInput])

  const params = React.useMemo(
    () => ({
      page,
      per_page: perPage,
      q: search || undefined,
    }),
    [page, perPage, search]
  )

  const providersQuery = useProviders(params)
  const providers = providersQuery.data?.data ?? []
  const meta = providersQuery.data?.meta
  const totalProviders = meta?.total ?? 0
  const visibleActiveProviders = providers.filter((provider) => provider.active !== false).length
  const visibleInactiveProviders = providers.length - visibleActiveProviders

  const handleEdit = React.useCallback((row: ProviderRecord) => {
    setEditRecord(row)
    setEditOpen(true)
  }, [])

  const handleDelete = React.useCallback((row: ProviderRecord) => {
    setProviderToDelete(row)
    setDeleteDialogOpen(true)
  }, [])

  const columns = useProviderTable({ onEdit: handleEdit, onDelete: handleDelete })

  async function handleCreate(payload: ProviderFormValues) {
    try {
      await createMutation.mutateAsync(payload)
      toast.success("Proveedor creado correctamente")
    } catch (error) {
      toast.error("No se pudo crear el proveedor", {
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
      })
      throw error
    }
  }

  async function handleUpdate(payload: ProviderFormValues) {
    if (!editRecord) return

    try {
      await updateMutation.mutateAsync({ id: editRecord.id, payload })
      toast.success("Proveedor actualizado correctamente")
      setEditOpen(false)
      setEditRecord(null)
    } catch (error) {
      toast.error("No se pudo actualizar el proveedor", {
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
      })
      throw error
    }
  }

  const handleConfirmDelete = async () => {
    if (!providerToDelete) return

    try {
      await deleteMutation.mutateAsync(providerToDelete.id)
      toast.success("Proveedor eliminado correctamente")
      setDeleteDialogOpen(false)
    } catch (error) {
      toast.error("No se pudo eliminar el proveedor", {
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
      })
    } finally {
      setProviderToDelete(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
            <UsersRound className="h-3.5 w-3.5" />
            Catálogo de proveedores
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Proveedores</h1>
            <p className="mt-2 max-w-2xl text-gray-600">
              Administra contactos, teléfonos, correos y direcciones de tus proveedores desde un solo lugar.
            </p>
          </div>
        </div>

        <ProviderForm isSubmitting={createMutation.isPending} onSubmit={handleCreate} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card className="border-gray-200 shadow-md">
          <CardHeader className="pb-3">
            <CardDescription>Total registrados</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <UsersRound className="h-5 w-5 text-purple-600" />
              {totalProviders}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-gray-200 shadow-md">
          <CardHeader className="pb-3">
            <CardDescription>Activos en la página</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <UserCheck2 className="h-5 w-5 text-emerald-600" />
              {visibleActiveProviders}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-gray-200 shadow-md">
          <CardHeader className="pb-3">
            <CardDescription>Inactivos en la página</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <UserX className="h-5 w-5 text-slate-500" />
              {visibleInactiveProviders}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-gray-200 shadow-lg">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-xl">Búsqueda rápida</CardTitle>
              <CardDescription>
                Filtra por nombre, contacto, teléfono, email, dirección o notas.
              </CardDescription>
            </div>

            <div className="w-full lg:max-w-md">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Buscar proveedor..."
                  className="rounded-xl border-gray-300 bg-white pl-10 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          <Separator />
        </CardHeader>

        <CardContent className="pt-0">
          <DataTable
            columns={columns}
            data={providers}
            enableSearch={false}
            pageSize={perPage}
            enablePagination
            manualPagination
            pageIndex={(meta?.page ?? page) - 1}
            pageCount={meta?.totalPages ?? 1}
            onPageChange={(nextPageIndex) => setPage(nextPageIndex + 1)}
            isLoading={providersQuery.isFetching}
          />
        </CardContent>
      </Card>

      <ProviderForm
        editRecord={editRecord}
        isSubmitting={updateMutation.isPending}
        onSubmit={handleUpdate}
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open)
          if (!open) setEditRecord(null)
        }}
        showTrigger={false}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        itemName={providerToDelete?.name}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
