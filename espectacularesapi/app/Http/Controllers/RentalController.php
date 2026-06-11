<?php

namespace App\Http\Controllers;

use App\Models\Entities\Rental;
use Illuminate\Http\Request;

class RentalController extends BaseCrudController
{
    protected function model(): string
    {
        return Rental::class;
    }

    protected function rulesStore(Request $request): array
    {
        return [
            'quote_id' => ['nullable', 'integer', 'exists:quotes,id', 'unique:rentals,quote_id'],
            'customer_type' => ['nullable', 'in:lead,cliente,sin_cliente'],
            'customer_id' => ['nullable', 'integer'],
            'agency_id' => ['nullable', 'integer', 'exists:agencies,id'],
            'issuer_company_id' => ['nullable', 'integer', 'exists:companies,id'],
            'created_by' => ['nullable', 'integer', 'exists:users,id'],
            'status' => ['nullable', 'in:draft,active,completed,cancelled'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date'],
            'subtotal' => ['nullable', 'numeric', 'min:0'],
            'tax' => ['nullable', 'numeric', 'min:0'],
            'total' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'snapshot_json' => ['nullable'],
        ];
    }

    protected function rulesUpdate(Request $request): array
    {
        $id = $request->route('id') ?? $request->route()[2]['id'] ?? null;

        return [
            'quote_id' => ['sometimes', 'nullable', 'integer', 'exists:quotes,id', "unique:rentals,quote_id,{$id}"],
            'customer_type' => ['sometimes', 'nullable', 'in:lead,cliente,sin_cliente'],
            'customer_id' => ['sometimes', 'nullable', 'integer'],
            'agency_id' => ['sometimes', 'nullable', 'integer', 'exists:agencies,id'],
            'issuer_company_id' => ['sometimes', 'nullable', 'integer', 'exists:companies,id'],
            'created_by' => ['sometimes', 'nullable', 'integer', 'exists:users,id'],
            'status' => ['sometimes', 'nullable', 'in:draft,active,completed,cancelled'],
            'starts_at' => ['sometimes', 'nullable', 'date'],
            'ends_at' => ['sometimes', 'nullable', 'date'],
            'subtotal' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'tax' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'total' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'notes' => ['sometimes', 'nullable', 'string'],
            'snapshot_json' => ['sometimes', 'nullable'],
        ];
    }

    protected function applyIndexQuery($query, Request $request)
    {
        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }

        if ($request->filled('customer_type')) {
            $query->where('customer_type', $request->get('customer_type'));
        }

        if ($request->filled('q')) {
            $term = $request->get('q');
            $query->where(function ($inner) use ($term) {
                $inner->where('notes', 'like', "%{$term}%")
                    ->orWhere('status', 'like', "%{$term}%")
                    ->orWhere('customer_type', 'like', "%{$term}%")
                    ->orWhere('quote_id', 'like', "%{$term}%");
            });
        }

        return $query;
    }
}
