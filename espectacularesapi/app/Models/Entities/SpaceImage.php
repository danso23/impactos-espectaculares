<?php

namespace App\Models\Entities;

use Illuminate\Database\Eloquent\Model;

class SpaceImage extends Model
{
    protected $table = 'space_images';

    protected $fillable = [
        'space_id',
        'filename',
        'path',
        'is_cover',
        'position',
        'order_index',
    ];
}