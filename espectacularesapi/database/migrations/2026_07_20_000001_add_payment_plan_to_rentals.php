<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddPaymentPlanToRentals extends Migration
{
    public function up()
    {
        Schema::table('rentals', function (Blueprint $table) {
            $table->enum('payment_frequency', ['single', 'weekly', 'biweekly', 'monthly'])
                ->nullable()
                ->after('ends_at');
            $table->date('first_payment_date')->nullable()->after('payment_frequency');
            $table->unsignedInteger('payment_installments')->default(0)->after('first_payment_date');
        });
    }

    public function down()
    {
        Schema::table('rentals', function (Blueprint $table) {
            $table->dropColumn([
                'payment_frequency',
                'first_payment_date',
                'payment_installments',
            ]);
        });
    }
}
