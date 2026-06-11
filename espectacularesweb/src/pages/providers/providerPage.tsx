import * as React from "react"
import { toast } from "sonner"

import { DataTable } from "@/components/generic/data-table"
import { DeleteConfirmDialog } from "@/components/generic/delete-confirm-dialog"
import { Input } from "@/components/ui/input"
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Proveedores</h1>
          <p className="text-gray-600">Gestiona los proveedores del sistema.</p>
        </div>

        <ProviderForm isSubmitting={createMutation.isPending} onSubmit={handleCreate} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Buscar por nombre, teléfono, email..."
          className="rounded-lg border-gray-300 focus:ring-purple-500"
        />
      </div>

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
