<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration {
    public function up()
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $guard = config('auth.defaults.guard') ?? 'sanctum';
        $permissionNames = [];

        foreach (array_keys(config('access.modules', [])) as $module) {
            foreach (array_keys(config('access.actions', [])) as $action) {
                $name = $module . '.' . $action;
                Permission::firstOrCreate(['name' => $name, 'guard_name' => $guard]);
                $permissionNames[] = $name;
            }
        }

        $admin = Role::where('name', 'admin')->where('guard_name', $guard)->first();
        if ($admin) {
            $admin->givePermissionTo($permissionNames);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down()
    {
        $guard = config('auth.defaults.guard') ?? 'sanctum';
        $names = [];

        foreach (array_keys(config('access.modules', [])) as $module) {
            foreach (array_keys(config('access.actions', [])) as $action) {
                $names[] = $module . '.' . $action;
            }
        }

        Permission::where('guard_name', $guard)->whereIn('name', $names)->delete();
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
