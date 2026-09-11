<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddIsRotatingToSpacesAndRentals extends Migration
{
    public function up()
    {
        if (Schema::hasTable('spaces') && !Schema::hasColumn('spaces', 'is_rotating')) {
            Schema::table('spaces', function (Blueprint $table) {
                $table->boolean('is_rotating')->default(false)->after('active')->index();
            });
        }

        if (Schema::hasTable('rentals') && !Schema::hasColumn('rentals', 'is_rotating')) {
            Schema::table('rentals', function (Blueprint $table) {
                $table->boolean('is_rotating')->default(false)->after('status')->index();
            });
        }
    }

    public function down()
    {
        if (Schema::hasTable('rentals') && Schema::hasColumn('rentals', 'is_rotating')) {
            Schema::table('rentals', function (Blueprint $table) {
                $table->dropColumn('is_rotating');
            });
        }

        if (Schema::hasTable('spaces') && Schema::hasColumn('spaces', 'is_rotating')) {
            Schema::table('spaces', function (Blueprint $table) {
                $table->dropColumn('is_rotating');
            });
        }
    }
}
