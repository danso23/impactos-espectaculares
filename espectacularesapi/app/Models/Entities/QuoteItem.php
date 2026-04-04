<?php

namespace App\Models\Entities;

use Illuminate\Database\Eloquent\Model;

class QuoteItem extends Model
{
    protected $table = 'quote_items';

    protected $guarded = [];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total' => 'decimal:2',
        'production_cost' => 'decimal:2',
        'discount_applies' => 'boolean',
        'qty' => 'integer',
        'faces' => 'integer',
        'sort_order' => 'integer',
        'start_date' => 'date:Y-m-d',
        'end_date' => 'date:Y-m-d',
    ];

    public function quote()
    {
        return $this->belongsTo(Quote::class, 'quote_id');
    }

    public function space()
    {
        return $this->belongsTo(Space::class, 'space_id');
    }

    public function service()
    {
        return $this->belongsTo(ServiceCatalog::class, 'service_id');
    }
}
