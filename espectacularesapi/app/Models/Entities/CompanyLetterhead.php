<?php

namespace App\Models\Entities;

use Illuminate\Database\Eloquent\Model;

class CompanyLetterhead extends Model
{
    protected $table = 'company_letterheads';

    protected $guarded = [];

    protected $casts = [
        'is_default' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class, 'company_id');
    }
}
