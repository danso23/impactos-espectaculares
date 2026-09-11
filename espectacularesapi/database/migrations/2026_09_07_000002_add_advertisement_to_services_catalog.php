<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

class AddAdvertisementToServicesCatalog extends Migration
{
    public function up()
    {
        if (!Schema::hasTable('services')) {
            return;
        }

        DB::table('services')->updateOrInsert(
            ['key' => 'anuncio'],
            [
                'name' => 'Anuncio',
                'description' => 'Anuncio seleccionado por ID asignado',
                'base_price' => 0,
                'tax_rate' => 16,
                'is_active' => true,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]
        );
    }

    public function down()
    {
        if (!Schema::hasTable('services')) {
            return;
        }

        $serviceId = DB::table('services')->where('key', 'anuncio')->value('id');
        $isInUse = $serviceId
            && Schema::hasTable('quote_items')
            && DB::table('quote_items')->where('service_id', $serviceId)->exists();

        if (!$isInUse) {
            DB::table('services')->where('key', 'anuncio')->delete();
        }
    }
}
