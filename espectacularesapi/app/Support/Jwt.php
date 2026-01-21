<?php

namespace App\Http\Controllers;

use App\Models\Entities\User;
use App\Models\Entities\RefreshToken;
use App\Support\Jwt;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    private function makeAccessToken(User $user): array
    {
        $ttlMin = (int) env('ACCESS_TTL_MINUTES', 15);
        $secret = env('JWT_SECRET');

        $now = time();
        $payload = [
            'sub' => $user->id,
            'email' => $user->email,
            'iat' => $now,
            'exp' => $now + ($ttlMin * 60),
        ];

        return [
            'access_token' => Jwt::sign($payload, $secret),
            'expires_in' => $ttlMin * 60,
        ];
    }

    private function makeRefreshToken(User $user): array
    {
        $days = (int) env('REFRESH_TTL_DAYS', 30);
        $plain = Str::random(64); // refresh token real (NO se guarda en DB)
        $hash = hash('sha256', $plain);

        RefreshToken::create([
            'user_id' => $user->id,
            'token_hash' => $hash,
            'expires_at' => Carbon::now()->addDays($days),
        ]);

        return [
            'refresh_token' => $plain,
            'refresh_expires_in' => Carbon::now()->addDays($days)->timestamp,
        ];
    }

    // Login: devuelve access + refresh
    public function login(Request $request)
    {
        $this->validate($request, [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->input('email'))->first();
        if (!$user || !password_verify($request->input('password'), $user->password)) {
            return response()->json(['success' => false, 'message' => 'Credenciales inválidas'], 401);
        }

        $access = $this->makeAccessToken($user);
        $refresh = $this->makeRefreshToken($user);

        return response()->json([
            'success' => true,
            ...$access,
            ...$refresh,
            'token_type' => 'Bearer',
            'user' => ['id' => $user->id, 'email' => $user->email],
        ]);
    }

    // Refresh: rota refresh token y genera access nuevo
    public function refresh(Request $request)
    {
        $this->validate($request, [
            'refresh_token' => 'required|string',
        ]);

        $plain = $request->input('refresh_token');
        $hash = hash('sha256', $plain);

        $stored = RefreshToken::where('token_hash', $hash)->first();
        if (!$stored) {
            return response()->json(['success' => false, 'message' => 'Refresh token inválido'], 401);
        }

        // Revocado o expirado
        if ($stored->revoked_at !== null) {
            return response()->json(['success' => false, 'message' => 'Refresh token revocado'], 401);
        }
        if (Carbon::parse($stored->expires_at)->isPast()) {
            return response()->json(['success' => false, 'message' => 'Refresh token expirado'], 401);
        }

        $user = User::find($stored->user_id);
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Usuario no encontrado'], 401);
        }

        // Rotación: revoca el viejo y crea uno nuevo
        $newPlain = Str::random(64);
        $newHash = hash('sha256', $newPlain);
        $days = (int) env('REFRESH_TTL_DAYS', 30);

        RefreshToken::create([
            'user_id' => $user->id,
            'token_hash' => $newHash,
            'expires_at' => Carbon::now()->addDays($days),
        ]);

        $stored->revoked_at = Carbon::now();
        $stored->replaced_by_hash = $newHash;
        $stored->save();

        $access = $this->makeAccessToken($user);

        return response()->json([
            'success' => true,
            ...$access,
            'refresh_token' => $newPlain,
            'token_type' => 'Bearer',
        ]);
    }

    // logout: revoca refresh token actual
    public function logout(Request $request)
    {
        $this->validate($request, [
            'refresh_token' => 'required|string',
        ]);

        $hash = hash('sha256', $request->input('refresh_token'));
        $stored = RefreshToken::where('token_hash', $hash)->first();
        if ($stored && $stored->revoked_at === null) {
            $stored->revoked_at = Carbon::now();
            $stored->save();
        }

        return response()->json(['success' => true]);
    }
}