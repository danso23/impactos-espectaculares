<?php

namespace App\Models\Entities;

use Illuminate\Database\Eloquent\Model;

class QuoteStatusHistory extends Model
{
    protected $table = 'quote_status_history';

    protected $guarded = [];

    protected $casts = [
        'meta' => 'array',
        'changed_at' => 'datetime',
    ];

    public function quote()
    {
        return $this->belongsTo(Quote::class, 'quote_id');
    }

    public function fromStatus()
    {
        return $this->belongsTo(QuoteStatus::class, 'from_status_id');
    }

    public function toStatus()
    {
        return $this->belongsTo(QuoteStatus::class, 'to_status_id');
    }
}
