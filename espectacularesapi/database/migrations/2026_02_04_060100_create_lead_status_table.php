<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateLeadStatusTable extends Migration
{
    public function up()
    {
        Schema::create('lead_status', function (Blueprint $table) {
            $table->bigIncrements('id');

            $table->string('key', 50)->unique();   // new, contacted, quoted, won, lost
            $table->string('name', 100);
            $table->string('color', 20)->nullable();
            $table->boolean('is_final')->default(false);
            $table->boolean('is_active')->default(true);

            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('lead_status');
    }
}