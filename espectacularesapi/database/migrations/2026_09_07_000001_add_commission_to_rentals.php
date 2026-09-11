<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddCommissionToRentals extends Migration
{
    public function up()
    {
        Schema::table('rentals', function (Blueprint $table) {
            $table->decimal('commission_base', 12, 2)->default(0)->after('payment_installments');
            $table->enum('commission_type', ['none', 'percent', 'fixed'])->default('none')->after('commission_base');
            $table->decimal('commission_value', 12, 2)->default(0)->after('commission_type');
            $table->decimal('commission_amount', 12, 2)->default(0)->after('commission_value');
        });
    }

    public function down()
    {
        Schema::table('rentals', function (Blueprint $table) {
            $table->dropColumn([
                'commission_base',
                'commission_type',
                'commission_value',
                'commission_amount',
            ]);
        });
    }
}
