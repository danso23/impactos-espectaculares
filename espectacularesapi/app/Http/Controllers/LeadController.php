<?php

namespace App\Http\Controllers;

use App\Models\Entities\Cliente;
use App\Models\Entities\Lead;
use App\Models\Entities\LeadStatus;
use App\Models\Entities\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class LeadController extends Controller
{
    public function catalogs()
    {
        return response()->json([
            'data' => [
                'statuses' => LeadStatus::query()
                    ->where('is_active', true)
                    ->orderBy('id')
                    ->get(['id', 'key', 'name', 'color', 'is_final']),
                'users' => User::query()
                    ->where('is_active', true)
                    ->orderBy('name')
                    ->orderBy('username')
                    ->get(['id', 'name', 'username', 'email']),
            ],
        ]);
    }

    public function index(Request $request)
    {
        $perPage = max(1, min(100, (int) $request->query('per_page', 15)));
        $q = trim((string) $request->query('q', ''));
        $statusId = $request->query('status_id');
        $assignedTo = $request->query('assigned_to');

        $query = Lead::query()
            ->with(['status', 'assignedUser'])
            ->orderByDesc('created_at')
            ->orderByDesc('id');

        if ($statusId !== null && $statusId !== '') {
            $query->where('lead_status_id', (int) $statusId);
        }

        if ($assignedTo !== null && $assignedTo !== '') {
            $query->where('assigned_to', (int) $assignedTo);
        }

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
                ->map(fn (Lead $lead) => $this->serializeLead($lead))
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
        $validated = $this->validate($request, $this->leadRules());

        if (empty($validated['lead_status_id'])) {
            $validated['lead_status_id'] = LeadStatus::query()
                ->where('key', 'new')
                ->value('id');
        }

        if (empty($validated['assigned_to'])) {
            $validated['assigned_to'] = optional($request->attributes->get('auth_user'))->id;
        }

        $lead = Lead::query()->create($validated);
        $lead->load(['status', 'assignedUser']);

        return response()->json([
            'message' => 'Prospecto creado correctamente.',
            'data' => $this->serializeLead($lead),
        ], 201);
    }

    public function convertToClient($id)
    {
        if (!Schema::hasTable('clientes')) {
            return response()->json([
                'message' => 'La tabla clientes no existe. Ejecuta la migracion correspondiente antes de convertir prospectos.',
            ], 409);
        }

        $lead = Lead::query()->with(['status', 'assignedUser'])->findOrFail($id);

        $cliente = DB::transaction(function () use ($lead) {
            $existing = Cliente::query()->where('lead_id', $lead->id)->first();
            if ($existing) {
                return $existing;
            }

            $cliente = Cliente::query()->create([
                'lead_id' => $lead->id,
                'nombre' => $lead->nombre,
                'apellido_paterno' => $lead->apellido_paterno,
                'apellido_materno' => $lead->apellido_materno,
                'curp' => $lead->curp,
                'rfc' => $lead->rfc,
                'negocio' => $lead->negocio,
                'razon_social' => $lead->razon_social,
                'giro' => $lead->giro,
                'email' => $lead->email,
                'telefono' => $lead->telefono,
                'telefono_2' => $lead->telefono_2,
                'direccion' => $lead->direccion,
                'colonia' => $lead->colonia,
                'ciudad' => $lead->ciudad,
                'estado' => $lead->estado,
                'cp' => $lead->cp,
                'nombre_aval' => $lead->nombre_aval,
                'telefono_aval' => $lead->telefono_aval,
                'direccion_aval' => $lead->direccion_aval,
                'source' => $lead->source,
                'notes' => $lead->notes,
                'usuario' => optional($lead->assignedUser)->username,
            ]);

            $wonStatusId = LeadStatus::query()->where('key', 'won')->value('id');
            if ($wonStatusId) {
                $lead->lead_status_id = $wonStatusId;
                $lead->save();
                $lead->refresh();
                $lead->loadMissing(['status', 'assignedUser']);
            }

            return $cliente;
        });

        return response()->json([
            'message' => 'Prospecto convertido a cliente correctamente.',
            'data' => [
                'lead' => $this->serializeLead($lead),
                'client' => ClientController::serializeClientRow((array) DB::table('clientes')->where('id', $cliente->id)->first()),
            ],
        ]);
    }

    private function leadRules(): array
    {
        return [
            'nombre' => 'required|string|max:100',
            'apellido_paterno' => 'nullable|string|max:100',
            'apellido_materno' => 'nullable|string|max:100',
            'curp' => 'nullable|string|max:18|unique:leads,curp',
            'rfc' => 'nullable|string|max:13|unique:leads,rfc',
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
            'lead_status_id' => 'nullable|exists:lead_status,id',
            'assigned_to' => 'nullable|exists:users,id',
            'source' => 'nullable|string|max:80',
            'priority' => 'nullable|integer|in:1,2,3',
            'notes' => 'nullable|string',
        ];
    }

    private function serializeLead(Lead $lead): array
    {
        $fullName = trim(implode(' ', array_filter([
            $lead->nombre,
            $lead->apellido_paterno,
            $lead->apellido_materno,
        ])));

        return [
            'id' => $lead->id,
            'display_name' => $lead->negocio ?: $lead->razon_social ?: $fullName,
            'full_name' => $fullName,
            'nombre' => $lead->nombre,
            'apellido_paterno' => $lead->apellido_paterno,
            'apellido_materno' => $lead->apellido_materno,
            'curp' => $lead->curp,
            'rfc' => $lead->rfc,
            'negocio' => $lead->negocio,
            'razon_social' => $lead->razon_social,
            'giro' => $lead->giro,
            'email' => $lead->email,
            'telefono' => $lead->telefono,
            'telefono_2' => $lead->telefono_2,
            'direccion' => $lead->direccion,
            'colonia' => $lead->colonia,
            'ciudad' => $lead->ciudad,
            'estado' => $lead->estado,
            'cp' => $lead->cp,
            'nombre_aval' => $lead->nombre_aval,
            'telefono_aval' => $lead->telefono_aval,
            'direccion_aval' => $lead->direccion_aval,
            'source' => $lead->source,
            'priority' => (int) ($lead->priority ?: 2),
            'notes' => $lead->notes,
            'status' => $lead->status ? [
                'id' => $lead->status->id,
                'key' => $lead->status->key,
                'name' => $lead->status->name,
                'color' => $lead->status->color,
                'is_final' => (bool) $lead->status->is_final,
            ] : null,
            'assigned_user' => $lead->assignedUser ? [
                'id' => $lead->assignedUser->id,
                'name' => $lead->assignedUser->name,
                'username' => $lead->assignedUser->username,
                'email' => $lead->assignedUser->email,
            ] : null,
            'created_at' => optional($lead->created_at)->toDateTimeString(),
            'updated_at' => optional($lead->updated_at)->toDateTimeString(),
        ];
    }
}
