<?php

namespace App\Models\Entities;

use Illuminate\Database\Eloquent\Model;

class Rental extends Model
{
    protected $table = 'rentals';

    protected $guarded = [];

    protected $casts = [
        'starts_at' => 'date:Y-m-d',
        'ends_at' => 'date:Y-m-d',
        'first_payment_date' => 'date:Y-m-d',
        'payment_installments' => 'integer',
        'subtotal' => 'decimal:2',
        'tax' => 'decimal:2',
        'total' => 'decimal:2',
        'snapshot_json' => 'array',
    ];

    public function items()
    {
        return $this->hasMany(RentalItem::class, 'rental_id')->orderBy('start_date')->orderBy('id');
    }

    public function quote()
    {
        return $this->belongsTo(Quote::class, 'quote_id');
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class, 'rental_id')->orderBy('due_date')->orderBy('id');
    }

    public function company()
    {
        return $this->belongsTo(Company::class, 'issuer_company_id');
    }

    public function agency()
    {
        return $this->belongsTo(Agency::class, 'agency_id');
    }

    public function createdByUser()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
