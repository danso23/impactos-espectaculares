<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Database\Eloquent\Builder;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        //
    }

    public function boot()
    {
        Builder::macro('visibleForUsuario', function (string $columnFQN, ?string $usuario) {
            /** @var \Illuminate\Database\Eloquent\Builder $this */
            if ($usuario === 'elias.escalante') {
                return $this->where($columnFQN, 'elias.escalante');
            }

            if (!empty($usuario)) {
                return $this->where(function ($q) use ($columnFQN) {
                    $q->where($columnFQN, '!=', 'elias.escalante')
                    ->orWhereNull($columnFQN);
                });
            }

            return $this;
        });
    }
}
