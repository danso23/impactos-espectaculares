<?php

namespace App\Http\Controllers;

use App\Models\Entities\Space;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Model;

class SpaceController extends BaseCrudController
{
    protected function model(): string
    {
        return Space::class;
    }

    protected function rulesStore(Request $request): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'type' => ['nullable', 'string', 'max:50'],
            'socioeconomic_level' => ['nullable', 'string', 'max:50'],
            'width_m' => ['nullable', 'numeric', 'min:0'],
            'height_m' => ['nullable', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
            'comments' => ['nullable', 'string'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'active' => ['nullable', 'boolean'],
        ];
    }

    protected function rulesUpdate(Request $request): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'price' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'type' => ['sometimes', 'nullable', 'string', 'max:50'],
            'socioeconomic_level' => ['sometimes', 'nullable', 'string', 'max:50'],
            'width_m' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'height_m' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'description' => ['sometimes', 'nullable', 'string'],
            'comments' => ['sometimes', 'nullable', 'string'],
            'latitude' => ['sometimes', 'nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['sometimes', 'nullable', 'numeric', 'between:-180,180'],
            'active' => ['sometimes', 'nullable', 'boolean'],
        ];
    }

    // filtros/búsqueda/paginación específicos del Space
    protected function applyIndexQuery($q, Request $request)
    {
        if ($request->filled('active')) {
            $q->where('active', filter_var($request->active, FILTER_VALIDATE_BOOLEAN));
        }
        if ($request->filled('type')) {
            $q->where('type', $request->type);
        }
        if ($request->filled('dateFrom')) {
            $q->whereDate('created_at', '>=', $request->dateFrom);
        }
        if ($request->filled('dateTo')) {
            $q->whereDate('created_at', '<=', $request->dateTo);
        }
        if ($request->filled('search')) {
            $s = $request->search;
            $q->where(function ($qq) use ($s) {
                $qq->where('title', 'like', "%{$s}%")
                   ->orWhere('description', 'like', "%{$s}%")
                   ->orWhere('comments', 'like', "%{$s}%");
            });
        }

        return $q;
    }

    // hooks para validar lat/lng
    protected function beforeStore(array $data, Request $request): array
    {
        $this->validateLatLngPair($data);
        return $data;
    }

    protected function beforeUpdate(array $data, Request $request, Model $model): array
    {
        $hasLat = array_key_exists('latitude', $data);
        $hasLng = array_key_exists('longitude', $data);
        if ($hasLat xor $hasLng) {
            abort(response()->json([
                'message' => 'latitude y longitude deben enviarse juntas (ambas o ninguna).'
            ], 422));
        }

        if ($hasLat && $hasLng) {
            $this->validateLatLngPair($data);
        }

        return $data;
    }

    private function validateLatLngPair(array $data): void
    {
        if (($data['latitude'] ?? null) !== null && ($data['longitude'] ?? null) === null) {
            abort(response()->json(['message' => 'longitude es requerida si latitude viene.'], 422));
        }
        if (($data['longitude'] ?? null) !== null && ($data['latitude'] ?? null) === null) {
            abort(response()->json(['message' => 'latitude es requerida si longitude viene.'], 422));
        }
    }

    /**
     * GET /api/spaces/coords
     * Obtener solo coordenadas (mapa / heatmap)
     */
    public function coords(Request $request)
    {
        $q = Space::query()->whereNotNull('latitude')->whereNotNull('longitude');

        if ($request->filled('active')) {
            $q->where('active', filter_var($request->active, FILTER_VALIDATE_BOOLEAN));
        }
        if ($request->filled('type')) {
            $q->where('type', $request->type);
        }

        $coords = $q->get(['id','title','type','active','latitude','longitude']);

        return response()->json(['data' => $coords]);
    }
}