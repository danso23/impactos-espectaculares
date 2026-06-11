<?php

namespace App\Models\Entities;

use Illuminate\Database\Eloquent\Model;

class RentalItem extends Model
{
    protected $table = 'rental_items';

    protected $guarded = [];

    protected $casts = [
        'start_date' => 'date:Y-m-d',
        'end_date' => 'date:Y-m-d',
        'unit_price' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'qty' => 'integer',
    ];

    public function rental()
    {
        return $this->belongsTo(Rental::class, 'rental_id');
    }

    public function quoteItem()
    {
        return $this->belongsTo(QuoteItem::class, 'quote_item_id');
    }

    public function space()
    {
        return $this->belongsTo(Space::class, 'space_id');
    }
}
