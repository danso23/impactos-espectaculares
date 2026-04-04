<?php

namespace App\Models\Entities;

use Illuminate\Database\Eloquent\Model;

class Agency extends Model
{
    protected $table = 'agencies';

    protected $guarded = [];

    protected $casts = [
        'discount_value' => 'decimal:2',
        'commission_value' => 'decimal:2',
        'is_active' => 'boolean',
    ];
}
