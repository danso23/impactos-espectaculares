<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use App\Models\Entities\User;

class RoleSeeder extends Seeder
{
    public function run()
    {
        // Limpiar caché de Spatie para evitar errores de roles no encontrados
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $defaultGuard = config('auth.defaults.guard') ?? 'api';
        echo "Usando guard: {$defaultGuard}\n";

        // Roles conocidos
        $rolesToCreate = ['admin', 'seller', 'regular', 'user'];
        
        // Obtener roles únicos que ya existen en la tabla users
        $existingUserRoles = User::whereNotNull('role')->distinct()->pluck('role')->toArray();
        $allRoles = array_unique(array_merge($rolesToCreate, $existingUserRoles));

        foreach ($allRoles as $roleName) {
            echo "Creando/Verificando rol: {$roleName} para guard {$defaultGuard}\n";
            Role::firstOrCreate(['name' => $roleName, 'guard_name' => $defaultGuard]);
        }

        // Limpiar de nuevo por si acaso
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Asignar roles a usuarios existentes
        $users = User::all();
        foreach ($users as $user) {
            if ($user->role) {
                $user->syncRoles([$user->role]);
            } else {
                $user->syncRoles(['regular']);
            }
        }
    }
}
