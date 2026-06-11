<?php

namespace App\Models\Entities;

use Illuminate\Database\Eloquent\Model;

class QuoteImage extends Model
{
    protected $table = 'quote_images';

    protected $fillable = [
        'quote_id',
        'disk',
        'path',
        'filename',
        'original_name',
        'mime_type',
        'size',
        'is_cover',
        'sort_order',
    ];

    protected $casts = [
        'is_cover' => 'boolean',
        'size' => 'integer',
        'sort_order' => 'integer',
    ];

    public function quote()
    {
        return $this->belongsTo(Quote::class, 'quote_id');
    }
}
