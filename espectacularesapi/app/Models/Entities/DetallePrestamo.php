<?php

namespace App\Models\Entities;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class DetallePrestamo extends Model
{
    protected $table = 'detalle_prestamo';
    protected $fillable = [
        'prestamo_id',
        'fecha_pago',
        'monto_pago',
        'esta_pagado',
        'es_moroso',
        'usuario'
    ];

    
    public function prestamo(){
        return $this->belongsTo(Prestamo::class);
    }

    public function scopePendiente($q, $valor = 0)
    {
        return $q->where('esta_pagado', $valor);
    }

    public function scopeVencida($q, $today = null)
    {
        $today = $today ?: Carbon::today();
        return $q->whereDate('fecha_pago', '<', $today->toDateString());
    }
}
