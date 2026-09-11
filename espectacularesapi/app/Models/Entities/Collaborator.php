<?php

namespace App\Models\Entities;

use Illuminate\Database\Eloquent\Model;

class Collaborator extends Model
{
    protected $table = 'collaborators';

    protected $guarded = [];

    protected $casts = [
        'active' => 'boolean',
    ];
}
