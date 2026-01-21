<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('spaces', function (Blueprint $table) {
            $table->id();

            $table->string('title');
            $table->decimal('price', 12, 2)->nullable();
            $table->string('type', 50)->nullable();
            $table->string('socioeconomic_level', 50)->nullable();

            $table->decimal('width_m', 10, 2)->nullable();
            $table->decimal('height_m', 10, 2)->nullable();

            $table->text('description')->nullable();
            $table->text('comments')->nullable();

            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();

            $table->boolean('active')->default(true);

            $table->timestamps();

            $table->index(['latitude', 'longitude']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('spaces');
    }
};