<?php

return [
    'jwt_secret' => env('JWT_SECRET'),
    'access_ttl' => (int) env('ACCESS_TTL_MINUTES', 15),
    'refresh_ttl_days' => (int) env('REFRESH_TTL_DAYS', 30),

    'defaults' => [
        'guard' => 'sanctum',
    ],

    'guards' => [
        'sanctum' => [
            'driver' => 'sanctum',
            'provider' => 'users',
        ],
    ],

    'providers' => [
        'users' => [
            'driver' => 'eloquent',
            'model' => App\Models\Entities\User::class,
        ],
    ],

];