<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateQuotesTable extends Migration
{
    public function up()
    {
        Schema::create('quotes', function (Blueprint $table) {
            $table->bigIncrements('id');

            $table->unsignedBigInteger('lead_id');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->unsignedBigInteger('quote_status_id');

            $table->string('folio', 50)->nullable();
            $table->string('currency', 10)->default('MXN');

            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('discount', 12, 2)->default(0);
            $table->decimal('tax', 12, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);

            $table->date('valid_until')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();

            $table->foreign('lead_id')->references('id')->on('leads');
            $table->foreign('user_id')->references('id')->on('users');
            $table->foreign('quote_status_id')->references('id')->on('quote_status');

            $table->index(['lead_id']);
            $table->index(['quote_status_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('quotes');
    }
}