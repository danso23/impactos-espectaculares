<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class UpdateCaserosChangeDiaPagoToPeriodicidad extends Migration
{
    public function up()
    {
        Schema::table('caseros', function (Blueprint $table) {
            // Cambiamos dia_pago (integer) por periodicidad (string)
            $table->string('periodicidad', 50)->nullable()->after('monto_renta');
            $table->dropColumn('dia_pago');
        });
    }

    public function down()
    {
        Schema::table('caseros', function (Blueprint $table) {
            $table->unsignedTinyInteger('dia_pago')->nullable()->after('monto_renta');
            $table->dropColumn('periodicidad');
        });
    }
}
