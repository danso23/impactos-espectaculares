<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up() {
        DB::statement("ALTER TABLE users MODIFY api_token VARCHAR(255) NULL");
    }

    public function down() {
        DB::statement("ALTER TABLE users MODIFY api_token VARCHAR(150) NULL");
    }
};