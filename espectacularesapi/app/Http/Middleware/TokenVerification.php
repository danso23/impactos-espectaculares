<?php

namespace App\Http\Middleware;

use Closure;
use App\Models\Entities\User;

class TokenVerification
{
    public function handle($request, Closure $next, $guard = null)
    {
        $ttlMinutes = max(1, (int) env('ACCESS_TTL_MINUTES', 30));
        $token = null;

        // 1) Prioridad: Authorization: Bearer <token>
        $authHeader = $request->header('Authorization');
        if ($authHeader && preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            $token = $matches[1];
        }

        // 2) Fallback legacy: X-Requested-With: <token>
        if (!$token) {
            $token = $request->header('X-Requested-With');
        }

        if (!$token) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: token header not found',
            ], 401);
        }

        $user = User::query()
            ->select('users.*')
            ->selectRaw('TIMESTAMPDIFF(MINUTE, create_token, CURRENT_TIMESTAMP) as token_age_minutes')
            ->where('api_token', $token)
            ->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: token not found',
            ], 401);
        }

        // Si create_token es null, forzamos re-login
        if (empty($user->create_token)) {
            return response()->json([
                'success' => false,
                'message' => 'Please login again',
                'errors'  => url() . "/api/login",
            ], 401);
        }

        // La expiración se calcula en la DB para evitar falsos vencimientos
        // cuando PHP y MySQL tienen zonas horarias distintas.
        $tokenAgeMinutes = (int) ($user->token_age_minutes ?? 0);

        if ($tokenAgeMinutes > $ttlMinutes) {
            $user->api_token = null;
            $user->create_token = null;
            $user->save();

            return response()->json([
                'success' => false,
                'message' => 'Please login again',
                'errors'  => url() . "/api/login",
            ], 401);
        }

        // Inyecta el usuario para usarlo en controllers/rutas
        $request->attributes->set('auth_user', $user);

        return $next($request);
    }
}
