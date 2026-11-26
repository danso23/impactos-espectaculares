<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class AddRentalsEditStartDatePermission extends Migration
{
    private const PERMISSION = 'rentals.edit_start_date';

    public function up()
    {
        if (!Schema::hasTable('permissions')) {
            return;
        }

        $guard = config('auth.defaults.guard') ?? 'api';
        $permission = Permission::firstOrCreate(['name' => self::PERMISSION, 'guard_name' => $guard]);

        $adminRole = Role::where('name', 'admin')->where('guard_name', $guard)->first();
        if ($adminRole && !$adminRole->hasPermissionTo($permission)) {
            $adminRole->givePermissionTo($permission);
        }

        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }

    public function down()
    {
        if (!Schema::hasTable('permissions')) {
            return;
        }

        Permission::where('name', self::PERMISSION)->delete();
        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }
}
