<?php

namespace App\Http\Controllers;

use App\Models\Entities\Cliente;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ClientController extends Controller
{
    public function index(Request $request)
    {
        if (!Schema::hasTable('clientes')) {
            return response()->json([
                'message' => 'La tabla clientes no existe. Ejecuta la migracion correspondiente antes de consultar clientes.',
            ], 409);
        }

        $perPage = max(1, min(100, (int) $request->query('per_page', 15)));
        $q = trim((string) $request->query('q', ''));

        $query = DB::table('clientes')
            ->orderByDesc('created_at')
            ->orderByDesc('id');

        if ($q !== '') {
            $query->where(function ($inner) use ($q) {
                $inner->where('nombre', 'like', "%{$q}%")
                    ->orWhere('apellido_paterno', 'like', "%{$q}%")
                    ->orWhere('apellido_materno', 'like', "%{$q}%")
                    ->orWhere('negocio', 'like', "%{$q}%")
                    ->orWhere('razon_social', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%")
                    ->orWhere('telefono', 'like', "%{$q}%")
                    ->orWhere('rfc', 'like', "%{$q}%")
                    ->orWhere('source', 'like', "%{$q}%");
            });
        }

        $page = $query->paginate($perPage);

        return response()->json([
            'data' => collect($page->items())
                ->map(fn ($row) => self::serializeClientRow((array) $row))
                ->values(),
            'meta' => [
                'page' => $page->currentPage(),
                'perPage' => $page->perPage(),
                'total' => $page->total(),
                'totalPages' => $page->lastPage(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        if (!Schema::hasTable('clientes')) {
            return response()->json([
                'message' => 'La tabla clientes no existe. Ejecuta la migracion correspondiente antes de crear clientes.',
            ], 409);
        }

        $validated = $this->validate($request, [
            'nombre' => 'required|string|max:100',
            'apellido_paterno' => 'nullable|string|max:100',
            'apellido_materno' => 'nullable|string|max:100',
            'curp' => 'nullable|string|max:18|unique:clientes,curp',
            'rfc' => 'nullable|string|max:13|unique:clientes,rfc',
            'negocio' => 'nullable|string|max:150',
            'razon_social' => 'nullable|string|max:200',
            'giro' => 'nullable|string|max:150',
            'email' => 'nullable|email|max:150',
            'telefono' => 'nullable|string|max:30',
            'telefono_2' => 'nullable|string|max:30',
            'direccion' => 'nullable|string|max:255',
            'colonia' => 'nullable|string|max:120',
            'ciudad' => 'nullable|string|max:120',
            'estado' => 'nullable|string|max:120',
            'cp' => 'nullable|string|max:10',
            'nombre_aval' => 'nullable|string|max:150',
            'telefono_aval' => 'nullable|string|max:30',
            'direccion_aval' => 'nullable|string|max:255',
            'source' => 'nullable|string|max:80',
            'notes' => 'nullable|string',
        ]);

        $validated['usuario'] = optional($request->attributes->get('auth_user'))->username;

        $client = Cliente::query()->create($validated);

        return response()->json([
            'message' => 'Cliente creado correctamente.',
            'data' => self::serializeClientRow((array) DB::table('clientes')->where('id', $client->id)->first()),
        ], 201);
    }

    public static function serializeClientRow(array $row): array
    {
        $fullName = trim(implode(' ', array_filter([
            $row['nombre'] ?? null,
            $row['apellido_paterno'] ?? null,
            $row['apellido_materno'] ?? null,
        ])));

        return [
            'id' => $row['id'],
            'lead_id' => $row['lead_id'] ?? null,
            'display_name' => ($row['negocio'] ?? null) ?: ($row['razon_social'] ?? null) ?: $fullName,
            'full_name' => $fullName,
            'nombre' => $row['nombre'] ?? null,
            'apellido_paterno' => $row['apellido_paterno'] ?? null,
            'apellido_materno' => $row['apellido_materno'] ?? null,
            'curp' => $row['curp'] ?? null,
            'rfc' => $row['rfc'] ?? null,
            'negocio' => $row['negocio'] ?? null,
            'razon_social' => $row['razon_social'] ?? null,
            'giro' => $row['giro'] ?? null,
            'email' => $row['email'] ?? null,
            'telefono' => $row['telefono'] ?? null,
            'telefono_2' => $row['telefono_2'] ?? null,
            'direccion' => $row['direccion'] ?? null,
            'colonia' => $row['colonia'] ?? null,
            'ciudad' => $row['ciudad'] ?? null,
            'estado' => $row['estado'] ?? null,
            'cp' => $row['cp'] ?? null,
            'nombre_aval' => $row['nombre_aval'] ?? null,
            'telefono_aval' => $row['telefono_aval'] ?? null,
            'direccion_aval' => $row['direccion_aval'] ?? null,
            'source' => $row['source'] ?? null,
            'notes' => $row['notes'] ?? null,
            'usuario' => $row['usuario'] ?? null,
            'created_at' => $row['created_at'] ?? null,
            'updated_at' => $row['updated_at'] ?? null,
        ];
    }
}
