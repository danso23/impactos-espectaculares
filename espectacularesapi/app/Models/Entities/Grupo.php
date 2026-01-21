<?php

namespace App\Models\Entities;

use Illuminate\Database\Eloquent\Model;
use App\Models\Entities\Cliente;

class Grupo extends Model
{
    protected $table = 'grupos';
    public $timestamps = true;
    protected $guarded = [];

    public function clientes()
    {
        return $this->belongsToMany(Cliente::class, 'cliente_grupo');
    }
}
