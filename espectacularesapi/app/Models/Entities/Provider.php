<?php

namespace App\Models\Entities;

use Illuminate\Database\Eloquent\Model;

class Provider extends Model
{
    protected $table = 'providers';

    protected $guarded = [];

    protected $casts = [
        'active' => 'boolean',
    ];
}
