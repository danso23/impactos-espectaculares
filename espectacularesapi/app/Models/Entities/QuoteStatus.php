<?php

namespace App\Models\Entities;

use Illuminate\Database\Eloquent\Model;

class QuoteStatus extends Model
{
    protected $table = 'quote_status';

    protected $guarded = [];

    protected $casts = [
        'is_final' => 'boolean',
        'is_active' => 'boolean',
    ];
}
