<?php

namespace App\Models\Entities;

use Illuminate\Database\Eloquent\Model;

class Casero extends Model
{
    protected $table = 'caseros';
    public $timestamps = true;
    protected $guarded = [];

    protected $casts = [
        'monto_renta' => 'decimal:2',
        'active'      => 'boolean',
    ];

    /**
     * Espacios (espectaculares) que pertenecen a este casero.
     */
    public function spaces()
    {
        return $this->hasMany(Space::class, 'casero_id');
    }
}
