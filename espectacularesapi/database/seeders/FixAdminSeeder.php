<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Entities\User;
use Spatie\Permission\Models\Role;

class FixAdminSeeder extends Seeder
{
    public function run()
    {
        $guard = config('auth.defaults.guard') ?? 'api';
        $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => $guard]);
        
        $user = User::where('username', 'admin')->first();
        if ($user) {
            $user->syncRoles(['admin']);
            echo "Rol admin asignado correctamente al usuario admin con guard {$guard}\n";
        } else {
            echo "Usuario admin no encontrado\n";
        }
    }
}
