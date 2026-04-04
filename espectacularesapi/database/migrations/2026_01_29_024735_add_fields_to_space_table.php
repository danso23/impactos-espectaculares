<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('spaces', function (Blueprint $table) {

            // ¿Tiene luces?
            $table->boolean('has_lights')
                ->default(false)
                ->after('type');

            // ID asignado (ej: código interno o folio)
            $table->string('assigned_id')
                ->nullable()
                ->after('has_lights');

            // Número de caras
            $table->unsignedInteger('faces')
                ->default(1)
                ->after('assigned_id');

            // Tipo de vista (ej: frontal, lateral, doble)
            $table->string('view_type')
                ->nullable()
                ->after('faces');
        });
    }

    public function down()
    {
        Schema::table('spaces', function (Blueprint $table) {
            $table->dropColumn([
                'has_lights',
                'assigned_id',
                'faces',
                'view_type',
            ]);
        });
    }
};