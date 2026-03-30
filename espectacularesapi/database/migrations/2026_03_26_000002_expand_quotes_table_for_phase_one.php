<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ExpandQuotesTableForPhaseOne extends Migration
{
    public function up()
    {
        DB::statement('ALTER TABLE quotes MODIFY lead_id BIGINT UNSIGNED NULL');

        $this->addColumnIfMissing('quotes', 'customer_type', fn (Blueprint $table) => $table->string('customer_type', 20)->nullable());
        $this->addColumnIfMissing('quotes', 'customer_id', fn (Blueprint $table) => $table->unsignedBigInteger('customer_id')->nullable());
        $this->addColumnIfMissing('quotes', 'agency_id', fn (Blueprint $table) => $table->unsignedBigInteger('agency_id')->nullable());
        $this->addColumnIfMissing('quotes', 'issuer_company_id', fn (Blueprint $table) => $table->unsignedBigInteger('issuer_company_id')->nullable());
        $this->addColumnIfMissing('quotes', 'letterhead_id', fn (Blueprint $table) => $table->unsignedBigInteger('letterhead_id')->nullable());
        $this->addColumnIfMissing('quotes', 'version', fn (Blueprint $table) => $table->unsignedInteger('version')->default(1));
        $this->addColumnIfMissing('quotes', 'includes_tax', fn (Blueprint $table) => $table->boolean('includes_tax')->default(true));
        $this->addColumnIfMissing('quotes', 'tax_rate', fn (Blueprint $table) => $table->decimal('tax_rate', 5, 2)->default(16.00));
        $this->addColumnIfMissing('quotes', 'rentals_subtotal', fn (Blueprint $table) => $table->decimal('rentals_subtotal', 12, 2)->default(0));
        $this->addColumnIfMissing('quotes', 'services_subtotal', fn (Blueprint $table) => $table->decimal('services_subtotal', 12, 2)->default(0));
        $this->addColumnIfMissing('quotes', 'discount_base', fn (Blueprint $table) => $table->decimal('discount_base', 12, 2)->default(0));
        $this->addColumnIfMissing('quotes', 'discount_type', fn (Blueprint $table) => $table->enum('discount_type', ['none', 'percent', 'fixed'])->default('none'));
        $this->addColumnIfMissing('quotes', 'discount_value', fn (Blueprint $table) => $table->decimal('discount_value', 12, 2)->default(0));
        $this->addColumnIfMissing('quotes', 'commission_base', fn (Blueprint $table) => $table->decimal('commission_base', 12, 2)->default(0));
        $this->addColumnIfMissing('quotes', 'commission_type', fn (Blueprint $table) => $table->enum('commission_type', ['none', 'percent', 'fixed'])->default('none'));
        $this->addColumnIfMissing('quotes', 'commission_value', fn (Blueprint $table) => $table->decimal('commission_value', 12, 2)->default(0));
        $this->addColumnIfMissing('quotes', 'commission_amount', fn (Blueprint $table) => $table->decimal('commission_amount', 12, 2)->default(0));
        $this->addColumnIfMissing('quotes', 'terms_html', fn (Blueprint $table) => $table->longText('terms_html')->nullable());
        $this->addColumnIfMissing('quotes', 'pdf_path', fn (Blueprint $table) => $table->string('pdf_path', 255)->nullable());
        $this->addColumnIfMissing('quotes', 'pdf_generated_at', fn (Blueprint $table) => $table->timestamp('pdf_generated_at')->nullable());
        $this->addColumnIfMissing('quotes', 'snapshot_json', fn (Blueprint $table) => $table->json('snapshot_json')->nullable());

        $this->addForeignIfMissing('quotes', 'quotes_agency_id_foreign', function (Blueprint $table) {
            $table->foreign('agency_id')->references('id')->on('agencies');
        });
        $this->addForeignIfMissing('quotes', 'quotes_issuer_company_id_foreign', function (Blueprint $table) {
            $table->foreign('issuer_company_id')->references('id')->on('companies');
        });
        $this->addForeignIfMissing('quotes', 'quotes_letterhead_id_foreign', function (Blueprint $table) {
            $table->foreign('letterhead_id')->references('id')->on('company_letterheads');
        });

        $this->addIndexIfMissing('quotes', 'quotes_customer_type_customer_id_index', function (Blueprint $table) {
            $table->index(['customer_type', 'customer_id']);
        });
        $this->addIndexIfMissing('quotes', 'quotes_agency_id_index', function (Blueprint $table) {
            $table->index(['agency_id']);
        });
        $this->addIndexIfMissing('quotes', 'quotes_issuer_company_id_index', function (Blueprint $table) {
            $table->index(['issuer_company_id']);
        });
    }

    public function down()
    {
        Schema::table('quotes', function (Blueprint $table) {
            $table->dropForeign(['agency_id']);
            $table->dropForeign(['issuer_company_id']);
            $table->dropForeign(['letterhead_id']);
            $table->dropIndex(['customer_type', 'customer_id']);
            $table->dropIndex(['agency_id']);
            $table->dropIndex(['issuer_company_id']);

            $table->dropColumn([
                'customer_type',
                'customer_id',
                'agency_id',
                'issuer_company_id',
                'letterhead_id',
                'version',
                'includes_tax',
                'tax_rate',
                'rentals_subtotal',
                'services_subtotal',
                'discount_base',
                'discount_type',
                'discount_value',
                'commission_base',
                'commission_type',
                'commission_value',
                'commission_amount',
                'terms_html',
                'pdf_path',
                'pdf_generated_at',
                'snapshot_json',
            ]);
        });

        DB::statement('ALTER TABLE quotes MODIFY lead_id BIGINT UNSIGNED NOT NULL');
    }

    private function addColumnIfMissing(string $tableName, string $columnName, callable $callback): void
    {
        if (Schema::hasColumn($tableName, $columnName)) {
            return;
        }

        Schema::table($tableName, $callback);
    }

    private function addForeignIfMissing(string $tableName, string $constraintName, callable $callback): void
    {
        if ($this->constraintExists($tableName, $constraintName)) {
            return;
        }

        Schema::table($tableName, $callback);
    }

    private function addIndexIfMissing(string $tableName, string $indexName, callable $callback): void
    {
        if ($this->indexExists($tableName, $indexName)) {
            return;
        }

        Schema::table($tableName, $callback);
    }

    private function constraintExists(string $tableName, string $constraintName): bool
    {
        $database = DB::getDatabaseName();

        $result = DB::selectOne(
            'SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_NAME = ?',
            [$database, $tableName, $constraintName]
        );

        return $result !== null;
    }

    private function indexExists(string $tableName, string $indexName): bool
    {
        $database = DB::getDatabaseName();

        $result = DB::selectOne(
            'SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1',
            [$database, $tableName, $indexName]
        );

        return $result !== null;
    }
}
