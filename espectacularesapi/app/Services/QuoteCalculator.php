<?php

namespace App\Services;

use App\Models\Entities\Agency;
use App\Models\Entities\Company;

class QuoteCalculator
{
    public function calculate(array $payload, ?Agency $agency = null, ?Company $company = null): array
    {
        $includesTax = (bool)($payload['includes_tax'] ?? true);
        $quoteTaxRate = $this->toFloat($payload['tax_rate'] ?? 16);

        $discountType = $payload['discount']['type'] ?? ($agency->discount_type ?? 'none');
        $discountValue = $this->toFloat($payload['discount']['value'] ?? ($agency->discount_value ?? 0));

        $items = [];
        $rentalsSubtotal = 0.0;
        $servicesSubtotal = 0.0;
        $discountBase = 0.0;

        foreach (($payload['items'] ?? []) as $index => $item) {
            $itemType = $item['item_type'] ?? 'rental';
            $qty = max(1, (int)($item['qty'] ?? 1));
            $squareMeters = max(0.01, $this->toFloat($item['square_meters'] ?? 1));
            $unitPrice = $this->toFloat($item['unit_price'] ?? 0);
            $lineMultiplier = $itemType === 'service' ? $qty * $squareMeters : $qty;
            $subtotal = round($lineMultiplier * $unitPrice, 2);
            $discountApplies = array_key_exists('discount_applies', $item)
                ? filter_var($item['discount_applies'], FILTER_VALIDATE_BOOLEAN)
                : $itemType === 'rental';
            $itemTaxRate = $this->toFloat($item['tax_rate'] ?? $quoteTaxRate);

            $normalized = [
                'item_type' => $itemType,
                'space_id' => $item['space_id'] ?? null,
                'service_id' => $item['service_id'] ?? null,
                'concept' => trim((string)($item['concept'] ?? '')),
                'description' => $item['description'] ?? null,
                'start_date' => $item['start_date'] ?? null,
                'end_date' => $item['end_date'] ?? null,
                'qty' => $qty,
                'unit_price' => $unitPrice,
                'subtotal' => $subtotal,
                'faces' => isset($item['faces']) ? (int)$item['faces'] : null,
                'production_cost' => isset($item['production_cost']) ? $this->toFloat($item['production_cost']) : null,
                'notes' => $item['notes'] ?? null,
                'sort_order' => isset($item['sort_order']) ? (int)$item['sort_order'] : $index,
                'discount_applies' => $discountApplies,
                'tax_rate' => $itemTaxRate,
                'square_meters' => $squareMeters,
                'discount_allocated' => 0.0,
                'tax_amount' => 0.0,
                'total' => 0.0,
            ];

            if ($itemType === 'rental') {
                $rentalsSubtotal += $subtotal;
            } else {
                $servicesSubtotal += $subtotal;
            }

            if ($discountApplies) {
                $discountBase += $subtotal;
            }

            $items[] = $normalized;
        }

        $discountAmount = $this->calculateAmount($discountType, $discountValue, $discountBase);
        $items = $this->allocateDiscount($items, $discountAmount, $discountBase);

        $tax = 0.0;
        $postDiscountSubtotal = 0.0;
        foreach ($items as $index => $item) {
            $taxableBase = round(max(0, $item['subtotal'] - $item['discount_allocated']), 2);
            $taxAmount = $includesTax ? round($taxableBase * ($item['tax_rate'] / 100), 2) : 0.0;
            $total = round($taxableBase + $taxAmount, 2);

            $items[$index]['tax_amount'] = $taxAmount;
            $items[$index]['total'] = $total;

            $tax += $taxAmount;
            $postDiscountSubtotal += $taxableBase;
        }

        $subtotal = round($rentalsSubtotal + $servicesSubtotal, 2);

        $total = round($postDiscountSubtotal + $tax, 2);

        return [
            'items' => $items,
            'totals' => [
                'rentals_subtotal' => round($rentalsSubtotal, 2),
                'services_subtotal' => round($servicesSubtotal, 2),
                'subtotal' => round($subtotal, 2),
                'discount_base' => round($discountBase, 2),
                'discount_type' => $discountType,
                'discount_value' => round($discountValue, 2),
                'discount_amount' => round($discountAmount, 2),
                // Se conservan las llaves por compatibilidad con cotizaciones
                // existentes, pero la comisión se define únicamente en la renta.
                'commission_base' => 0.0,
                'commission_type' => 'none',
                'commission_value' => 0.0,
                'commission_amount' => 0.0,
                'tax' => round($tax, 2),
                'total' => round($total, 2),
            ],
            'resolved' => [
                'includes_tax' => $includesTax,
                'tax_rate' => round($quoteTaxRate, 2),
                'discount' => [
                    'type' => $discountType,
                    'value' => round($discountValue, 2),
                ],
                'terms_html' => $payload['terms_html'] ?? ($company->default_terms_html ?? null),
            ],
        ];
    }

    private function allocateDiscount(array $items, float $discountAmount, float $discountBase): array
    {
        if ($discountAmount <= 0 || $discountBase <= 0) {
            return $items;
        }

        $discountableIndexes = [];
        foreach ($items as $index => $item) {
            if ($item['discount_applies']) {
                $discountableIndexes[] = $index;
            }
        }

        $remaining = round($discountAmount, 2);
        $lastIndex = count($discountableIndexes) - 1;

        foreach ($discountableIndexes as $position => $index) {
            $allocation = $position === $lastIndex
                ? $remaining
                : round($discountAmount * ($items[$index]['subtotal'] / $discountBase), 2);

            $allocation = min($allocation, $items[$index]['subtotal']);
            $items[$index]['discount_allocated'] = $allocation;
            $remaining = round($remaining - $allocation, 2);
        }

        return $items;
    }

    private function calculateAmount(string $type, float $value, float $base): float
    {
        if ($base <= 0 || $value <= 0 || $type === 'none') {
            return 0.0;
        }

        if ($type === 'percent') {
            return round($base * ($value / 100), 2);
        }

        return round(min($value, $base), 2);
    }

    private function toFloat($value): float
    {
        if ($value === null || $value === '') {
            return 0.0;
        }

        return round((float)$value, 2);
    }
}
