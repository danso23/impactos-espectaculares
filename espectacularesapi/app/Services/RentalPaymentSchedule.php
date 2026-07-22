<?php

namespace App\Services;

use App\Models\Entities\Invoice;
use App\Models\Entities\Rental;
use Carbon\Carbon;
use InvalidArgumentException;

class RentalPaymentSchedule
{
    private const MAX_INSTALLMENTS = 120;

    public function build(string $startsAt, string $endsAt, string $firstPaymentDate, string $frequency): array
    {
        $start = Carbon::parse($startsAt)->startOfDay();
        $end = Carbon::parse($endsAt)->startOfDay();
        $firstDueDate = Carbon::parse($firstPaymentDate)->startOfDay();

        if ($end->lt($start)) {
            throw new InvalidArgumentException('La fecha final no puede ser anterior a la fecha inicial.');
        }

        if (!in_array($frequency, ['single', 'weekly', 'biweekly', 'monthly'], true)) {
            throw new InvalidArgumentException('La frecuencia de pago no es válida.');
        }

        $periods = [];
        $index = 0;
        $cursor = $start->copy();

        while ($cursor->lte($end)) {
            if (count($periods) >= self::MAX_INSTALLMENTS) {
                throw new InvalidArgumentException('El plan no puede superar 120 parcialidades.');
            }

            $periodEnd = $this->periodEnd($start, $cursor, $end, $frequency, $index);
            $dueDate = $this->dueDate($firstDueDate, $frequency, $index);

            $periods[] = [
                'number' => $index + 1,
                'period_start' => $cursor->format('Y-m-d'),
                'period_end' => $periodEnd->format('Y-m-d'),
                'due_date' => $dueDate->format('Y-m-d'),
            ];

            if ($frequency === 'single') {
                break;
            }

            $cursor = $periodEnd->copy()->addDay();
            $index++;
        }

        return $periods;
    }

    public function createInvoices(Rental $rental, array $schedule): void
    {
        $subtotals = $this->splitAmount((float) $rental->subtotal, count($schedule));
        $taxes = $this->splitAmount((float) $rental->tax, count($schedule));
        $totals = $this->splitAmount((float) $rental->total, count($schedule));

        foreach ($schedule as $index => $period) {
            Invoice::create([
                'rental_id' => $rental->id,
                'status' => $rental->status === 'active' ? 'issued' : 'draft',
                'period_start' => $period['period_start'],
                'period_end' => $period['period_end'],
                'due_date' => $period['due_date'],
                'subtotal' => $subtotals[$index],
                'tax' => $taxes[$index],
                'total' => $totals[$index],
            ]);
        }
    }

    private function periodEnd(Carbon $anchor, Carbon $cursor, Carbon $end, string $frequency, int $index): Carbon
    {
        if ($frequency === 'single') {
            return $end->copy();
        }

        if ($frequency === 'weekly') {
            return $cursor->copy()->addDays(6)->min($end);
        }

        if ($frequency === 'biweekly') {
            return $cursor->copy()->addDays(13)->min($end);
        }

        return $anchor->copy()->addMonthsNoOverflow($index + 1)->subDay()->min($end);
    }

    private function dueDate(Carbon $firstDueDate, string $frequency, int $index): Carbon
    {
        if ($frequency === 'weekly') {
            return $firstDueDate->copy()->addWeeks($index);
        }

        if ($frequency === 'biweekly') {
            return $firstDueDate->copy()->addDays($index * 14);
        }

        if ($frequency === 'monthly') {
            return $firstDueDate->copy()->addMonthsNoOverflow($index);
        }

        return $firstDueDate->copy();
    }

    private function splitAmount(float $amount, int $parts): array
    {
        if ($parts < 1) {
            return [];
        }

        $totalCents = (int) round($amount * 100);
        $base = intdiv($totalCents, $parts);
        $remainder = $totalCents % $parts;

        return array_map(
            fn (int $index) => ($base + ($index < $remainder ? 1 : 0)) / 100,
            range(0, $parts - 1)
        );
    }
}
