<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateInvoicesTable extends Migration
{
    public function up()
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->bigIncrements('id');

            $table->unsignedBigInteger('rental_id');

            $table->string('folio', 50)->nullable();

            $table->enum('status', [
                'draft',
                'issued',
                'paid',
                'overdue',
                'cancelled'
            ])->default('issued');

            $table->date('period_start');
            $table->date('period_end');
            $table->date('due_date')->nullable();

            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('tax', 12, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);

            $table->timestamps();

            $table->foreign('rental_id')
                ->references('id')
                ->on('rentals')
                ->onDelete('cascade');

            $table->index(['rental_id']);
            $table->index(['status']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('invoices');
    }
}