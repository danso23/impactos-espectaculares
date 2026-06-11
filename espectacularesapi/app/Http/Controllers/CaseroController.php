<?php

namespace App\Http\Controllers;

use App\Models\Entities\Casero;
use Illuminate\Http\Request;

class CaseroController extends BaseCrudController
{
    protected function model(): string
    {
        return Casero::class;
    }

    protected function rulesStore(Request $request): array
    {
        return [
            'nombre'           => ['required', 'string', 'max:100'],
            'apellido_paterno' => ['nullable', 'string', 'max:100'],
            'apellido_materno' => ['nullable', 'string', 'max:100'],
            'telefono'         => ['nullable', 'string', 'max:30'],
            'telefono_2'       => ['nullable', 'string', 'max:30'],
            'email'            => ['nullable', 'email', 'max:150'],
            'rfc'              => ['nullable', 'string', 'max:13', 'unique:caseros,rfc'],
            'curp'             => ['nullable', 'string', 'max:18', 'unique:caseros,curp'],
            'direccion'        => ['nullable', 'string', 'max:255'],
            'colonia'          => ['nullable', 'string', 'max:120'],
            'ciudad'           => ['nullable', 'string', 'max:120'],
            'estado'           => ['nullable', 'string', 'max:120'],
            'cp'               => ['nullable', 'string', 'max:10'],
            'monto_renta'      => ['nullable', 'numeric', 'min:0'],
            'periodicidad'     => ['nullable', 'string', 'max:50'],
            'metodo_pago'      => ['nullable', 'string', 'max:50'],
            'banco'            => ['nullable', 'string', 'max:80'],
            'cuenta_banco'     => ['nullable', 'string', 'max:30'],
            'clabe'            => ['nullable', 'string', 'max:18'],
            'notes'            => ['nullable', 'string'],
            'active'           => ['nullable', 'boolean'],
        ];
    }

    protected function rulesUpdate(Request $request): array
    {
        $id = $request->route('id') ?? $request->route()[2]['id'] ?? null;

        return [
            'nombre'           => ['sometimes', 'required', 'string', 'max:100'],
            'apellido_paterno' => ['sometimes', 'nullable', 'string', 'max:100'],
            'apellido_materno' => ['sometimes', 'nullable', 'string', 'max:100'],
            'telefono'         => ['sometimes', 'nullable', 'string', 'max:30'],
            'telefono_2'       => ['sometimes', 'nullable', 'string', 'max:30'],
            'email'            => ['sometimes', 'nullable', 'email', 'max:150'],
            'rfc'              => ['sometimes', 'nullable', 'string', 'max:13', "unique:caseros,rfc,{$id}"],
            'curp'             => ['sometimes', 'nullable', 'string', 'max:18', "unique:caseros,curp,{$id}"],
            'direccion'        => ['sometimes', 'nullable', 'string', 'max:255'],
            'colonia'          => ['sometimes', 'nullable', 'string', 'max:120'],
            'ciudad'           => ['sometimes', 'nullable', 'string', 'max:120'],
            'estado'           => ['sometimes', 'nullable', 'string', 'max:120'],
            'cp'               => ['sometimes', 'nullable', 'string', 'max:10'],
            'monto_renta'      => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'periodicidad'     => ['sometimes', 'nullable', 'string', 'max:50'],
            'metodo_pago'      => ['sometimes', 'nullable', 'string', 'max:50'],
            'banco'            => ['sometimes', 'nullable', 'string', 'max:80'],
            'cuenta_banco'     => ['sometimes', 'nullable', 'string', 'max:30'],
            'clabe'            => ['sometimes', 'nullable', 'string', 'max:18'],
            'notes'            => ['sometimes', 'nullable', 'string'],
            'active'           => ['sometimes', 'nullable', 'boolean'],
        ];
    }

    /**
     * Override para personalizar la búsqueda en campos del casero.
     */
    protected function applyIndexQuery($query, Request $request)
    {
        // Filtro activo/inactivo
        if ($request->filled('active')) {
            $query->where('active', (int) $request->get('active'));
        }

        // Búsqueda general
        if ($request->filled('q')) {
            $term = $request->get('q');
            $query->where(function ($qq) use ($term) {
                $qq->where('nombre', 'like', "%{$term}%")
                   ->orWhere('apellido_paterno', 'like', "%{$term}%")
                   ->orWhere('apellido_materno', 'like', "%{$term}%")
                   ->orWhere('telefono', 'like', "%{$term}%")
                   ->orWhere('email', 'like', "%{$term}%")
                   ->orWhere('rfc', 'like', "%{$term}%")
                   ->orWhere('ciudad', 'like', "%{$term}%")
                   ->orWhere('banco', 'like', "%{$term}%");
            });
        }

        return $query;
    }
}
