<?php

namespace App\Models\Entities;

use Illuminate\Database\Eloquent\Model;
use App\Models\Entities\Grupo;
use Carbon\Carbon;

class Cliente extends Model
{
    protected $table = 'clientes';
    public $timestamps = true;
    protected $guarded = [];

    protected $appends = ['es_moroso', 'dias_morosidad', 'dias_morosidad_text'];
    public const PRESTAMO_VIGENTE = 1;
    public const CUOTA_PENDIENTE  = 0;

    public function grupos()
    {
        return $this->belongsToMany(Grupo::class, 'cliente_grupo');
    }

    public function prestamos()
    {
        return $this->hasMany(Prestamo::class);
    }


    /**
     * Accessor: es_moroso
     *
     *  - Moroso si existe al menos una cuota (pendiente) vencida (< hoy)
     *    en cualquier préstamo vigente del cliente.
     *  - Optimización: si el modelo ya trae "ultima_fecha_vencida" desde el SELECT,
     *    lo usamos para no disparar extra consultas.
     */
    public function getEsMorosoAttribute(): bool
    {
        // Si el controlador ya trajo la primera vencida, úsala sin nueva consulta
        if (\array_key_exists('primera_fecha_vencida', $this->attributes)) {
            return !is_null($this->attributes['primera_fecha_vencida']);
        }

        $hoy = Carbon::today()->toDateString();


        $minVencida = DetallePrestamo::query()
            ->whereHas('prestamo', function ($q) {
                $q->where('cliente_id', $this->id)
                  ->where('estado', self::PRESTAMO_VIGENTE);
            })
            ->where('esta_pagado', self::CUOTA_PENDIENTE)
            ->whereDate('fecha_pago', '<', $hoy)
            ->min('fecha_pago');

        return !is_null($minVencida);
    }

    /** Días desde la PRIMERA (más antigua) vencida pendiente hasta hoy */
    public function getDiasMorosidadAttribute(): int
    {
        $today = Carbon::today();

        // Usa el alias si ya viene del SELECT
        if (\array_key_exists('primera_fecha_vencida', $this->attributes)) {
            $primera = $this->attributes['primera_fecha_vencida'];
            return $primera ? $today->diffInDays(Carbon::parse($primera)) : 0;
        }

        // Fallback: calcular MIN(fecha_pago) vencida y pendiente
        $hoyStr = $today->toDateString();

        $minVencida = DetallePrestamo::query()
            ->whereHas('prestamo', function ($q) {
                $q->where('cliente_id', $this->id)
                  ->where('estado', self::PRESTAMO_VIGENTE);
            })
            ->where('esta_pagado', self::CUOTA_PENDIENTE)
            ->whereDate('fecha_pago', '<', $hoyStr)
            ->min('fecha_pago');

        return $minVencida ? $today->diffInDays(Carbon::parse($minVencida)) : 0;
    }

    public function getDiasMorosidadTextAttribute(): string
    {
        $dias = $this->dias_morosidad;
        return $dias === 1 ? "1 día" : "{$dias} días";
    }
}
