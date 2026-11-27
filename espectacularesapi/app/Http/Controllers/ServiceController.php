<?php

namespace App\Http\Controllers;

use App\Models\Entities\ServiceCatalog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ServiceController extends BaseCrudController
{
    protected function model(): string
    {
        return ServiceCatalog::class;
    }

    protected function rulesStore(Request $request): array
    {
        return [
            'key' => ['nullable', 'string', 'max:50', 'unique:services,key'],
            'name' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:255'],
            'base_price' => ['required', 'numeric', 'min:0'],
            'unit' => ['nullable', 'in:pieza,m2'],
            'tax_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    protected function rulesUpdate(Request $request): array
    {
        $id = $request->route('id') ?? $request->route()[2]['id'] ?? null;

        return [
            'key' => ['sometimes', 'nullable', 'string', 'max:50', "unique:services,key,{$id}"],
            'name' => ['sometimes', 'required', 'string', 'max:150'],
            'description' => ['sometimes', 'nullable', 'string', 'max:255'],
            'base_price' => ['sometimes', 'required', 'numeric', 'min:0'],
            'unit' => ['sometimes', 'nullable', 'in:pieza,m2'],
            'tax_rate' => ['sometimes', 'required', 'numeric', 'min:0', 'max:100'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    protected function applyIndexQuery($query, Request $request)
    {
        if ($request->filled('is_active')) {
            $query->where('is_active', (int) $request->get('is_active'));
        }

        // Unidad de medida: pieza o m2.
        if (in_array($request->get('unit'), ['pieza', 'm2'], true)) {
            $query->where('unit', $request->get('unit'));
        }

        if ($request->filled('q')) {
            $term = trim((string) $request->get('q'));
            $query->where(function ($inner) use ($term) {
                $inner->where('name', 'like', "%{$term}%")
                    ->orWhere('key', 'like', "%{$term}%")
                    ->orWhere('description', 'like', "%{$term}%");
            });
        }

        return $query;
    }

    protected function beforeStore(array $data, Request $request): array
    {
        $data['key'] = $this->nullableTrimmedValue($data['key'] ?? null);
        $data['description'] = $this->nullableTrimmedValue($data['description'] ?? null);
        $data['unit'] = $data['unit'] ?? 'pieza';

        return $data;
    }

    protected function beforeUpdate(array $data, Request $request, Model $model): array
    {
        if (array_key_exists('key', $data)) {
            $data['key'] = $this->nullableTrimmedValue($data['key']);
        }
        if (array_key_exists('description', $data)) {
            $data['description'] = $this->nullableTrimmedValue($data['description']);
        }
        if (array_key_exists('unit', $data) && $data['unit'] === null) {
            $data['unit'] = 'pieza';
        }

        return $data;
    }

    private function nullableTrimmedValue($value): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }

    public function delete($id)
    {
        $service = ServiceCatalog::query()->findOrFail($id);
        $isInUse = Schema::hasTable('quote_items')
            && DB::table('quote_items')->where('service_id', $service->id)->exists();

        if ($isInUse) {
            $service->is_active = false;
            $service->save();

            return response()->json([
                'message' => 'El servicio está utilizado en cotizaciones y fue desactivado para conservar el historial.',
                'data' => $service,
            ]);
        }

        $service->delete();

        return response()->json(['message' => 'Servicio eliminado correctamente.']);
    }
}
