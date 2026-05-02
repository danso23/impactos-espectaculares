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

    $router->group(['middleware' => 'authToken'], function () use ($router) {

        $router->post('logout', ['uses' => 'AuthController@logout']);
        $router->get('me', function (\Illuminate\Http\Request $request) {
            return response()->json($request->attributes->get('auth_user'));
        });

        /** USERS **/
        $router->get('users', ['uses' => 'UserController@index']);
        $router->get('users/{id}', ['uses' => 'UserController@show']);
        $router->post('users', ['uses' => 'UserController@store']);
        $router->put('users/{id}', ['uses' => 'UserController@update']);
        $router->patch('users/{id}', ['uses' => 'UserController@update']);
        $router->delete('users/{id}', ['uses' => 'UserController@destroy']);
        
        /** ROLES **/
        $router->get('roles', ['uses' => 'RoleController@index']);

        /** SPACES **/
        $router->post('spaces', ['uses' => 'SpaceController@store']);
        $router->get('spaces', ['uses' => 'SpaceController@index']);
        $router->get('spaces/coords', ['uses' => 'SpaceController@coords']);
        $router->get('spaces/{spaceId}/images/{imageId}', ['uses' => 'SpaceController@image']);
        $router->put('spaces/{id}', ['uses' => 'SpaceController@update']);
        $router->patch('spaces/{id}', ['uses' => 'SpaceController@update']);
        $router->delete('spaces/{id}', ['uses' => 'SpaceController@delete']);

        /** QUOTES AND LEADS **/
        $router->get('quote-catalogs', ['uses' => 'QuoteController@catalogs']);
        $router->get('lead-catalogs', ['uses' => 'LeadController@catalogs']);
        $router->get('leads', ['uses' => 'LeadController@index']);
        $router->post('leads', ['uses' => 'LeadController@store']);
        $router->post('leads/{id}/convert-to-client', ['uses' => 'LeadController@convertToClient']);
        $router->get('clientes', ['uses' => 'ClientController@index']);
        $router->post('clientes', ['uses' => 'ClientController@store']);
        $router->get('customers/search', ['uses' => 'QuoteController@searchCustomers']);
        $router->get('quotes', ['uses' => 'QuoteController@index']);
        $router->post('quotes/preview', ['uses' => 'QuoteController@preview']);
        $router->post('quotes', ['uses' => 'QuoteController@store']);
        $router->get('quotes/{id}', ['uses' => 'QuoteController@show']);
        $router->get('quotes/{id}/history', ['uses' => 'QuoteController@history']);
        $router->post('quotes/{id}/status', ['uses' => 'QuoteController@changeStatus']);
        $router->post('quotes/{id}/convert-to-rental', ['uses' => 'QuoteController@convertToRental']);
    });
});
