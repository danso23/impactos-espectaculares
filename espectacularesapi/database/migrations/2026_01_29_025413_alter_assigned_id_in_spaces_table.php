<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AlterAssignedIdInSpacesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        DB::statement("ALTER TABLE spaces MODIFY assigned_id VARCHAR(50) NULL");
    }

    public function down()
    {
        DB::statement("ALTER TABLE spaces MODIFY assigned_id VARCHAR(255) NULL");
    }
}
