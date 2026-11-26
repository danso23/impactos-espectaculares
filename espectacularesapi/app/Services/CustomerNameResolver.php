<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

/**
 * Nombre visible de un lead o cliente (negocio, razón social o nombre de la persona).
 * Cachea por petición para no repetir consultas en listados.
 */
class CustomerNameResolver
{
    private array $cache = [];

    public function resolve(string $type, ?int $id): string
    {
        if (!$id || !in_array($type, ['lead', 'cliente'], true)) {
            return 'Cliente no identificado';
        }

        $cacheKey = "{$type}:{$id}";
        if (isset($this->cache[$cacheKey])) {
            return $this->cache[$cacheKey];
        }

        $table = $type === 'cliente' ? 'clientes' : 'leads';
        $customer = DB::table($table)->where('id', $id)->first();
        if (!$customer) {
            return $this->cache[$cacheKey] = ucfirst($type) . " #{$id}";
        }

        $personName = trim(implode(' ', array_filter([
            $customer->nombre ?? null,
            $customer->apellido_paterno ?? null,
            $customer->apellido_materno ?? null,
        ])));

        return $this->cache[$cacheKey] = (
            $customer->negocio
            ?? $customer->razon_social
            ?? ($personName ?: ucfirst($type) . " #{$id}")
        );
    }
}
