import * as React from "react"
import { ArrowLeft, MapPinned, Pencil } from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { asSpaceType } from "@/lib/helpers/spaceTypeHelper"
import { asViewType } from "@/lib/helpers/viewTypeHelper"
import { useCreateSpace, useSpace, useUpdateSpace } from "@/lib/hooks/spaceHook"
import { apiToUiSpace } from "@/lib/mappers/spaceMapper"
import type { SpaceFormValues } from "@/types/Space"

import { SpaceForm } from "./spaceForm"

export default function SpaceEditorPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = id !== undefined
  const parsedId = id ? Number(id) : null
  const validId = parsedId !== null && Number.isInteger(parsedId) && parsedId > 0
  const spaceQuery = useSpace(isEdit && validId ? parsedId : null)
  const createMutation = useCreateSpace()
  const updateMutation = useUpdateSpace()

  const space = React.useMemo(
    () => spaceQuery.data?.data ? apiToUiSpace(spaceQuery.data.data) : null,
    [spaceQuery.data],
  )

  const initialValues = React.useMemo<Partial<SpaceFormValues> | undefined>(() => {
    if (!space) return undefined
    const rawSpace = spaceQuery.data?.data

    return {
      active:
        rawSpace?.active === true ||
        rawSpace?.active === 1 ||
        rawSpace?.active === "1" ||
        rawSpace?.active === "true",
      blocked_from: rawSpace?.blocked_from?.slice(0, 10) ?? "",
      blocked_until: rawSpace?.blocked_until?.slice(0, 10) ?? "",
      is_rotating: Boolean(space.is_rotating),
      faces: space.faces,
      assigned_id: space.assigned_id ?? "",
      title: space.title ?? "",
      price: space.price,
      type: asSpaceType(space.type),
      width_m: space.width_m,
      height_m: space.height_m,
      has_lights: space.has_lights ?? false,
      viewType: asViewType(space.viewType),
      latitude: rawSpace?.latitude != null ? Number(rawSpace.latitude) : undefined,
      longitude: rawSpace?.longitude != null ? Number(rawSpace.longitude) : undefined,
      socioeconomic_level: space.socioeconomic_level ?? "",
      description: space.description ?? "",
      comments: space.comments ?? "",
    }
  }, [space, spaceQuery.data])

  const existingImages = React.useMemo(() => {
    if (!space) return []

    return (space.images ?? []).flatMap((image, index) => {
      const url = space.imageUrls?.[index]
      if (!url) return []

      return [{
        id: image.id,
        url,
        isCover: Boolean(image.is_cover),
      }]
    })
  }, [space])

  const goBack = () => navigate("/espacios")

  if (isEdit && !validId) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">El espacio solicitado no es válido</h1>
        <p className="mt-2 text-sm text-muted-foreground">Regresa al listado para seleccionar otro registro.</p>
        <Button className="mt-6" onClick={goBack}>Volver a espacios</Button>
      </div>
    )
  }

  if (isEdit && spaceQuery.isLoading) {
    return (
      <div className="mx-auto flex min-h-[420px] max-w-[1600px] items-center justify-center rounded-2xl border border-violet-100 bg-white">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-violet-100 border-t-violet-600" />
          <p className="mt-4 text-sm text-muted-foreground">Cargando espacio...</p>
        </div>
      </div>
    )
  }

  if (isEdit && (spaceQuery.isError || !space)) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">No se pudo cargar el espacio</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {spaceQuery.error instanceof Error ? spaceQuery.error.message : "El registro no está disponible."}
        </p>
        <Button className="mt-6" onClick={goBack}>Volver a espacios</Button>
      </div>
    )
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-4 rounded-2xl border border-violet-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Button type="button" variant="outline" size="icon" onClick={goBack} aria-label="Volver a espacios">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
              {isEdit ? <Pencil className="h-5 w-5 text-violet-600" /> : <MapPinned className="h-5 w-5 text-violet-600" />}
              {isEdit ? "Editar espacio" : "Nuevo espacio"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isEdit ? "Actualiza la ubicación y los datos del espacio." : "Registra la ubicación y características del nuevo espacio."}
            </p>
          </div>
        </div>
        {isEdit ? (
          <div className="rounded-xl border border-violet-100 bg-violet-50 px-4 py-2 text-sm">
            <span className="text-muted-foreground">ID del espacio </span>
            <span className="font-semibold text-violet-800">#{parsedId}</span>
          </div>
        ) : null}
      </div>

      <SpaceForm
        mode={isEdit ? "edit" : "create"}
        initialValues={initialValues}
        existingImages={existingImages}
        isSubmitting={isSubmitting}
        onCancel={goBack}
        onSubmit={async (payload) => {
          if (isEdit && parsedId !== null) {
            await updateMutation.mutateAsync({ id: parsedId, payload })
            return
          }
          await createMutation.mutateAsync(payload)
        }}
        onSaved={goBack}
      />
    </div>
  )
}
