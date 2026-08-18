<?php

namespace App\Models\Entities;

use Illuminate\Database\Eloquent\Model;

class SpaceCatalogShare extends Model
{
    protected $table = 'space_catalog_shares';

    protected $fillable = [
        'token',
        'created_by',
        'snapshot',
        'expires_at',
    ];

    protected $casts = [
        'snapshot' => 'array',
        'expires_at' => 'datetime',
    ];
}
