<?php

namespace App\Models\Entities;

use Illuminate\Database\Eloquent\Model;

class GroundRentPayment extends Model
{
    protected $table = 'ground_rent_payments';
    protected $guarded = [];
    protected $casts = ['period_start' => 'date:Y-m-d', 'period_end' => 'date:Y-m-d', 'due_date' => 'date:Y-m-d', 'paid_at' => 'datetime', 'amount' => 'decimal:2'];

    public function contract() { return $this->belongsTo(GroundRentContract::class, 'ground_rent_contract_id'); }
}
