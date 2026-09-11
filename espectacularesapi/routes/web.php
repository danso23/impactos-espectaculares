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

// Rutas explícitas para Apache/cPanel, donde el directorio estático puede ser
// redirigido al front controller de Lumen.
$router->get('/api-docs', 'ApiDocumentationController@index');
$router->get('/api-docs/', 'ApiDocumentationController@index');
$router->get('/api-docs/openapi.json', 'ApiDocumentationController@spec');

$router->group(['prefix' => 'api'], function () use ($router) {

    $router->post('login', ['uses' => 'AuthController@login']);
    // Las imágenes ya se publican desde storage; esta ruta además normaliza
    // la orientación EXIF de archivos históricos.
    $router->get('spaces/{spaceId}/images/{imageId}', ['uses' => 'SpaceController@image']);
    $router->get('public/catalog-shares/{token}', ['uses' => 'SpaceCatalogShareController@show']);

    $router->group(['middleware' => 'authToken'], function () use ($router) {

        $router->post('logout', ['uses' => 'AuthController@logout']);
        $router->get('me', function (\Illuminate\Http\Request $request) {
            return response()->json($request->attributes->get('auth_user'));
        });

        /** USERS **/
        $router->get('users', ['middleware' => 'permission:users.view', 'uses' => 'UserController@index']);
        $router->get('users/{id}', ['middleware' => 'permission:users.view', 'uses' => 'UserController@show']);
        $router->post('users', ['middleware' => 'permission:users.edit', 'uses' => 'UserController@store']);
        $router->put('users/{id}', ['middleware' => 'permission:users.edit', 'uses' => 'UserController@update']);
        $router->patch('users/{id}', ['middleware' => 'permission:users.edit', 'uses' => 'UserController@update']);
        $router->delete('users/{id}', ['middleware' => 'permission:users.delete', 'uses' => 'UserController@destroy']);

        /** ROLES **/
        $router->get('roles', ['middleware' => 'permission:roles.view', 'uses' => 'RoleController@index']);
        $router->get('role-permissions', ['middleware' => 'permission:roles.view', 'uses' => 'RoleController@permissionCatalog']);
        $router->post('roles', ['middleware' => 'permission:roles.edit', 'uses' => 'RoleController@store']);
        $router->put('roles/{id}', ['middleware' => 'permission:roles.edit', 'uses' => 'RoleController@update']);
        $router->patch('roles/{id}', ['middleware' => 'permission:roles.edit', 'uses' => 'RoleController@update']);
        $router->delete('roles/{id}', ['middleware' => 'permission:roles.delete', 'uses' => 'RoleController@destroy']);

        /** SPACES **/
        $router->post('spaces', ['middleware' => 'permission:spaces.edit', 'uses' => 'SpaceController@store']);
        $router->get('spaces', ['middleware' => 'permission:spaces.view', 'uses' => 'SpaceController@index']);
        $router->get('spaces/coords', ['middleware' => 'permission:spaces.view', 'uses' => 'SpaceController@coords']);
        $router->get('spaces/{id}', ['middleware' => 'permission:spaces.view', 'uses' => 'SpaceController@find']);
        $router->post('spaces/catalog-shares', ['middleware' => 'permission:spaces.view', 'uses' => 'SpaceCatalogShareController@store']);
        $router->put('spaces/{id}', ['middleware' => 'permission:spaces.edit', 'uses' => 'SpaceController@update']);
        $router->patch('spaces/{id}', ['middleware' => 'permission:spaces.edit', 'uses' => 'SpaceController@update']);
        $router->delete('spaces/{id}', ['middleware' => 'permission:spaces.delete', 'uses' => 'SpaceController@delete']);

        /** PROVIDERS **/
        $router->get('providers', ['middleware' => 'permission:providers.view', 'uses' => 'ProviderController@index']);
        $router->get('providers/{id}', ['middleware' => 'permission:providers.view', 'uses' => 'ProviderController@find']);
        $router->post('providers', ['middleware' => 'permission:providers.edit', 'uses' => 'ProviderController@store']);
        $router->put('providers/{id}', ['middleware' => 'permission:providers.edit', 'uses' => 'ProviderController@update']);
        $router->patch('providers/{id}', ['middleware' => 'permission:providers.edit', 'uses' => 'ProviderController@update']);
        $router->delete('providers/{id}', ['middleware' => 'permission:providers.delete', 'uses' => 'ProviderController@delete']);

        /** SERVICES **/
        $router->get('services', ['middleware' => 'permission:services.view', 'uses' => 'ServiceController@index']);
        $router->get('services/{id}', ['middleware' => 'permission:services.view', 'uses' => 'ServiceController@find']);
        $router->post('services', ['middleware' => 'permission:services.edit', 'uses' => 'ServiceController@store']);
        $router->put('services/{id}', ['middleware' => 'permission:services.edit', 'uses' => 'ServiceController@update']);
        $router->patch('services/{id}', ['middleware' => 'permission:services.edit', 'uses' => 'ServiceController@update']);
        $router->delete('services/{id}', ['middleware' => 'permission:services.delete', 'uses' => 'ServiceController@delete']);

        /** COLLABORATORS **/
        $router->get('collaborators', ['middleware' => 'permission:collaborators.view', 'uses' => 'CollaboratorController@index']);
        $router->get('collaborators/{id}', ['middleware' => 'permission:collaborators.view', 'uses' => 'CollaboratorController@find']);
        $router->post('collaborators', ['middleware' => 'permission:collaborators.edit', 'uses' => 'CollaboratorController@store']);
        $router->put('collaborators/{id}', ['middleware' => 'permission:collaborators.edit', 'uses' => 'CollaboratorController@update']);
        $router->patch('collaborators/{id}', ['middleware' => 'permission:collaborators.edit', 'uses' => 'CollaboratorController@update']);
        $router->delete('collaborators/{id}', ['middleware' => 'permission:collaborators.delete', 'uses' => 'CollaboratorController@delete']);

        /** RENTALS **/
        $router->get('rentals', ['middleware' => 'permission:rentals.view', 'uses' => 'RentalController@index']);
        $router->get('rentals/{id}', ['middleware' => 'permission:rentals.view', 'uses' => 'RentalController@find']);
        $router->post('rentals', ['middleware' => 'permission:rentals.edit', 'uses' => 'RentalController@store']);
        $router->post('rentals/{id}/confirm', ['middleware' => 'permission:rentals.edit', 'uses' => 'RentalController@confirm']);
        $router->put('rentals/{id}', ['middleware' => 'permission:rentals.edit', 'uses' => 'RentalController@update']);
        $router->patch('rentals/{id}', ['middleware' => 'permission:rentals.edit', 'uses' => 'RentalController@update']);
        $router->delete('rentals/{id}', ['middleware' => 'permission:rentals.delete', 'uses' => 'RentalController@delete']);

        /** PAYMENTS **/
        $router->get('payments', ['middleware' => 'permission:payments.view', 'uses' => 'PaymentController@index']);
        $router->post('invoices/{invoiceId}/payments', ['middleware' => 'permission:payments.edit', 'uses' => 'PaymentController@store']);

        /** QUOTES AND LEADS **/
        $router->get('quote-catalogs', ['middleware' => 'permission:quotes.view', 'uses' => 'QuoteController@catalogs']);
        $router->get('configuration', ['middleware' => 'permission:quotes.view', 'uses' => 'ConfigurationController@show']);
        $router->put('configuration', ['middleware' => 'permission:quotes.edit', 'uses' => 'ConfigurationController@update']);
        $router->get('lead-catalogs', ['middleware' => 'permission:leads.view', 'uses' => 'LeadController@catalogs']);
        $router->get('leads', ['middleware' => 'permission:leads.view', 'uses' => 'LeadController@index']);
        $router->post('leads', ['middleware' => 'permission:leads.edit', 'uses' => 'LeadController@store']);
        $router->post('leads/{id}/convert-to-client', ['middleware' => 'permission:leads.edit', 'uses' => 'LeadController@convertToClient']);
        $router->get('clientes', ['middleware' => 'permission:clients.view', 'uses' => 'ClientController@index']);
        $router->post('clientes', ['middleware' => 'permission:clients.edit', 'uses' => 'ClientController@store']);
        $router->get('customers/search', ['middleware' => 'permission:quotes.view', 'uses' => 'QuoteController@searchCustomers']);
        $router->get('quotes', ['middleware' => 'permission:quotes.view', 'uses' => 'QuoteController@index']);
        $router->post('quotes/preview', ['middleware' => 'permission:quotes.edit', 'uses' => 'QuoteController@preview']);
        $router->post('quotes', ['middleware' => 'permission:quotes.edit', 'uses' => 'QuoteController@store']);
        $router->get('quotes/{id}', ['middleware' => 'permission:quotes.view', 'uses' => 'QuoteController@show']);
        $router->get('quotes/{id}/history', ['middleware' => 'permission:quotes.view', 'uses' => 'QuoteController@history']);
        $router->post('quotes/{id}/status', ['middleware' => 'permission:quotes.edit', 'uses' => 'QuoteController@changeStatus']);
        $router->post('quotes/{id}/convert-to-rental', ['middleware' => 'permission:quotes.edit', 'uses' => 'QuoteController@convertToRental']);

        /** CASEROS **/
        $router->get('caseros', ['middleware' => 'permission:caseros.view', 'uses' => 'CaseroController@index']);
        $router->get('caseros/{id}', ['middleware' => 'permission:caseros.view', 'uses' => 'CaseroController@find']);
        $router->post('caseros', ['middleware' => 'permission:caseros.edit', 'uses' => 'CaseroController@store']);
        $router->put('caseros/{id}', ['middleware' => 'permission:caseros.edit', 'uses' => 'CaseroController@update']);
        $router->patch('caseros/{id}', ['middleware' => 'permission:caseros.edit', 'uses' => 'CaseroController@update']);
        $router->delete('caseros/{id}', ['middleware' => 'permission:caseros.delete', 'uses' => 'CaseroController@delete']);
    });
});
