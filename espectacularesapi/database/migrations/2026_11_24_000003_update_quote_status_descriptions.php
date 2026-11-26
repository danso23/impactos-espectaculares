<?php

use Carbon\Carbon;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class UpdateQuoteStatusDescriptions extends Migration
{
    public function up()
    {
        if (!Schema::hasTable('quote_status')) {
            return;
        }

        DB::table('quote_status')->where('key', 'rejected')->update([
            'name' => 'Rechazada',
            'description' => 'El cliente no aceptó la cotización en esos términos',
            'updated_at' => Carbon::now(),
        ]);

        DB::table('quote_status')->where('key', 'cancelled')->update([
            'name' => 'Cancelada',
            'description' => 'El servicio no se realizó o la cotización fue reemplazada',
            'updated_at' => Carbon::now(),
        ]);
    }

    public function down()
    {
        if (!Schema::hasTable('quote_status')) {
            return;
        }

        DB::table('quote_status')->where('key', 'rejected')->update([
            'description' => 'Cliente rechazó la cotización',
            'updated_at' => Carbon::now(),
        ]);

        DB::table('quote_status')->where('key', 'cancelled')->update([
            'description' => 'Cancelada manualmente',
            'updated_at' => Carbon::now(),
        ]);
    }
}
