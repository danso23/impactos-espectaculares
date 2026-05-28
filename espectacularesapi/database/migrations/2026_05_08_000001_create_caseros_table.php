<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCaserosTable extends Migration
{
    public function up()
    {
        if (Schema::hasTable('caseros')) {
            return;
        }

        Schema::create('caseros', function (Blueprint $table) {
            $table->bigIncrements('id');

            $table->string('nombre', 100);
            $table->string('apellido_paterno', 100)->nullable();
            $table->string('apellido_materno', 100)->nullable();

            $table->string('telefono', 30)->nullable();
            $table->string('telefono_2', 30)->nullable();
            $table->string('email', 150)->nullable();

            $table->string('rfc', 13)->nullable()->unique();
            $table->string('curp', 18)->nullable()->unique();

            $table->string('direccion', 255)->nullable();
            $table->string('colonia', 120)->nullable();
            $table->string('ciudad', 120)->nullable();
            $table->string('estado', 120)->nullable();
            $table->string('cp', 10)->nullable();

            // Datos de pago
            $table->decimal('monto_renta', 10, 2)->nullable();
            $table->unsignedTinyInteger('dia_pago')->nullable();
            $table->string('metodo_pago', 50)->nullable();
            $table->string('banco', 80)->nullable();
            $table->string('cuenta_banco', 30)->nullable();
            $table->string('clabe', 18)->nullable();

            $table->text('notes')->nullable();
            $table->boolean('active')->default(true);

            $table->timestamps();

            $table->index(['telefono']);
            $table->index(['email']);
            $table->index(['active']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('caseros');
    }
}
