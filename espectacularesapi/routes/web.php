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

$router->post('/setuser1', 'UserController@Register');
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
        $router->post('roles', ['uses' => 'RoleController@store']);
        $router->put('roles/{id}', ['uses' => 'RoleController@update']);
        $router->patch('roles/{id}', ['uses' => 'RoleController@update']);
        $router->delete('roles/{id}', ['uses' => 'RoleController@destroy']);

        /** SPACES **/
        $router->post('spaces', ['uses' => 'SpaceController@store']);
        $router->get('spaces', ['uses' => 'SpaceController@index']);
        $router->get('spaces/coords', ['uses' => 'SpaceController@coords']);
        $router->get('spaces/{spaceId}/images/{imageId}', ['uses' => 'SpaceController@image']);
        $router->put('spaces/{id}', ['uses' => 'SpaceController@update']);
        $router->patch('spaces/{id}', ['uses' => 'SpaceController@update']);
        $router->delete('spaces/{id}', ['uses' => 'SpaceController@delete']);

        /** PROVIDERS **/
        $router->get('providers', ['uses' => 'ProviderController@index']);
        $router->get('providers/{id}', ['uses' => 'ProviderController@find']);
        $router->post('providers', ['uses' => 'ProviderController@store']);
        $router->put('providers/{id}', ['uses' => 'ProviderController@update']);
        $router->patch('providers/{id}', ['uses' => 'ProviderController@update']);
        $router->delete('providers/{id}', ['uses' => 'ProviderController@delete']);

        /** RENTALS **/
        $router->get('rentals', ['uses' => 'RentalController@index']);
        $router->get('rentals/{id}', ['uses' => 'RentalController@find']);
        $router->post('rentals', ['uses' => 'RentalController@store']);
        $router->put('rentals/{id}', ['uses' => 'RentalController@update']);
        $router->patch('rentals/{id}', ['uses' => 'RentalController@update']);
        $router->delete('rentals/{id}', ['uses' => 'RentalController@delete']);

        /** QUOTES AND LEADS **/
        $router->get('quote-catalogs', ['uses' => 'QuoteController@catalogs']);
        $router->get('configuration', ['uses' => 'ConfigurationController@show']);
        $router->put('configuration', ['uses' => 'ConfigurationController@update']);
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

        /** CASEROS **/
        $router->get('caseros', ['uses' => 'CaseroController@index']);
        $router->get('caseros/{id}', ['uses' => 'CaseroController@find']);
        $router->post('caseros', ['uses' => 'CaseroController@store']);
        $router->put('caseros/{id}', ['uses' => 'CaseroController@update']);
        $router->patch('caseros/{id}', ['uses' => 'CaseroController@update']);
        $router->delete('caseros/{id}', ['uses' => 'CaseroController@delete']);
    });
});
