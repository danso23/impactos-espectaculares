<?php

namespace App\Models\Entities;

use Illuminate\Auth\Authenticatable;
use Illuminate\Contracts\Auth\Access\Authorizable as AuthorizableContract;
use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
use Illuminate\Database\Eloquent\Model;
use Laravel\Lumen\Auth\Authorizable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Model implements AuthenticatableContract, AuthorizableContract
{
    use Authenticatable, Authorizable;

    protected $fillable = ['name', 'email', 'password', 'username', 'create_token', 'api_token', 'role', 'is_active'];

    protected $hidden = ['password'];

    // Métodos requeridos por JWTSubject
    // public function getJWTIdentifier()
    // {
    //     return $this->getKey();
    // }

    // public function getJWTCustomClaims()
    // {
    //     return [];
    // }
}

// class User extends Model implements AuthenticatableContract, AuthorizableContract
// {
//     use Authenticatable, Authorizable;

//     /**
//      * The attributes that are mass assignable.
//      *
//      * @var array
//      */
//     protected $fillable = [
//         'name', 'email','password','api_token','first_name','last_name','create_token'
//     ];

//     /**
//      * The attributes excluded from the model's JSON form.
//      *
//      * @var array
//      */
//     protected $hidden = [
//         'password',
//     ];
// }
