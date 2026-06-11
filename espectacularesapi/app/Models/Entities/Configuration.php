<?php

namespace App\Models\Entities;

use Illuminate\Database\Eloquent\Model;

class Configuration extends Model
{
    protected $table = 'configurations';

    protected $guarded = [];

    protected $casts = [
        'price_per_square_meter' => 'decimal:2',
    ];
}
