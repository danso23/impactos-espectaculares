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

$router->post('/auth/refresh', 'AuthController@refresh');

$router->group(['prefix' => 'api'], function () use ($router) {

    $router->post('login', ['uses' => 'AuthController@login']);
    $router->post('logout', ['uses' => 'AuthController@logout']);

    $router->group(['middleware' => 'authToken'], function () use ($router) {

        $router->get('me', function (\Illuminate\Http\Request $request) {
            return response()->json($request->attributes->get('auth_user'));
        });

        $router->post('spaces', ['uses' => 'SpaceController@store']);
        $router->get('spaces', ['uses' => 'SpaceController@index']);
        $router->get('spaces/coords', ['uses' => 'SpaceController@coords']);

        $router->put('spaces/{id}', ['uses' => 'SpaceController@update']);
        $router->patch('spaces/{id}', ['uses' => 'SpaceController@update']);
        $router->delete('spaces/{id}', ['uses' => 'SpaceController@delete']);
    });
});
