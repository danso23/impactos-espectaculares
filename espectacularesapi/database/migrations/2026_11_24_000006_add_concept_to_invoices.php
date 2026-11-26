<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddConceptToInvoices extends Migration
{
    public function up()
    {
        if (!Schema::hasColumn('invoices', 'concept')) {
            Schema::table('invoices', function (Blueprint $table) {
                // Qué cubre el cobro, p. ej. "Renta: Anuncio 233 + Instalación de lonas ($1,500.00)".
                $table->string('concept', 500)->nullable()->after('folio');
            });
        }
    }

    public function down()
    {
        if (Schema::hasColumn('invoices', 'concept')) {
            Schema::table('invoices', function (Blueprint $table) {
                $table->dropColumn('concept');
            });
        }
    }
}
