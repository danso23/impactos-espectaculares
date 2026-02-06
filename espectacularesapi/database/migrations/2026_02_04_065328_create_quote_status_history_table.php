<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateQuoteStatusHistoryTable extends Migration
{
    public function up()
    {
        Schema::create('quote_status_history', function (Blueprint $table) {
            $table->bigIncrements('id');

            $table->unsignedBigInteger('quote_id');

            $table->unsignedBigInteger('from_status_id')->nullable();
            $table->unsignedBigInteger('to_status_id');

            $table->unsignedBigInteger('changed_by')->nullable();
            $table->string('reason', 255)->nullable();
            $table->text('notes')->nullable();

            $table->timestamp('changed_at')->useCurrent();

            // "snapshot"
            $table->json('meta')->nullable();

            $table->timestamps();

            $table->foreign('quote_id')
                ->references('id')
                ->on('quotes')
                ->onDelete('cascade');

            $table->foreign('from_status_id')
                ->references('id')
                ->on('quote_status');

            $table->foreign('to_status_id')
                ->references('id')
                ->on('quote_status');

            $table->foreign('changed_by')
                ->references('id')
                ->on('users');

            $table->index(['quote_id', 'changed_at']);
            $table->index(['to_status_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('quote_status_history');
    }
}