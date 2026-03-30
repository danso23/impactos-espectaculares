<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateQuoteCatalogTables extends Migration
{
    public function up()
    {
        if (!Schema::hasTable('companies')) {
            Schema::create('companies', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->string('key', 50)->unique();
                $table->string('name', 150);
                $table->string('legal_name', 200);
                $table->string('rfc', 20)->nullable();
                $table->string('tax_regime', 100)->nullable();
                $table->string('address_line', 255)->nullable();
                $table->string('neighborhood', 120)->nullable();
                $table->string('city', 120)->nullable();
                $table->string('state', 120)->nullable();
                $table->string('postal_code', 10)->nullable();
                $table->string('country', 2)->default('MX');
                $table->string('phone', 30)->nullable();
                $table->string('email', 150)->nullable();
                $table->string('website', 255)->nullable();
                $table->string('logo_path', 255)->nullable();
                $table->text('default_terms_html')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('company_letterheads')) {
            Schema::create('company_letterheads', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('company_id');
                $table->string('name', 120);
                $table->string('code', 50)->nullable();
                $table->string('description', 255)->nullable();
                $table->string('template_key', 100);
                $table->string('header_image_path', 255)->nullable();
                $table->string('footer_image_path', 255)->nullable();
                $table->string('watermark_image_path', 255)->nullable();
                $table->string('primary_color', 20)->nullable();
                $table->string('secondary_color', 20)->nullable();
                $table->boolean('is_default')->default(false);
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->foreign('company_id')
                    ->references('id')
                    ->on('companies')
                    ->onDelete('cascade');

                $table->index(['company_id']);
                $table->index(['company_id', 'is_active']);
            });
        }

        if (!Schema::hasTable('agencies')) {
            Schema::create('agencies', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->string('name', 150);
                $table->string('legal_name', 200)->nullable();
                $table->string('contact_name', 150)->nullable();
                $table->string('email', 150)->nullable();
                $table->string('phone', 30)->nullable();
                $table->enum('discount_type', ['none', 'percent', 'fixed'])->default('none');
                $table->decimal('discount_value', 12, 2)->default(0);
                $table->enum('discount_applies_to', ['rentals_only', 'all_items'])->default('rentals_only');
                $table->enum('commission_type', ['none', 'percent', 'fixed'])->default('none');
                $table->decimal('commission_value', 12, 2)->default(0);
                $table->enum('commission_applies_to', ['rentals_only', 'subtotal_after_discount'])->default('subtotal_after_discount');
                $table->text('notes')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('services')) {
            Schema::create('services', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->string('key', 50)->nullable()->unique();
                $table->string('name', 150);
                $table->string('description', 255)->nullable();
                $table->decimal('base_price', 12, 2)->default(0);
                $table->decimal('tax_rate', 5, 2)->default(16.00);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
            return;
        }

        Schema::table('services', function (Blueprint $table) {
            if (!Schema::hasColumn('services', 'key')) {
                $table->string('key', 50)->nullable()->after('id');
            }
            if (!Schema::hasColumn('services', 'description')) {
                $table->string('description', 255)->nullable()->after('name');
            }
            if (!Schema::hasColumn('services', 'base_price')) {
                $table->decimal('base_price', 12, 2)->default(0)->after('description');
            }
            if (!Schema::hasColumn('services', 'tax_rate')) {
                $table->decimal('tax_rate', 5, 2)->default(16.00)->after('base_price');
            }
            if (!Schema::hasColumn('services', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('tax_rate');
            }
            if (!Schema::hasColumn('services', 'created_at')) {
                $table->timestamp('created_at')->nullable();
            }
            if (!Schema::hasColumn('services', 'updated_at')) {
                $table->timestamp('updated_at')->nullable();
            }
        });
    }

    public function down()
    {
        Schema::dropIfExists('agencies');
        Schema::dropIfExists('company_letterheads');
        Schema::dropIfExists('companies');
    }
}
