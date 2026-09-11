<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AddAnnualRentalPaymentFrequency extends Migration
{
    public function up()
    {
        if (!Schema::hasTable('rentals') || !Schema::hasColumn('rentals', 'payment_frequency')) {
            return;
        }

        DB::statement("ALTER TABLE rentals MODIFY payment_frequency ENUM('single','weekly','biweekly','monthly','annual') NULL");
    }

    public function down()
    {
        if (!Schema::hasTable('rentals') || !Schema::hasColumn('rentals', 'payment_frequency')) {
            return;
        }

        DB::table('rentals')->where('payment_frequency', 'annual')->update(['payment_frequency' => 'monthly']);
        DB::statement("ALTER TABLE rentals MODIFY payment_frequency ENUM('single','weekly','biweekly','monthly') NULL");
    }
}
