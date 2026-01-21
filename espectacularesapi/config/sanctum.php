<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Sanctum Guards
    |--------------------------------------------------------------------------
    |
    | This array contains the authentication guards that Sanctum will check
    | when attempting to authenticate a request.
    |
    */

    'guard' => ['sanctum'],

    /*
    |--------------------------------------------------------------------------
    | Expiration Minutes
    |--------------------------------------------------------------------------
    |
    | This value controls the number of minutes until an issued token will be
    | considered expired.
    |
    */

    'expiration' => null,

    /*
    |--------------------------------------------------------------------------
    | Sanctum Middleware
    |--------------------------------------------------------------------------
    |
    | These middleware will be assigned to every Sanctum request.
    |
    */

    'middleware' => [
        'verify_csrf_token' => null,
        'encrypt_cookies' => null,
    ],

];