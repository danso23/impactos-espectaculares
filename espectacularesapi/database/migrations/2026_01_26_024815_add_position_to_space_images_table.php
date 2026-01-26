<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddPositionToSpaceImagesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('space_images', function (Blueprint $table) {
            $table->unsignedInteger('position')->default(0)->after('path');
        });
    }

    public function down()
    {
        Schema::table('space_images', function (Blueprint $table) {
            $table->dropColumn('position');
        });
    }
}
