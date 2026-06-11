<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ExpandRentalsForQuoteConversion extends Migration
{
    public function up()
    {
        $this->addColumnIfMissing('rentals', 'quote_id', fn (Blueprint $table) => $table->unsignedBigInteger('quote_id')->nullable()->after('id'));
        $this->addColumnIfMissing('rentals', 'customer_type', fn (Blueprint $table) => $table->string('customer_type', 20)->nullable()->after('quote_id'));
        $this->addColumnIfMissing('rentals', 'customer_id', fn (Blueprint $table) => $table->unsignedBigInteger('customer_id')->nullable()->after('customer_type'));
        $this->addColumnIfMissing('rentals', 'agency_id', fn (Blueprint $table) => $table->unsignedBigInteger('agency_id')->nullable()->after('customer_id'));
        $this->addColumnIfMissing('rentals', 'issuer_company_id', fn (Blueprint $table) => $table->unsignedBigInteger('issuer_company_id')->nullable()->after('agency_id'));
        $this->addColumnIfMissing('rentals', 'created_by', fn (Blueprint $table) => $table->unsignedBigInteger('created_by')->nullable()->after('issuer_company_id'));
        $this->addColumnIfMissing('rentals', 'status', fn (Blueprint $table) => $table->enum('status', ['draft', 'active', 'completed', 'cancelled'])->default('draft')->after('created_by'));
        $this->addColumnIfMissing('rentals', 'starts_at', fn (Blueprint $table) => $table->date('starts_at')->nullable()->after('status'));
        $this->addColumnIfMissing('rentals', 'ends_at', fn (Blueprint $table) => $table->date('ends_at')->nullable()->after('starts_at'));
        $this->addColumnIfMissing('rentals', 'subtotal', fn (Blueprint $table) => $table->decimal('subtotal', 12, 2)->default(0)->after('ends_at'));
        $this->addColumnIfMissing('rentals', 'tax', fn (Blueprint $table) => $table->decimal('tax', 12, 2)->default(0)->after('subtotal'));
        $this->addColumnIfMissing('rentals', 'total', fn (Blueprint $table) => $table->decimal('total', 12, 2)->default(0)->after('tax'));
        $this->addColumnIfMissing('rentals', 'notes', fn (Blueprint $table) => $table->text('notes')->nullable()->after('total'));
        $this->addColumnIfMissing('rentals', 'snapshot_json', fn (Blueprint $table) => $table->json('snapshot_json')->nullable()->after('notes'));

        $this->addForeignIfMissing('rentals', 'rentals_quote_id_foreign', function (Blueprint $table) {
            $table->foreign('quote_id')->references('id')->on('quotes');
        });
        $this->addForeignIfMissing('rentals', 'rentals_agency_id_foreign', function (Blueprint $table) {
            $table->foreign('agency_id')->references('id')->on('agencies');
        });
        $this->addForeignIfMissing('rentals', 'rentals_issuer_company_id_foreign', function (Blueprint $table) {
            $table->foreign('issuer_company_id')->references('id')->on('companies');
        });
        $this->addForeignIfMissing('rentals', 'rentals_created_by_foreign', function (Blueprint $table) {
            $table->foreign('created_by')->references('id')->on('users');
        });

        $this->addIndexIfMissing('rentals', 'rentals_quote_id_unique', function (Blueprint $table) {
            $table->unique(['quote_id']);
        });
        $this->addIndexIfMissing('rentals', 'rentals_customer_type_customer_id_index', function (Blueprint $table) {
            $table->index(['customer_type', 'customer_id']);
        });
        $this->addIndexIfMissing('rentals', 'rentals_status_index', function (Blueprint $table) {
            $table->index(['status']);
        });

        $this->addColumnIfMissing('rental_items', 'quote_item_id', fn (Blueprint $table) => $table->unsignedBigInteger('quote_item_id')->nullable()->after('rental_id'));

        $this->addForeignIfMissing('rental_items', 'rental_items_quote_item_id_foreign', function (Blueprint $table) {
            $table->foreign('quote_item_id')->references('id')->on('quote_items');
        });
        $this->addIndexIfMissing('rental_items', 'rental_items_quote_item_id_index', function (Blueprint $table) {
            $table->index(['quote_item_id']);
        });
    }

    public function down()
    {
        // No-op: migration de compatibilidad/expansión.
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
