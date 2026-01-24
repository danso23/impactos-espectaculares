<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('space_images', function (Blueprint $table) {
            $table->id();

            $table->foreignId('space_id')
                  ->constrained('spaces')
                  ->cascadeOnDelete();

            $table->string('filename');
            $table->string('path');

            $table->boolean('is_cover')->default(false);
            $table->integer('order_index')->default(0);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('space_images');
    }
};