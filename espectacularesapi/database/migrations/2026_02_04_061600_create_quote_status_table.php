<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateQuoteStatusTable extends Migration
{
    public function up()
    {
        Schema::create('quote_status', function (Blueprint $table) {
            $table->bigIncrements('id');

            $table->string('key', 50)->unique();
            $table->string('name', 100);
            $table->string('description')->nullable();
            $table->string('color', 20)->nullable();
            $table->boolean('is_final')->default(false);
            $table->boolean('is_active')->default(true);

            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('quote_status');
    }
}