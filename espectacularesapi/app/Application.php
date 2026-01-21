<?php

namespace App;

class Application extends \Laravel\Lumen\Application
{
    /**
     * Sanctum / ServiceProviders de Laravel esperan esto.
     */
    public function configurationIsCached()
    {
        return false;
    }

    /**
     * Algunos providers también lo consultan (por si acaso).
     */
    public function routesAreCached()
    {
        return false;
    }
}
