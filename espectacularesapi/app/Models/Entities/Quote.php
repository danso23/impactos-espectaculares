<?php

namespace App\Models\Entities;

use Illuminate\Database\Eloquent\Model;

class Quote extends Model
{
    protected $table = 'quotes';

    protected $guarded = [];

    protected $casts = [
        'includes_tax' => 'boolean',
        'tax_rate' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'rentals_subtotal' => 'decimal:2',
        'services_subtotal' => 'decimal:2',
        'discount_base' => 'decimal:2',
        'discount' => 'decimal:2',
        'discount_value' => 'decimal:2',
        'tax' => 'decimal:2',
        'total' => 'decimal:2',
        'commission_base' => 'decimal:2',
        'commission_value' => 'decimal:2',
        'commission_amount' => 'decimal:2',
        'snapshot_json' => 'array',
        'valid_until' => 'date:Y-m-d',
        'pdf_generated_at' => 'datetime',
    ];

    public function items()
    {
        return $this->hasMany(QuoteItem::class, 'quote_id')->orderBy('sort_order')->orderBy('id');
    }

    public function status()
    {
        return $this->belongsTo(QuoteStatus::class, 'quote_status_id');
    }

    public function history()
    {
        return $this->hasMany(QuoteStatusHistory::class, 'quote_id')->orderByDesc('changed_at')->orderByDesc('id');
    }

    public function company()
    {
        return $this->belongsTo(Company::class, 'issuer_company_id');
    }

    public function letterhead()
    {
        return $this->belongsTo(CompanyLetterhead::class, 'letterhead_id');
    }

    public function agency()
    {
        return $this->belongsTo(Agency::class, 'agency_id');
    }
}
