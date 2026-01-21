<?php

namespace App\Models\Entities;

use Illuminate\Database\Eloquent\Model;

class Prestamo extends Model
{
    protected $table = 'prestamos';
    protected $fillable = [
        'cliente_id',
        'periodo_pago_id',
        'monto',
        'interes',
        'plazo',
        'total_pagar',
        'estado',
        'usuario'
    ];

    public function detalles(){
        return $this->hasMany(DetallePrestamo::class);
    }

    public function cliente(){
        return $this->belongsTo(Cliente::class);
    }

    public function periodoPago(){
        return $this->belongsTo(CatPeriodoPago::class, 'periodo_pago_id');
    }

    public function scopeVigente($q, $valor = 1)
    {
        return $q->where('estado', $valor);
    }
}