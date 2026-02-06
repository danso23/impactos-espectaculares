<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateRentalItemsTable extends Migration
{
    public function up()
    {
        Schema::create('rental_items', function (Blueprint $table) {
            $table->bigIncrements('id');

            $table->unsignedBigInteger('rental_id');
            $table->unsignedBigInteger('space_id');

            $table->date('start_date');
            $table->date('end_date');

            $table->decimal('unit_price', 12, 2);
            $table->unsignedInteger('qty')->default(1);
            $table->decimal('subtotal', 12, 2)->default(0);

            $table->enum('status', [
                'active',
                'ended',
                'cancelled'
            ])->default('active');

            $table->timestamps();

            $table->foreign('rental_id')
                ->references('id')
                ->on('rentals')
                ->onDelete('cascade');

            $table->foreign('space_id')
                ->references('id')
                ->on('spaces');

            $table->index(['rental_id']);
            $table->index(['space_id']);
            $table->index(['space_id', 'start_date', 'end_date']);
            $table->index(['space_id', 'status']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('rental_items');
    }
}