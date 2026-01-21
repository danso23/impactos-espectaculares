<?php

/*
|--------------------------------------------------------------------------
| Application Routes
|--------------------------------------------------------------------------
|
| Here is where you can register all of the routes for an application.
| It is a breeze. Simply tell Lumen the URIs it should respond to
| and give it the Closure to call when that URI is requested.
|
*/

$router->get('/', function () use ($router) {
    return $router->app->version();
});

$router->post('/setuser1','UserController@Register');
$router->post('/password/email', 'AuthController@sendResetLink');
$router->post('/password/reset', 'AuthController@resetPassword');

$router->post('/api/login', ['uses' => 'AuthController@login']);
$router->post('/auth/refresh', 'AuthController@refresh');


$router->group(['middleware' => 'authToken'], function () use ($router) {
    $router->get('/api/me', function (\Illuminate\Http\Request $request) {
        return response()->json($request->attributes->get('auth_user'));
    });


    $router->post('/api/spaces', ['uses' => 'SpaceController@store']);
    $router->get('/api/spaces', ['uses' => 'SpaceController@index']);
    $router->put('/spaces/{space}', [SpaceController::class, 'update']);
    $router->patch('/spaces/{space}', [SpaceController::class, 'update']);
    $router->delete('/spaces/{space}', [SpaceController::class, 'destroy']);

    // Obtener solo coordenadas (mapa / heatmap)
    $router->get('/api/spaces/coords', ['uses' => 'SpaceController@coords']);

    $router->post('/api/logout', ['uses' => 'AuthController@logout']);
});
