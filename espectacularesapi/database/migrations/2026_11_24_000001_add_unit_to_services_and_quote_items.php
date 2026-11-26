<?php

use Carbon\Carbon;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AddUnitToServicesAndQuoteItems extends Migration
{
    public function up()
    {
        if (Schema::hasTable('services') && !Schema::hasColumn('services', 'unit')) {
            Schema::table('services', function (Blueprint $table) {
                $table->string('unit', 10)->default('pieza')->after('base_price');
            });

            // La impresión de lona se cobra por m²; instalación, desinstalación
            // y anuncio se cobran por pieza.
            DB::table('services')
                ->where('key', 'impresion')
                ->update(['unit' => 'm2', 'updated_at' => Carbon::now()]);
        }

        if (Schema::hasTable('quote_items') && !Schema::hasColumn('quote_items', 'unit')) {
            Schema::table('quote_items', function (Blueprint $table) {
                $table->string('unit', 10)->nullable()->after('qty');
            });

            // Las cotizaciones previas calcularon todos los servicios por m².
            DB::table('quote_items')->where('item_type', 'service')->update(['unit' => 'm2']);
            DB::table('quote_items')->where('item_type', 'rental')->update(['unit' => 'pieza']);
        }
    }

    public function down()
    {
        if (Schema::hasTable('quote_items') && Schema::hasColumn('quote_items', 'unit')) {
            Schema::table('quote_items', function (Blueprint $table) {
                $table->dropColumn('unit');
            });
        }

        if (Schema::hasTable('services') && Schema::hasColumn('services', 'unit')) {
            Schema::table('services', function (Blueprint $table) {
                $table->dropColumn('unit');
            });
        }
    }
}
