<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('spaces', function (Blueprint $table) {
            $table->date('blocked_from')->nullable()->after('active');
            $table->date('blocked_until')->nullable()->after('blocked_from');
            $table->index(['active', 'blocked_from', 'blocked_until'], 'spaces_block_period_index');
        });

        $blockedSpaceIds = DB::table('spaces')->where('active', false)->pluck('id');

        foreach ($blockedSpaceIds as $spaceId) {
            $period = DB::table('quote_items')
                ->join('quotes', 'quotes.id', '=', 'quote_items.quote_id')
                ->join('quote_status', 'quote_status.id', '=', 'quotes.quote_status_id')
                ->where('quote_items.space_id', $spaceId)
                ->whereNotIn('quote_status.key', ['rejected', 'cancelled', 'expired'])
                ->whereNotNull('quote_items.start_date')
                ->whereNotNull('quote_items.end_date')
                ->orderByDesc('quote_items.end_date')
                ->select(['quote_items.start_date', 'quote_items.end_date'])
                ->first();

            if ($period) {
                DB::table('spaces')->where('id', $spaceId)->update([
                    'blocked_from' => $period->start_date,
                    'blocked_until' => $period->end_date,
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('spaces', function (Blueprint $table) {
            $table->dropIndex('spaces_block_period_index');
            $table->dropColumn(['blocked_from', 'blocked_until']);
        });
    }
};
