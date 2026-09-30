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

    public function properties()
    {
        return $this->hasMany(GroundProperty::class, 'casero_id');
    }
}
