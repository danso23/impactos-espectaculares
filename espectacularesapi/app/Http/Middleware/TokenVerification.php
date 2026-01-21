<?php

namespace App\Http\Middleware;

use Closure;
use App\Models\Entities\User;

class TokenVerification
{
    public function handle($request, Closure $next, $guard = null)
    {
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

        $user = User::where('api_token', $token)->first();

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

        // Expiración (30 min)
        $now = new \DateTime(date('Y-m-d H:i:s'));
        $created = new \DateTime($user->create_token);
        $interval = $now->diff($created);

        $totalMinutos = ($interval->d * 24 * 60) + ($interval->h * 60) + $interval->i;

        if ($totalMinutos > 30) {
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