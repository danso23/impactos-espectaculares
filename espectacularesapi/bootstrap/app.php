<?php

require_once __DIR__.'/../vendor/autoload.php';

(new Laravel\Lumen\Bootstrap\LoadEnvironmentVariables(
    dirname(__DIR__)
))->bootstrap();

date_default_timezone_set(env('APP_TIMEZONE', 'UTC'));

/*
|--------------------------------------------------------------------------
| Create The Application
|--------------------------------------------------------------------------
|
| Here we will load the environment and create the application instance
| that serves as the central piece of this framework. We'll use this
| application as an "IoC" container and router for this framework.
|
*/

// $app = new Laravel\Lumen\Application(
//     dirname(__DIR__)
// );
require_once __DIR__ . '/../app/Application.php';
$app = new App\Application(
    dirname(__DIR__)
);

$app->instance(Illuminate\Contracts\Foundation\Application::class, $app);
$app->alias('app', Illuminate\Contracts\Foundation\Application::class);

$app->withFacades();
$app->withEloquent();

// Polyfills para paquetes de Laravel full (Sanctum) en Lumen
if (!function_exists('config_path')) {
    function config_path($path = '') {
        $base = dirname(__DIR__) . '/config';
        return $path ? $base . '/' . $path : $base;
    }
}

/*
|--------------------------------------------------------------------------
| Register Container Bindings
|--------------------------------------------------------------------------
|
| Now we will register a few bindings in the service container. We will
| register the exception handler and the console kernel. You may add
| your own bindings here if you like or you can make another file.
|
*/

$app->singleton(
    Illuminate\Contracts\Debug\ExceptionHandler::class,
    App\Exceptions\Handler::class
);

$app->singleton(
    Illuminate\Contracts\Console\Kernel::class,
    App\Console\Kernel::class
);

// $app->singleton(
//     Illuminate\Contracts\Console\Kernel::class,
//     App\Console\Kernel::class
// );


/*
|--------------------------------------------------------------------------
| Register Config Files
|--------------------------------------------------------------------------
|
| Now we will register the "app" configuration file. If the file exists in
| your configuration directory it will be loaded; otherwise, we'll load
| the default version. You may register other files below as needed.
|
*/


/*
|--------------------------------------------------------------------------
| Register Middleware
|--------------------------------------------------------------------------
|
| Next, we will register the middleware with the application. These can
| be global middleware that run before and after each request into a
| route or middleware that'll be assigned to some specific routes.
|
*/

// $app->middleware([
//     App\Http\Middleware\ExampleMiddleware::class
// ]);

$app->routeMiddleware([
    'auth' => App\Http\Middleware\Authenticate::class,
    'check' => App\Http\Middleware\TokenVerification::class,
    'authToken' => App\Http\Middleware\TokenVerification::class,
    'jwt_auth' => \Tymon\JWTAuth\Http\Middleware\Authenticate::class,
    'cors' => App\Http\Middleware\CorsMiddleware::class,
]);

$app->middleware([
    App\Http\Middleware\CorsMiddleware::class,
]);
/*
|--------------------------------------------------------------------------
| Register Service Providers
|--------------------------------------------------------------------------
|
| Here we will register all of the application's service providers which
| are used to bind services into the container. Service providers are
| totally optional, so you are not required to uncomment this line.
|
*/

$app->configure('app');
$app->configure('jwt');
$app->configure('mail');
$app->configure('auth');
$app->configure('permission');
$app->configure('cache');

$app->singleton(Illuminate\Cache\CacheManager::class, function () use ($app) {
    return new Illuminate\Cache\CacheManager($app);
});

// Alias que esperan paquetes (Spatie usa cache)
$app->alias(Illuminate\Cache\CacheManager::class, 'cache');
$app->alias('cache', Illuminate\Contracts\Cache\Factory::class);


$app->register(App\Providers\AppServiceProvider::class);
$app->register(App\Providers\AuthServiceProvider::class);
// $app->register(App\Providers\EventServiceProvider::class);
$app->register(Illuminate\Mail\MailServiceProvider::class);
$app->register(Tymon\JWTAuth\Providers\LumenServiceProvider::class);
$app->register(Illuminate\Database\MigrationServiceProvider::class);
// $app->register(Laravel\Sanctum\SanctumServiceProvider::class);
$app->register(Illuminate\Cache\CacheServiceProvider::class);
$app->register(Spatie\Permission\PermissionServiceProvider::class);


// $app->configure('sanctum');



// $app->configure('mail');
$app->alias('mail.manager', Illuminate\Mail\MailManager::class);
$app->alias('mail.manager', Illuminate\Contracts\Mail\Factory::class);
$app->alias('mailer', Illuminate\Mail\Mailer::class);
$app->alias('mailer', Illuminate\Contracts\Mail\Mailer::class);
$app->alias('mailer', Illuminate\Contracts\Mail\MailQueue::class);



/*
|--------------------------------------------------------------------------
| Load The Application Routes
|--------------------------------------------------------------------------
|
| Next we will include the routes file so that they can all be added to
| the application. This will provide all of the URLs the application
| can respond to, as well as the controllers that may handle them.
|
*/

$app->router->group([
    'namespace' => 'App\Http\Controllers',
], function ($router) {
    require __DIR__.'/../routes/web.php';
});


if ($app->environment() !== 'production') {
  $app->register(Flipbox\LumenGenerator\LumenGeneratorServiceProvider::class);
}
// $app->withEloquent(); //Para manejar bases de datos


return $app;
