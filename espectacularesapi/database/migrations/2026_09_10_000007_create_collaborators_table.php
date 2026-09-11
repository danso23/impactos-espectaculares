<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCollaboratorsTable extends Migration
{
    public function up()
    {
        if (Schema::hasTable('collaborators')) {
            return;
        }

        Schema::create('collaborators', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name', 150);
            $table->string('position', 120)->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('email', 150)->nullable();
            $table->text('notes')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->index('name');
            $table->index('active');
        });
    }

    public function down()
    {
        Schema::dropIfExists('collaborators');
    }
}
