<?php

use Carbon\Carbon;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AddSubtypeToSpaces extends Migration
{
    public function up()
    {
        if (!Schema::hasTable('spaces')) {
            return;
        }

        if (!Schema::hasColumn('spaces', 'subtype')) {
            Schema::table('spaces', function (Blueprint $table) {
                // Solo para Espectacular: Cartelera o Unipolar.
                $table->string('subtype', 30)->nullable()->after('type');
                $table->index(['type', 'subtype']);
            });
        }

        // Muro y Parabús dejan de existir como tipos; se agrupan en Espectacular
        // (sin subtipo) para que sigan siendo editables con las nuevas reglas.
        DB::table('spaces')
            ->whereIn('type', ['Muro', 'muro', 'Parabus', 'parabus', 'Parabús', 'parabús'])
            ->update(['type' => 'Espectacular', 'updated_at' => Carbon::now()]);
    }

    public function down()
    {
        if (!Schema::hasTable('spaces') || !Schema::hasColumn('spaces', 'subtype')) {
            return;
        }

        Schema::table('spaces', function (Blueprint $table) {
            $table->dropIndex(['type', 'subtype']);
            $table->dropColumn('subtype');
        });
    }
}
