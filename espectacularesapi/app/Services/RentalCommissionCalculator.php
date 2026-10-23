<?php

namespace App\Services;

use App\Models\Entities\Agency;

class RentalCommissionCalculator
{
    public function calculate(array $payload, float $base, ?Agency $agency = null): array
    {
        $type = $payload['type'] ?? ($agency->commission_type ?? 'none');
        $value = round((float) ($payload['value'] ?? ($agency->commission_value ?? 0)), 2);
        $base = round(max(0, $base), 2);

        if (!in_array($type, ['none', 'percent', 'fixed'], true) || $value <= 0 || $base <= 0) {
            $type = 'none';
            $value = 0.0;
            $amount = 0.0;
        } elseif ($type === 'percent') {
            $amount = round($base * ($value / 100), 2);
        } else {
            $amount = round(min($value, $base), 2);
        }

        return [
            'commission_base' => $base,
            'commission_type' => $type,
            'commission_value' => $value,
            'commission_amount' => $amount,
        ];
    }
}
