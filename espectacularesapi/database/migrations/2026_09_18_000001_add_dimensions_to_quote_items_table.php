<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddDimensionsToQuoteItemsTable extends Migration
{
    public function up()
    {
        Schema::table('quote_items', function (Blueprint $table) {
            $table->decimal('width_m', 12, 2)->nullable()->after('qty');
            $table->decimal('height_m', 12, 2)->nullable()->after('width_m');
        });
    }

    public function down()
    {
        Schema::table('quote_items', function (Blueprint $table) {
            $table->dropColumn(['width_m', 'height_m']);
        });
    }
}
