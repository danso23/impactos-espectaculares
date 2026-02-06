<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateLeadsTable extends Migration
{
    public function up()
    {
        Schema::create('leads', function (Blueprint $table) {
            $table->bigIncrements('id');

            // Cliente
            $table->string('nombre', 100);
            $table->string('apellido_paterno', 100)->nullable();
            $table->string('apellido_materno', 100)->nullable();
            $table->string('curp', 18)->nullable(); // en MX 18 chars
            $table->string('rfc', 13)->nullable();  // opcional

            // Empresa / Negocio
            $table->string('negocio', 150)->nullable(); // nombre comercial
            $table->string('razon_social', 200)->nullable();
            $table->string('giro', 150)->nullable();

            // Contacto
            $table->string('email', 150)->nullable();
            $table->string('telefono', 30)->nullable();
            $table->string('telefono_2', 30)->nullable();

            // Dirección (cliente)
            $table->string('direccion', 255)->nullable();
            $table->string('colonia', 120)->nullable();
            $table->string('ciudad', 120)->nullable();
            $table->string('estado', 120)->nullable();
            $table->string('cp', 10)->nullable();

            // Aval (opcional, como en tu diagrama)
            $table->string('nombre_aval', 150)->nullable();
            $table->string('telefono_aval', 30)->nullable();
            $table->string('direccion_aval', 255)->nullable();

            // Control CRM
            $table->unsignedBigInteger('lead_status_id')->nullable();
            $table->unsignedBigInteger('assigned_to')->nullable(); // user_id (vendedor)
            $table->string('source', 80)->nullable();              // FB, IG, Referido, etc.
            $table->unsignedTinyInteger('priority')->default(2);   // 1 alta, 2 media, 3 baja

            $table->text('notes')->nullable();

            $table->timestamps();

            // Índices / uniques opcionales (depende tu negocio)
            $table->index(['lead_status_id']);
            $table->index(['assigned_to']);
            $table->index(['telefono']);
            $table->index(['email']);
            
            $table->unique(['curp']); // si manejas curp como único
            $table->unique(['rfc']);  // o rfc

            $table->foreign('lead_status_id')->references('id')->on('lead_status');
            $table->foreign('assigned_to')->references('id')->on('users');
        });
    }

    public function down()
    {
        Schema::dropIfExists('leads');
    }
}