<?php

namespace App\Http\Controllers;

use App\Models\Entities\Space;
use App\Models\Entities\SpaceCatalogShare;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;

class SpaceCatalogShareController extends Controller
{
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'space_ids' => ['required', 'array', 'min:1', 'max:100'],
            'space_ids.*' => ['required', 'integer', 'distinct', 'exists:spaces,id'],
            'expires_in_hours' => ['sometimes', 'integer', 'min:1', 'max:8760'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();
        $spaceIds = collect($data['space_ids'])->map(fn ($id) => (int) $id)->values();
        $spacesById = Space::query()
            ->select('spaces.*')
            ->withBlockStatus()
            ->with('images')
            ->whereIn('id', $spaceIds->all())
            ->get()
            ->keyBy('id');

        $snapshot = $spaceIds
            ->map(fn ($id) => optional($spacesById->get($id))->toArray())
            ->filter()
            ->values()
            ->all();

        $expiresAt = Carbon::now()->addHours((int) ($data['expires_in_hours'] ?? 48));
        $user = $request->attributes->get('auth_user');

        $share = SpaceCatalogShare::create([
            'token' => Str::random(40),
            'created_by' => optional($user)->id,
            'snapshot' => $snapshot,
            'expires_at' => $expiresAt,
        ]);

        $frontendBaseUrl = rtrim(
            $request->headers->get('origin') ?: env('FRONTEND_URL', env('APP_URL')),
            '/'
        );

        return response()->json([
            'message' => 'Catálogo compartible creado correctamente.',
            'data' => [
                'token' => $share->token,
                'url' => $frontendBaseUrl . '/catalogo/' . $share->token,
                'expires_at' => $share->expires_at->toIso8601String(),
            ],
        ], 201);
    }

    public function show($token)
    {
        $share = SpaceCatalogShare::query()->where('token', $token)->first();

        if (!$share) {
            return response()->json([
                'message' => 'Este enlace no está disponible.',
            ], 404);
        }

        if ($share->expires_at->isPast()) {
            return response()->json([
                'message' => 'Este enlace ya expiró.',
            ], 410);
        }

        return response()->json([
            'data' => [
                'spaces' => $share->snapshot,
                'created_at' => $share->created_at->toIso8601String(),
                'expires_at' => $share->expires_at->toIso8601String(),
            ],
        ]);
    }
}
