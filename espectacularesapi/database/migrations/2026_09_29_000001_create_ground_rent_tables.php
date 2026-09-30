<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('ground_properties')) {
            Schema::create('ground_properties', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('casero_id');
                $table->string('name', 150);
                $table->string('address', 255)->nullable();
                $table->text('notes')->nullable();
                $table->boolean('active')->default(true);
                $table->timestamps();
                $table->foreign('casero_id')->references('id')->on('caseros')->onDelete('cascade');
                $table->index(['casero_id', 'active']);
            });
        }

        if (!Schema::hasColumn('spaces', 'ground_property_id')) {
            Schema::table('spaces', function (Blueprint $table) {
                $table->unsignedBigInteger('ground_property_id')->nullable()->after('id');
                $table->foreign('ground_property_id')->references('id')->on('ground_properties')->nullOnDelete();
                $table->index('ground_property_id');
            });
        }

        if (!Schema::hasTable('ground_rent_contracts')) {
            Schema::create('ground_rent_contracts', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('ground_property_id');
                $table->string('contract_number', 80)->nullable();
                $table->date('starts_at');
                $table->date('first_payment_date');
                $table->enum('payment_frequency', ['monthly', 'quarterly', 'semiannual', 'annual']);
                $table->unsignedInteger('payment_count');
                $table->decimal('payment_amount', 12, 2);
                $table->enum('status', ['active', 'completed', 'cancelled'])->default('active');
                $table->text('notes')->nullable();
                $table->timestamps();
                $table->foreign('ground_property_id')->references('id')->on('ground_properties')->onDelete('cascade');
                $table->index(['ground_property_id', 'status']);
            });
        }

        if (!Schema::hasTable('ground_rent_payments')) {
            Schema::create('ground_rent_payments', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('ground_rent_contract_id');
                $table->unsignedInteger('installment_number');
                $table->date('period_start');
                $table->date('period_end');
                $table->date('due_date');
                $table->decimal('amount', 12, 2);
                $table->enum('status', ['pending', 'paid', 'overdue', 'cancelled'])->default('pending');
                $table->dateTime('paid_at')->nullable();
                $table->string('reference', 100)->nullable();
                $table->timestamps();
                $table->foreign('ground_rent_contract_id')->references('id')->on('ground_rent_contracts')->onDelete('cascade');
                $table->unique(['ground_rent_contract_id', 'installment_number'], 'ground_rent_payment_installment_uq');
                $table->index(['status', 'due_date']);
            });
        } else {
            Schema::table('ground_rent_payments', function (Blueprint $table) {
                $table->unique(['ground_rent_contract_id', 'installment_number'], 'ground_rent_payment_installment_uq');
                $table->index(['status', 'due_date']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('ground_rent_payments');
        Schema::dropIfExists('ground_rent_contracts');
        Schema::table('spaces', function (Blueprint $table) {
            $table->dropForeign(['ground_property_id']);
            $table->dropIndex(['ground_property_id']);
            $table->dropColumn('ground_property_id');
        });
        Schema::dropIfExists('ground_properties');
    }
};
