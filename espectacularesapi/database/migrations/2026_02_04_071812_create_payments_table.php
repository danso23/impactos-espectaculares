<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePaymentsTable extends Migration
{
    public function up()
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->bigIncrements('id');

            $table->unsignedBigInteger('invoice_id');

            $table->decimal('amount', 12, 2);
            $table->enum('method', [
                'Efectivo',
                'Transferencia',
                'Tarjeta',
                'Paypal',
                'Otro'
            ])->default('Transferencia');

            $table->string('reference', 100)->nullable();
            $table->dateTime('paid_at');

            $table->timestamps();

            $table->foreign('invoice_id')
                ->references('id')
                ->on('invoices')
                ->onDelete('cascade');

            $table->index(['invoice_id']);
            $table->index(['paid_at']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('payments');
    }
}