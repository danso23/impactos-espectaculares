<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateClientesTable extends Migration
{
    public function up()
    {
        if (Schema::hasTable('clientes')) {
            return;
        }

        Schema::create('clientes', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('lead_id')->nullable()->unique();

            $table->string('nombre', 100);
            $table->string('apellido_paterno', 100)->nullable();
            $table->string('apellido_materno', 100)->nullable();
            $table->string('curp', 18)->nullable()->unique();
            $table->string('rfc', 13)->nullable()->unique();

            $table->string('negocio', 150)->nullable();
            $table->string('razon_social', 200)->nullable();
            $table->string('giro', 150)->nullable();

            $table->string('email', 150)->nullable();
            $table->string('telefono', 30)->nullable();
            $table->string('telefono_2', 30)->nullable();

            $table->string('direccion', 255)->nullable();
            $table->string('colonia', 120)->nullable();
            $table->string('ciudad', 120)->nullable();
            $table->string('estado', 120)->nullable();
            $table->string('cp', 10)->nullable();

            $table->string('nombre_aval', 150)->nullable();
            $table->string('telefono_aval', 30)->nullable();
            $table->string('direccion_aval', 255)->nullable();

            $table->string('source', 80)->nullable();
            $table->text('notes')->nullable();
            $table->string('usuario', 100)->nullable();

            $table->timestamps();

            $table->index(['telefono']);
            $table->index(['email']);
            $table->index(['usuario']);
            $table->foreign('lead_id')->references('id')->on('leads');
        });
    }

    public function down()
    {
        Schema::dropIfExists('clientes');
    }
}
