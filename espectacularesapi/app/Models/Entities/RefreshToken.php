<?php

namespace App\Models\Entities;

use Illuminate\Database\Eloquent\Model;

class RefreshToken extends Model
{
    protected $table = 'refresh_tokens';
    protected $fillable = [
        'user_id','token_hash','expires_at','revoked_at','replaced_by_hash'
    ];
    protected $dates = ['expires_at','revoked_at'];
}
