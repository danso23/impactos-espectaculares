<?php

namespace App\Models\Entities;

use Illuminate\Database\Eloquent\Model;

class GroundProperty extends Model
{
    protected $table = 'ground_properties';
    protected $guarded = [];
    protected $casts = ['active' => 'boolean'];

    public function casero() { return $this->belongsTo(Casero::class, 'casero_id'); }
    public function spaces() { return $this->hasMany(Space::class, 'ground_property_id'); }
    public function contracts() { return $this->hasMany(GroundRentContract::class, 'ground_property_id')->orderByDesc('id'); }
}
