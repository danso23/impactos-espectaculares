<?php

namespace App\Models\Entities;

use Illuminate\Database\Eloquent\Model;

class Space extends Model
{
    protected $table = 'spaces';

    protected $fillable = [
        'title',
        'price',
        'type',
        'socioeconomic_level',
        'width_m',
        'height_m',
        'has_lights',
        'assigned_id',
        'faces',
        'view_type',
        'description',
        'comments',
        'latitude',
        'longitude',
        'active',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'width_m' => 'decimal:2',
        'height_m' => 'decimal:2',
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'has_lights' => 'boolean',
        'faces' => 'integer',
        'active' => 'boolean',
    ];
    
    public function images()
    {
        return $this->hasMany(SpaceImage::class);
    }
}
