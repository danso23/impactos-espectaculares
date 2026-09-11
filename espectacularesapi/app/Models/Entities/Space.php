<?php

namespace App\Models\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class Space extends Model
{
    protected $table = 'spaces';

    protected $fillable = [
        'title',
        'price',
        'type',
        'socioeconomic_level',
        'width_m',
        'height_m',
        'has_lights',
        'assigned_id',
        'faces',
        'view_type',
        'description',
        'comments',
        'latitude',
        'longitude',
        'active',
        'is_rotating',
        'blocked_from',
        'blocked_until',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'width_m' => 'decimal:2',
        'height_m' => 'decimal:2',
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'has_lights' => 'boolean',
        'faces' => 'integer',
        'active' => 'boolean',
        'is_rotating' => 'boolean',
        'blocked_from' => 'date:Y-m-d',
        'blocked_until' => 'date:Y-m-d',
    ];

    public function scopeWithBlockStatus($query)
    {
        $today = Carbon::today()->toDateString();

        return $query->selectRaw(
            "CASE
                WHEN COALESCE(spaces.active, 0) = 0
                  AND (spaces.blocked_from IS NULL OR spaces.blocked_from <= ?)
                  AND (spaces.blocked_until IS NULL OR spaces.blocked_until >= ?)
                THEN 1
                ELSE 0
            END AS is_blocked_now",
            [$today, $today]
        );
    }

    public function scopeCurrentlyBlocked($query)
    {
        $today = Carbon::today()->toDateString();

        return $query
            ->where('active', false)
            ->where(function ($start) use ($today) {
                $start->whereNull('blocked_from')->orWhereDate('blocked_from', '<=', $today);
            })
            ->where(function ($end) use ($today) {
                $end->whereNull('blocked_until')->orWhereDate('blocked_until', '>=', $today);
            });
    }

    public function scopeCurrentlyAvailable($query)
    {
        $today = Carbon::today()->toDateString();

        return $query->where(function ($available) use ($today) {
            $available
                ->where('active', true)
                ->orWhere(function ($outsideBlock) use ($today) {
                    $outsideBlock
                        ->where('active', false)
                        ->where(function ($outsideDates) use ($today) {
                            $outsideDates
                                ->whereDate('blocked_from', '>', $today)
                                ->orWhereDate('blocked_until', '<', $today);
                        });
                });
        });
    }
    
    public function images()
    {
        return $this->hasMany(SpaceImage::class)
            ->orderByDesc('is_cover')
            ->orderBy('position')
            ->orderBy('id');
    }
}
