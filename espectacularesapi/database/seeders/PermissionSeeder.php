<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class PermissionSeeder extends Seeder
{
    public function run()
    {
        // Limpiar caché
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $guard = config('auth.defaults.guard') ?? 'api';

        // Definir permisos básicos
        $permissions = [
            'users.view',
            'users.create',
            'users.edit',
            'users.delete',
            'roles.manage',
            'spaces.view',
            'spaces.create',
            'spaces.edit',
            'spaces.delete',
            'quotes.view',
            'quotes.create',
            'quotes.edit',
            'quotes.delete',
        ];

        foreach ($permissions as $permissionName) {
            Permission::firstOrCreate(['name' => $permissionName, 'guard_name' => $guard]);
        }

        // Asignar todos los permisos al rol admin
        $adminRole = Role::where('name', 'admin')->where('guard_name', $guard)->first();
        if ($adminRole) {
            $adminRole->syncPermissions($permissions);
        }
    }
}
