<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('quote_images', function (Blueprint $table) {
            $table->id();

            $table->foreignId('quote_id')
                ->constrained('quotes')
                ->cascadeOnDelete();

            $table->string('disk', 50)->default('public');
            $table->string('path');
            $table->string('filename');
            $table->string('original_name')->nullable();
            $table->string('mime_type', 100)->nullable();
            $table->unsignedBigInteger('size')->default(0);

            $table->boolean('is_cover')->default(false);
            $table->unsignedInteger('sort_order')->default(0);

            $table->timestamps();

            $table->index(['quote_id', 'sort_order']);
            $table->index(['quote_id', 'is_cover']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quote_images');
    }
};
