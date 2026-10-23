<?php

use Carbon\Carbon;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class UpdateInstallationServiceCopy extends Migration
{
    public function up()
    {
        if (!Schema::hasTable('services')) {
            return;
        }

        DB::table('services')
            ->where('key', 'instalacion')
            ->update([
                'name' => 'Instalación de lonas',
                'description' => 'Instalación de lonas',
                'updated_at' => Carbon::now(),
            ]);
    }

    public function down()
    {
        if (!Schema::hasTable('services')) {
            return;
        }

        DB::table('services')
            ->where('key', 'instalacion')
            ->update([
                'name' => 'Instalacion',
                'description' => 'Instalacion de lona o material publicitario',
                'updated_at' => Carbon::now(),
            ]);
    }
}
