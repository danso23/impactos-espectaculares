<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddSquareMetersToQuoteItemsTable extends Migration
{
    public function up()
    {
        if (!Schema::hasColumn('quote_items', 'square_meters')) {
            Schema::table('quote_items', function (Blueprint $table) {
                $table->decimal('square_meters', 12, 2)->default(1)->after('qty');
            });
        }
    }

    public function down()
    {
        if (Schema::hasColumn('quote_items', 'square_meters')) {
            Schema::table('quote_items', function (Blueprint $table) {
                $table->dropColumn('square_meters');
            });
        }
    }
}
