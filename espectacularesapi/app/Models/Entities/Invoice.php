<?php

namespace App\Models\Entities;

use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    protected $table = 'invoices';

    protected $guarded = [];

    protected $casts = [
        'period_start' => 'date:Y-m-d',
        'period_end' => 'date:Y-m-d',
        'due_date' => 'date:Y-m-d',
        'subtotal' => 'decimal:2',
        'tax' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    public function rental()
    {
        return $this->belongsTo(Rental::class, 'rental_id');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class, 'invoice_id')->orderByDesc('paid_at')->orderByDesc('id');
    }
}
