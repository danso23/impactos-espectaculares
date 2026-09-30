<?php

namespace App\Models\Entities;

use Illuminate\Database\Eloquent\Model;

class GroundRentContract extends Model
{
    protected $table = 'ground_rent_contracts';
    protected $guarded = [];
    protected $casts = ['starts_at' => 'date:Y-m-d', 'first_payment_date' => 'date:Y-m-d', 'payment_amount' => 'decimal:2'];

    public function property() { return $this->belongsTo(GroundProperty::class, 'ground_property_id'); }
    public function payments() { return $this->hasMany(GroundRentPayment::class, 'ground_rent_contract_id')->orderBy('installment_number'); }
}
