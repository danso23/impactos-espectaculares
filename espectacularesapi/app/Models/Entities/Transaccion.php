<?php

namespace App\Models\Entities;

use Illuminate\Database\Eloquent\Model;

class Transaccion extends Model
{
    protected $table = 'transacciones';
    public $timestamps = true;
    protected $guarded = [];

}
