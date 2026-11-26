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

        if (!in_array($frequency, ['single', 'weekly', 'biweekly', 'monthly', 'annual'], true)) {
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

    public function endDate(string $startsAt, string $frequency, int $renewals): string
    {
        $start = Carbon::parse($startsAt)->startOfDay();
        $count = $frequency === 'single' ? 1 : $renewals;

        if ($count < 1 || $count > self::MAX_INSTALLMENTS) {
            throw new InvalidArgumentException('El número de rentas debe estar entre 1 y 120.');
        }

        if (!in_array($frequency, ['single', 'weekly', 'biweekly', 'monthly', 'annual'], true)) {
            throw new InvalidArgumentException('La frecuencia de pago no es válida.');
        }

        if ($frequency === 'single') return $start->format('Y-m-d');
        if ($frequency === 'weekly') return $start->copy()->addWeeks($count)->subDay()->format('Y-m-d');
        if ($frequency === 'biweekly') return $start->copy()->addDays($count * 14)->subDay()->format('Y-m-d');
        if ($frequency === 'annual') return $start->copy()->addYearsNoOverflow($count)->subDay()->format('Y-m-d');

        return $start->copy()->addMonthsNoOverflow($count)->subDay()->format('Y-m-d');
    }

    public function buildForRenewals(
        string $startsAt,
        string $firstPaymentDate,
        string $frequency,
        int $renewals
    ): array {
        $count = $frequency === 'single' ? 1 : $renewals;
        $schedule = $this->build(
            $startsAt,
            $this->endDate($startsAt, $frequency, $count),
            $firstPaymentDate,
            $frequency
        );

        return array_slice($schedule, 0, $count);
    }

    public function createInvoices(Rental $rental, array $schedule): void
    {
        $subtotals = $this->splitAmount((float) $rental->subtotal, count($schedule));
        $taxes = $this->splitAmount((float) $rental->tax, count($schedule));
        $totals = $this->splitAmount((float) $rental->total, count($schedule));
        $concept = $this->rentalConcept($rental);

        foreach ($schedule as $index => $period) {
            Invoice::create([
                'rental_id' => $rental->id,
                'concept' => $concept,
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

    /**
     * Recalcula el calendario de cobros cuando cambia la vigencia de la renta.
     *
     * - Los pagos cobrados (o con abonos registrados) no se modifican.
     * - Los pendientes se ajustan a los nuevos periodos y fechas de vencimiento.
     * - Si la vigencia crece, se agregan pagos con el importe del último pago.
     * - Si se acorta, los pendientes sobrantes se eliminan (o se cancelan si ya tienen folio).
     * - Los totales de la renta quedan como la suma de los pagos vigentes.
     *
     * @throws \DomainException si un pago cobrado queda fuera de la nueva vigencia.
     */
    public function reschedule(Rental $rental, ?string $previousStartsAt = null): void
    {
        $invoices = $rental->invoices()
            ->withCount('payments')
            ->where('status', '!=', 'cancelled')
            ->orderBy('period_start')
            ->orderBy('id')
            ->get();

        if ($invoices->isEmpty()) return;

        $startsAt = Carbon::parse($rental->starts_at)->format('Y-m-d');
        $firstPaymentDate = $rental->first_payment_date
            ? Carbon::parse($rental->first_payment_date)
            : Carbon::parse($startsAt);

        // Si se movió el inicio, el primer vencimiento se recorre lo mismo.
        if ($previousStartsAt && $previousStartsAt !== $startsAt) {
            $shift = Carbon::parse($previousStartsAt)->diffInDays(Carbon::parse($startsAt), false);
            $firstPaymentDate = $firstPaymentDate->copy()->addDays($shift);
        }

        $schedule = $this->build(
            $startsAt,
            Carbon::parse($rental->ends_at)->format('Y-m-d'),
            $firstPaymentDate->format('Y-m-d'),
            (string) ($rental->payment_frequency ?: 'monthly')
        );

        $isLocked = fn (Invoice $invoice) => $invoice->status === 'paid' || $invoice->payments_count > 0;
        $template = $invoices->last();
        $pendingStatus = $rental->status === 'active' ? 'issued' : 'draft';
        $today = Carbon::today();

        foreach ($schedule as $index => $period) {
            $invoice = $invoices->get($index);

            if ($invoice && $isLocked($invoice)) continue;

            $dueDate = Carbon::parse($period['due_date']);
            $status = $pendingStatus === 'issued' && $dueDate->lt($today) ? 'overdue' : $pendingStatus;

            if ($invoice) {
                // Un borrador sigue en borrador; emitido/vencido se recalcula con el nuevo vencimiento.
                $invoice->update([
                    'period_start' => $period['period_start'],
                    'period_end' => $period['period_end'],
                    'due_date' => $period['due_date'],
                    'status' => $invoice->status === 'draft' ? 'draft' : ($dueDate->lt($today) ? 'overdue' : 'issued'),
                ]);
                continue;
            }

            Invoice::create([
                'rental_id' => $rental->id,
                'concept' => $template->concept,
                'status' => $template->status === 'draft' ? 'draft' : $status,
                'period_start' => $period['period_start'],
                'period_end' => $period['period_end'],
                'due_date' => $period['due_date'],
                'subtotal' => $template->subtotal,
                'tax' => $template->tax,
                'total' => $template->total,
            ]);
        }

        $leftover = $invoices->slice(count($schedule));
        if ($leftover->contains($isLocked)) {
            throw new \DomainException('No se puede acortar la vigencia: hay pagos cobrados en periodos que quedarían fuera.');
        }
        // Sin folio ni abonos nunca salieron del sistema: se eliminan para no ensuciar el plan.
        $leftover->each(fn (Invoice $invoice) => $invoice->folio
            ? $invoice->update(['status' => 'cancelled'])
            : $invoice->delete());

        $active = $rental->invoices()->where('status', '!=', 'cancelled');
        $rental->forceFill([
            'first_payment_date' => $firstPaymentDate->format('Y-m-d'),
            'payment_installments' => count($schedule),
            'subtotal' => round((float) (clone $active)->sum('subtotal'), 2),
            'tax' => round((float) (clone $active)->sum('tax'), 2),
            'total' => round((float) (clone $active)->sum('total'), 2),
        ])->save();
    }

    /**
     * Crea un cobro por periodo con el importe (sin IVA) indicado para cada uno.
     */
    public function createInvoicesFromAmounts(Rental $rental, array $schedule, array $amounts, float $taxRate, array $concepts = []): void
    {
        foreach (array_values($schedule) as $index => $period) {
            $subtotal = round((float) ($amounts[$index] ?? 0), 2);
            $tax = round($subtotal * $taxRate / 100, 2);

            Invoice::create([
                'rental_id' => $rental->id,
                'concept' => isset($concepts[$index]) ? mb_substr((string) $concepts[$index], 0, 500) : null,
                'status' => $rental->status === 'active' ? 'issued' : 'draft',
                'period_start' => $period['period_start'],
                'period_end' => $period['period_end'],
                'due_date' => $period['due_date'],
                'subtotal' => $subtotal,
                'tax' => $tax,
                'total' => round($subtotal + $tax, 2),
            ]);
        }
    }

    /**
     * Concepto genérico para rentas capturadas directamente: los espacios rentados.
     */
    private function rentalConcept(Rental $rental): string
    {
        $spaces = $rental->items()->with('space')->get()
            ->map(function ($item) {
                $space = $item->space;
                if (!$space) {
                    return null;
                }
                return trim(($space->assigned_id ? 'ID ' . $space->assigned_id . ' ' : '') . ($space->title ?? ''));
            })
            ->filter()
            ->unique()
            ->values()
            ->all();

        return mb_substr($spaces ? 'Renta: ' . implode(', ', $spaces) : 'Renta del periodo', 0, 500);
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

        if ($frequency === 'annual') {
            return $anchor->copy()->addYearsNoOverflow($index + 1)->subDay()->min($end);
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

        if ($frequency === 'annual') {
            return $firstDueDate->copy()->addYearsNoOverflow($index);
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
