<?php

namespace App\Http\Controllers;

use App\Models\Entities\Space;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Carbon;

class SpaceController extends BaseCrudController
{
    protected function model(): string
    {
        return Space::class;
    }

    protected function rulesStore(Request $request): array
    {
        return [
            'title'                 => ['required', 'string', 'max:255'],
            'price'                 => ['nullable', 'numeric', 'min:0'],
            'type'                  => ['nullable', 'string', 'max:50'],
            'socioeconomic_level'   => ['nullable', 'string', 'max:50'],
            'width_m'               => ['nullable', 'numeric', 'min:0'],
            'height_m'              => ['nullable', 'numeric', 'min:0'],
            'description'           => ['nullable', 'string'],
            'comments'              => ['nullable', 'string'],
            'latitude'              => ['nullable', 'numeric', 'between:-90,90'],
            'longitude'             => ['nullable', 'numeric', 'between:-180,180'],
            'active'                => ['nullable', 'boolean'],
            'faces'                 => ['required', 'numeric', 'min:0'],
            'has_lights'            => ['required', 'boolean'],
            'view_type'             => ['nullable', 'string', 'max:255'],
            'assigned_id'           => ['nullable', 'string', 'max:50'],

            // imágenes
            'images'                => ['nullable', 'array', 'max:10'],
            'images.*'              => ['file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ];
    }

    protected function rulesUpdate(Request $request): array
    {
        return [
            'title'                 => ['sometimes', 'required', 'string', 'max:255'],
            'price'                 => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'type'                  => ['sometimes', 'nullable', 'string', 'max:50'],
            'socioeconomic_level'   => ['sometimes', 'nullable', 'string', 'max:50'],
            'width_m'               => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'height_m'              => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'description'           => ['sometimes', 'nullable', 'string'],
            'comments'              => ['sometimes', 'nullable', 'string'],
            'latitude'              => ['sometimes', 'nullable', 'numeric', 'between:-90,90'],
            'longitude'             => ['sometimes', 'nullable', 'numeric', 'between:-180,180'],
            'active'                => ['sometimes', 'nullable', 'boolean'],
            'faces'                 => ['sometimes', 'nullable', 'integer', 'min:0'],
            'has_lights'            => ['sometimes', 'nullable', 'boolean'],
            'view_type'             => ['sometimes', 'nullable', 'string', 'max:255'],
            'assigned_id'           => ['sometimes', 'nullable', 'string', 'max:50'],

            // mágenes (en update las agregamos)
            'images' => ['sometimes', 'nullable', 'array', 'max:10'],
            'images.*' => ['file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ];
    }

    // --- override store ---
    public function index(Request $request)
    {
        $q = Space::query()->with('images');

        $q = $this->applyIndexQuery($q, $request);
        $q = $this->indexOrder($q, $request);

        $perPage = (int) $request->get('perPage', $request->get('per_page', 10));
        $page = (int) $request->get('page', 1);

        $items = $q->select($this->indexSelect())->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'data' => $items->items(),
            'meta' => [
                'page' => $items->currentPage(),
                'perPage' => $items->perPage(),
                'total' => $items->total(),
                'totalPages' => $items->lastPage(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), $this->rulesStore($request));
        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }
        $data = $validator->validated();
        $data = $this->beforeStore($data, $request);

        /** @var Space $space */
        $space = Space::create($data);

        // guardar imágenes por space
        $this->storeImagesForSpace($space, $request);

        return response()->json([
            'message' => 'Creado correctamente',
            'data' => $space->fresh('images'),
        ], 201);
    }

    // --- override update ---
    public function update(Request $request, $id)
    {
        /** @var Space $space */
        $space = Space::findOrFail($id);

        $validator = Validator::make($request->all(), $this->rulesUpdate($request));
        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }
        $data = $validator->validated();
        $data = $this->beforeUpdate($data, $request, $space);

        $space->update($data);

        // agregar imágenes nuevas
        $this->storeImagesForSpace($space, $request);

        return response()->json([
            'message' => 'Actualizado correctamente',
            'data' => $space->fresh('images'),
        ]);
    }

    // --- helper: guardar en carpetas por espectacular ---
    private function storeImagesForSpace(Space $space, Request $request): void
    {
        if (!$request->hasFile('images')) return;


        $files = $request->file('images');
        $files = is_array($files) ? $files : [$files];


        $position = $space->images()->max('position') ?? 0;
        $hasCover = $space->images()->exists();


        foreach ($files as $file) {
            $ext = strtolower($file->getClientOriginalExtension() ?: $file->extension() ?: 'jpg');
            $name = Carbon::now()->format('Ymd_His') . '_' . Str::random(12) . '.' . $ext;

            $path = $file->storeAs("spaces/{$space->id}/original", $name, "public");
            $space->images()->create([
                'path' => $path,
                'filename' => $name,
                'position' => ++$position,
                'is_cover' => !$hasCover && $position === 1,
            ]);
        }
    }

    /**
     * GET /api/spaces/coords
     * Regresa solo coordenadas para mapa/heatmap (ligero)
     */
    public function coords(Request $request)
    {
        $q = Space::query();

        // Opcional: solo activos (por default true)
        $onlyActive = $request->query('active', '1'); // '1'|'0'
        if ($onlyActive === '1' || $onlyActive === 1 || $onlyActive === true || $onlyActive === 'true') {
            $q->where(function ($qq) {
                $qq->whereNull('active')->orWhere('active', true);
            });
        }

        $data = $q->select(['id', 'title', 'latitude', 'longitude', 'active'])
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'data' => $data,
        ]);
    }

    public function image($spaceId, $imageId)
    {
        /** @var Space $space */
        $space = Space::findOrFail($spaceId);
        $image = $space->images()->where('space_images.id', $imageId)->firstOrFail();

        $absolutePath = storage_path('app/public/' . ltrim($image->path, '/'));
        if (!is_file($absolutePath)) {
            return response()->json([
                'message' => 'Imagen no encontrada',
            ], 404);
        }

        $mimeType = mime_content_type($absolutePath) ?: 'application/octet-stream';

        return response(file_get_contents($absolutePath), 200, [
            'Content-Type' => $mimeType,
            'Content-Length' => (string) filesize($absolutePath),
            'Cache-Control' => 'private, max-age=300',
        ]);
    }

    public function delete($id)
    {
        $space = Space::findOrFail($id);

        $isUsedInQuotes = DB::table('quote_items')->where('space_id', $space->id)->exists();
        $isUsedInRentals = DB::table('rental_items')->where('space_id', $space->id)->exists();

        if ($isUsedInQuotes || $isUsedInRentals) {
            return response()->json([
                'message' => 'No se puede eliminar porque el espacio ya está usado en cotizaciones o rentas.',
            ], 409);
        }

        return parent::delete($id);
    }
}
