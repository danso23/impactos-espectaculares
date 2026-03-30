<?php

namespace App\Models\Entities;

use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    protected $table = 'companies';

    protected $guarded = [];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function letterheads()
    {
        return $this->hasMany(CompanyLetterhead::class, 'company_id');
    }
}
