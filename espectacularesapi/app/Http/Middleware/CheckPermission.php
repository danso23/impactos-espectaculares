<?php

namespace App\Http\Middleware;

use Closure;

class CheckPermission
{
    public function handle($request, Closure $next, $permission)
    {
        $user = $request->attributes->get('auth_user');

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no autenticado.',
            ], 401);
        }

        $isAdmin = strtolower((string) $user->role) === 'admin'
            || $user->getRoleNames()->contains(function ($role) {
                return strtolower($role) === 'admin';
            });

        if (!$isAdmin && !$user->hasPermissionTo($permission)) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permiso para realizar esta acción.',
                'permission' => $permission,
            ], 403);
        }

        return $next($request);
    }
}
