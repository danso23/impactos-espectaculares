<?php

namespace App\Services;

use App\Models\Entities\RentalItem;
use App\Models\Entities\Space;
use Illuminate\Support\Collection;

class SpaceAvailability
{
    /**
     * @param array<int, array{space_id:mixed,start_date:mixed,end_date:mixed}> $periods
     */
    public function conflictingSpaceIds(array $periods, ?int $excludeRentalId = null): Collection
    {
        $periods = collect($periods)
            ->filter(fn (array $period) => !empty($period['space_id']) && !empty($period['start_date']) && !empty($period['end_date']))
            ->map(fn (array $period) => [
                'space_id' => (int) $period['space_id'],
                'start_date' => (string) $period['start_date'],
                'end_date' => (string) $period['end_date'],
            ])
            ->values();

        if ($periods->isEmpty()) return collect();

        $rentalConflicts = RentalItem::query()
            ->where('status', 'active')
            ->whereHas('rental', fn ($query) => $query->where('status', 'active'))
            ->when($excludeRentalId, fn ($query) => $query->where('rental_id', '!=', $excludeRentalId))
            ->where(function ($query) use ($periods) {
                foreach ($periods as $period) {
                    $query->orWhere(function ($overlap) use ($period) {
                        $overlap->where('space_id', $period['space_id'])
                            ->whereDate('start_date', '<=', $period['end_date'])
                            ->whereDate('end_date', '>=', $period['start_date']);
                    });
                }
            })
            ->pluck('space_id')
            ->unique()
            ->values();

        $manualBlockConflicts = Space::query()
            ->where('active', false)
            ->where(function ($query) use ($periods) {
                foreach ($periods as $period) {
                    $query->orWhere(function ($overlap) use ($period) {
                        $overlap->whereKey($period['space_id'])
                            ->where(function ($start) use ($period) {
                                $start->whereNull('blocked_from')
                                    ->orWhereDate('blocked_from', '<=', $period['end_date']);
                            })
                            ->where(function ($end) use ($period) {
                                $end->whereNull('blocked_until')
                                    ->orWhereDate('blocked_until', '>=', $period['start_date']);
                            });
                    });
                }
            })
            ->pluck('id');

        return $rentalConflicts
            ->merge($manualBlockConflicts)
            ->unique()
            ->values();
    }
}
