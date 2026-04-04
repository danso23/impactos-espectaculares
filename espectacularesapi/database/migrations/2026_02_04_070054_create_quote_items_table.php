<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateQuoteItemsTable extends Migration
{
    public function up()
    {
        Schema::create('quote_items', function (Blueprint $table) {
            $table->bigIncrements('id');

            $table->unsignedBigInteger('quote_id');
            $table->unsignedBigInteger('space_id');

            $table->date('start_date');
            $table->date('end_date');

            $table->decimal('unit_price', 12, 2);
            $table->unsignedInteger('qty')->default(1);
            $table->decimal('subtotal', 12, 2)->default(0);

            $table->unsignedInteger('faces')->nullable();
            $table->decimal('production_cost', 12, 2)->nullable();
            $table->string('notes', 255)->nullable();

            $table->timestamps();

            $table->foreign('quote_id')
                ->references('id')
                ->on('quotes')
                ->onDelete('cascade');

            $table->foreign('space_id')
                ->references('id')
                ->on('spaces');

            $table->index(['quote_id']);
            $table->index(['space_id']);
            $table->index(['space_id', 'start_date', 'end_date']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('quote_items');
    }
}