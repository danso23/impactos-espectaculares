<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ExpandQuoteItemsTableForPhaseOne extends Migration
{
    public function up()
    {
        $this->addColumnIfMissing('quote_items', 'service_id', fn (Blueprint $table) => $table->unsignedBigInteger('service_id')->nullable());
        $this->addColumnIfMissing('quote_items', 'item_type', fn (Blueprint $table) => $table->enum('item_type', ['rental', 'service'])->default('rental'));
        $this->addColumnIfMissing('quote_items', 'concept', fn (Blueprint $table) => $table->string('concept', 255)->nullable());
        $this->addColumnIfMissing('quote_items', 'description', fn (Blueprint $table) => $table->text('description')->nullable());
        $this->addColumnIfMissing('quote_items', 'sort_order', fn (Blueprint $table) => $table->unsignedInteger('sort_order')->default(0));
        $this->addColumnIfMissing('quote_items', 'discount_applies', fn (Blueprint $table) => $table->boolean('discount_applies')->default(true));
        $this->addColumnIfMissing('quote_items', 'tax_rate', fn (Blueprint $table) => $table->decimal('tax_rate', 5, 2)->default(16.00));
        $this->addColumnIfMissing('quote_items', 'tax_amount', fn (Blueprint $table) => $table->decimal('tax_amount', 12, 2)->default(0));
        $this->addColumnIfMissing('quote_items', 'total', fn (Blueprint $table) => $table->decimal('total', 12, 2)->default(0));

        $this->addForeignIfMissing('quote_items', 'quote_items_service_id_foreign', function (Blueprint $table) {
            $table->foreign('service_id')->references('id')->on('services');
        });
        $this->addIndexIfMissing('quote_items', 'quote_items_service_id_index', function (Blueprint $table) {
            $table->index(['service_id']);
        });
        $this->addIndexIfMissing('quote_items', 'quote_items_item_type_index', function (Blueprint $table) {
            $table->index(['item_type']);
        });

        DB::statement('ALTER TABLE quote_items MODIFY space_id BIGINT UNSIGNED NULL');
        DB::statement('ALTER TABLE quote_items MODIFY start_date DATE NULL');
        DB::statement('ALTER TABLE quote_items MODIFY end_date DATE NULL');
    }

    public function down()
    {
        DB::statement('ALTER TABLE quote_items MODIFY space_id BIGINT UNSIGNED NOT NULL');
        DB::statement('ALTER TABLE quote_items MODIFY start_date DATE NOT NULL');
        DB::statement('ALTER TABLE quote_items MODIFY end_date DATE NOT NULL');

        Schema::table('quote_items', function (Blueprint $table) {
            $table->dropForeign(['service_id']);
            $table->dropIndex(['service_id']);
            $table->dropIndex(['item_type']);
            $table->dropColumn([
                'service_id',
                'item_type',
                'concept',
                'description',
                'sort_order',
                'discount_applies',
                'tax_rate',
                'tax_amount',
                'total',
            ]);
        });
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
