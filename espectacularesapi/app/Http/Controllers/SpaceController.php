<?php

namespace App\Http\Controllers;

use App\Models\Entities\Space;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Carbon;

class SpaceController extends BaseCrudController
{
    protected function model(): string
    {
        return Space::class;
    }

    protected function applyIndexQuery($query, Request $request)
    {
        $activeFilter = $request->filled('active') ? (int) $request->get('active') : null;

        if ($activeFilter !== null) {
            $request->query->remove('active');
        }

        $query = parent::applyIndexQuery($query, $request);

        if ($activeFilter !== null) {
            $request->query->set('active', $activeFilter);
            $activeFilter === 1
                ? $query->currentlyAvailable()
                : $query->currentlyBlocked();
        }

        return $query;
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
            'blocked_from'          => ['nullable', 'date_format:Y-m-d', 'required_if:active,0'],
            'blocked_until'         => ['nullable', 'date_format:Y-m-d', 'after_or_equal:blocked_from', 'required_if:active,0'],
            'faces'                 => ['required', 'numeric', 'min:0'],
            'has_lights'            => ['required', 'boolean'],
            'view_type'             => ['nullable', 'string', 'max:255'],
            'assigned_id'           => ['nullable', 'string', 'max:50'],

            // imágenes
            'images'                => ['nullable', 'array', 'max:10'],
            'images.*'              => ['file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:15360'],
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
            'blocked_from'          => ['sometimes', 'nullable', 'date_format:Y-m-d', 'required_if:active,0'],
            'blocked_until'         => ['sometimes', 'nullable', 'date_format:Y-m-d', 'after_or_equal:blocked_from', 'required_if:active,0'],
            'faces'                 => ['sometimes', 'nullable', 'integer', 'min:0'],
            'has_lights'            => ['sometimes', 'nullable', 'boolean'],
            'view_type'             => ['sometimes', 'nullable', 'string', 'max:255'],
            'assigned_id'           => ['sometimes', 'nullable', 'string', 'max:50'],

            // mágenes (en update las agregamos)
            'images' => ['sometimes', 'nullable', 'array', 'max:10'],
            'images.*' => ['file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:15360'],
            'remove_image_ids' => ['sometimes', 'array'],
            'remove_image_ids.*' => ['integer', 'distinct'],
            'image_order_ids' => ['sometimes', 'array', 'max:10'],
            'image_order_ids.*' => ['integer', 'distinct'],
        ];
    }

    protected function beforeStore(array $data, Request $request): array
    {
        if (filter_var($data['active'] ?? true, FILTER_VALIDATE_BOOLEAN)) {
            $data['blocked_from'] = null;
            $data['blocked_until'] = null;
        }

        return $data;
    }

    protected function beforeUpdate(array $data, Request $request, \Illuminate\Database\Eloquent\Model $model): array
    {
        if (
            array_key_exists('active', $data) &&
            filter_var($data['active'], FILTER_VALIDATE_BOOLEAN)
        ) {
            $data['blocked_from'] = null;
            $data['blocked_until'] = null;
        }

        return $data;
    }

    // --- override store ---
    public function index(Request $request)
    {
        $q = Space::query()
            ->select('spaces.*')
            ->withBlockStatus()
            ->with('images');

        $q = $this->applyIndexQuery($q, $request);
        $q = $this->indexOrder($q, $request);

        $perPage = (int) $request->get('perPage', $request->get('per_page', 10));
        $page = (int) $request->get('page', 1);

        $items = $q->paginate($perPage, ['*'], 'page', $page);

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

    public function find($id)
    {
        $space = Space::query()
            ->select('spaces.*')
            ->withBlockStatus()
            ->with('images')
            ->findOrFail($id);

        return response()->json([
            'data' => $space,
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

        $removeImageIds = collect($data['remove_image_ids'] ?? [])
            ->map(fn ($imageId) => (int) $imageId)
            ->unique()
            ->values();
        $imageOrderIds = collect($data['image_order_ids'] ?? [])
            ->map(fn ($imageId) => (int) $imageId)
            ->unique()
            ->values()
            ->all();
        unset($data['remove_image_ids'], $data['image_order_ids'], $data['images']);

        $remainingImageCount = $space->images()
            ->when($removeImageIds->isNotEmpty(), fn ($query) => $query->whereNotIn('id', $removeImageIds))
            ->count();
        $newImages = $request->file('images', []);
        $newImageCount = is_array($newImages) ? count($newImages) : ($newImages ? 1 : 0);

        if ($remainingImageCount + $newImageCount > 10) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => ['images' => ['El espacio puede tener como máximo 10 imágenes.']],
            ], 422);
        }

        $space->update($data);

        $this->removeImagesFromSpace($space, $removeImageIds->all());

        // agregar imágenes nuevas
        $this->storeImagesForSpace($space, $request);
        if ($request->has('image_order_ids')) {
            $this->applyImageOrder($space, $imageOrderIds);
        } else {
            $this->ensureImageCover($space);
        }

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

    private function removeImagesFromSpace(Space $space, array $imageIds): void
    {
        if (empty($imageIds)) return;

        $images = $space->images()->whereIn('id', $imageIds)->get();

        foreach ($images as $image) {
            Storage::disk('public')->delete($image->path);
            $image->delete();
        }
    }

    private function ensureImageCover(Space $space): void
    {
        $images = $space->images()->orderBy('position')->orderBy('id')->get();
        if ($images->isEmpty() || $images->contains(fn ($image) => (bool) $image->is_cover)) return;

        $images->first()->update(['is_cover' => true]);
    }

    private function applyImageOrder(Space $space, array $requestedImageIds): void
    {
        $images = $space->images()->orderBy('position')->orderBy('id')->get();
        $imagesById = $images->keyBy('id');
        $ordered = collect($requestedImageIds)
            ->map(fn ($imageId) => $imagesById->get((int) $imageId))
            ->filter();

        $listedIds = $ordered->pluck('id');
        $ordered = $ordered
            ->concat($images->whereNotIn('id', $listedIds))
            ->values();

        foreach ($ordered as $index => $image) {
            $image->update([
                'position' => $index + 1,
                'is_cover' => $index === 0,
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
            $q->currentlyAvailable();
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
        $contents = $this->orientedImageContents($absolutePath, $mimeType);

        return response($contents ?? file_get_contents($absolutePath), 200, [
            'Content-Type' => $mimeType,
            'Cache-Control' => 'private, max-age=300',
        ]);
    }

    private function orientedImageContents(string $path, string $mimeType): ?string
    {
        if ($mimeType !== 'image/jpeg' || !function_exists('exif_read_data') || !function_exists('imagecreatefromjpeg')) {
            return null;
        }

        $orientation = (int) ((@exif_read_data($path)['Orientation'] ?? 1));
        if ($orientation === 1) return null;

        $image = @imagecreatefromjpeg($path);
        if (!$image) return null;

        if (in_array($orientation, [2, 4, 5, 7], true) && function_exists('imageflip')) {
            imageflip($image, IMG_FLIP_HORIZONTAL);
        }

        $degrees = match ($orientation) {
            3, 4 => 180,
            5, 6 => -90,
            7, 8 => 90,
            default => 0,
        };

        if ($degrees !== 0) {
            $rotated = imagerotate($image, $degrees, 0);
            if ($rotated !== false) {
                imagedestroy($image);
                $image = $rotated;
            }
        }

        ob_start();
        imagejpeg($image, null, 90);
        $contents = ob_get_clean();
        imagedestroy($image);

        return is_string($contents) ? $contents : null;
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
