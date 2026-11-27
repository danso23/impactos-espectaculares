<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddRfcToCollaborators extends Migration
{
    public function up()
    {
        if (!Schema::hasTable('collaborators') || Schema::hasColumn('collaborators', 'rfc')) {
            return;
        }

        Schema::table('collaborators', function (Blueprint $table) {
            $table->string('rfc', 13)->nullable()->after('email');
            $table->index('rfc');
        });
    }

    public function down()
    {
        if (!Schema::hasTable('collaborators') || !Schema::hasColumn('collaborators', 'rfc')) {
            return;
        }

        Schema::table('collaborators', function (Blueprint $table) {
            $table->dropIndex(['rfc']);
            $table->dropColumn('rfc');
        });
    }
}
