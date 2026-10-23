<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CreateConfigurationsTable extends Migration
{
    public function up()
    {
        if (!Schema::hasTable('configurations')) {
            Schema::create('configurations', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->decimal('price_per_square_meter', 12, 2)->default(0);
                $table->timestamps();
            });
        }

        if (!DB::table('configurations')->exists()) {
            DB::table('configurations')->insert([
                'price_per_square_meter' => 0,
                'created_at' => \Carbon\Carbon::now(),
                'updated_at' => \Carbon\Carbon::now(),
            ]);
        }
    }

    public function down()
    {
        Schema::dropIfExists('configurations');
    }
}
