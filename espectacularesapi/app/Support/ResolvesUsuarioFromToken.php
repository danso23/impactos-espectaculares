<?php
namespace App\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

trait ResolvesUsuarioFromToken
{
    protected function resolveUsuarioFromToken(Request $request): ?string
    {
        $token = $request->header('X-Requested-With');
        if (!$token) return null;

        $u = DB::table('users as u')
            ->where('u.api_token', $token)
            ->select('u.username')
            ->first();

        return $u ? ($u->username  ?? null) : null;
    }
}