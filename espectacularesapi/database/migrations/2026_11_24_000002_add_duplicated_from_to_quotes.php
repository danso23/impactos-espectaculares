<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddDuplicatedFromToQuotes extends Migration
{
    public function up()
    {
        if (!Schema::hasTable('quotes') || Schema::hasColumn('quotes', 'duplicated_from_quote_id')) {
            return;
        }

        Schema::table('quotes', function (Blueprint $table) {
            $table->unsignedBigInteger('duplicated_from_quote_id')->nullable()->after('version');
            $table->index('duplicated_from_quote_id');
        });
    }

    public function down()
    {
        if (!Schema::hasTable('quotes') || !Schema::hasColumn('quotes', 'duplicated_from_quote_id')) {
            return;
        }

        Schema::table('quotes', function (Blueprint $table) {
            $table->dropIndex(['duplicated_from_quote_id']);
            $table->dropColumn('duplicated_from_quote_id');
        });
    }
}
