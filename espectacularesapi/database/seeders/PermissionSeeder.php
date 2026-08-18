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

        $permissions = [];
        foreach (array_keys(config('access.modules', [])) as $module) {
            foreach (array_keys(config('access.actions', [])) as $action) {
                $permissions[] = $module . '.' . $action;
            }
        }

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
