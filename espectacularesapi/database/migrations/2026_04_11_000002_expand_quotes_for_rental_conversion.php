<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ExpandQuotesForRentalConversion extends Migration
{
    public function up()
    {
        $this->addColumnIfMissing('quotes', 'accepted_at', fn (Blueprint $table) => $table->timestamp('accepted_at')->nullable()->after('valid_until'));
        $this->addColumnIfMissing('quotes', 'accepted_by', fn (Blueprint $table) => $table->unsignedBigInteger('accepted_by')->nullable()->after('accepted_at'));
        $this->addColumnIfMissing('quotes', 'converted_to_rental_at', fn (Blueprint $table) => $table->timestamp('converted_to_rental_at')->nullable()->after('accepted_by'));
        $this->addColumnIfMissing('quotes', 'converted_to_rental_by', fn (Blueprint $table) => $table->unsignedBigInteger('converted_to_rental_by')->nullable()->after('converted_to_rental_at'));

        $this->addForeignIfMissing('quotes', 'quotes_accepted_by_foreign', function (Blueprint $table) {
            $table->foreign('accepted_by')->references('id')->on('users');
        });
        $this->addForeignIfMissing('quotes', 'quotes_converted_to_rental_by_foreign', function (Blueprint $table) {
            $table->foreign('converted_to_rental_by')->references('id')->on('users');
        });

        $this->addIndexIfMissing('quotes', 'quotes_accepted_by_index', function (Blueprint $table) {
            $table->index(['accepted_by']);
        });
        $this->addIndexIfMissing('quotes', 'quotes_converted_to_rental_by_index', function (Blueprint $table) {
            $table->index(['converted_to_rental_by']);
        });
        $this->addIndexIfMissing('quotes', 'quotes_converted_to_rental_at_index', function (Blueprint $table) {
            $table->index(['converted_to_rental_at']);
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
