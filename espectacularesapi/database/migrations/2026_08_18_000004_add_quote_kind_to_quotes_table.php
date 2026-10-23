<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('quotes', 'quote_kind')) {
            Schema::table('quotes', function (Blueprint $table) {
                $table->string('quote_kind', 32)->default('space')->after('version')->index();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('quotes', 'quote_kind')) {
            Schema::table('quotes', function (Blueprint $table) {
                $table->dropIndex(['quote_kind']);
                $table->dropColumn('quote_kind');
            });
        }
    }
};
