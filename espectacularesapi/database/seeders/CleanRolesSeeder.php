<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class CleanRolesSeeder extends Seeder
{
    public function run()
    {
        $guardToKeep = config('auth.defaults.guard') ?? 'api';
        
        // Eliminar roles que no pertenezcan al guard activo
        Role::where('guard_name', '!=', $guardToKeep)->delete();
        
        // Eliminar permisos que no pertenezcan al guard activo
        Permission::where('guard_name', '!=', $guardToKeep)->delete();
        
        echo "Limpieza completada. Solo se mantuvieron roles y permisos para el guard: {$guardToKeep}\n";
    }
}
