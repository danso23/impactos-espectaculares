<?php

namespace App\Models\Entities;

use Illuminate\Database\Eloquent\Model;

class CatPeriodoPago extends Model
{
    protected $table = 'cat_periodo_pago';
    protected $fillable = [
        'periodo_pago',
        'nombre',
        'descripcion',
        'activo'
    ];
}
