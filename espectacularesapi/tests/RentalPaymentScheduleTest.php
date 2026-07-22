<?php

use App\Services\RentalPaymentSchedule;
use PHPUnit\Framework\TestCase;

class RentalPaymentScheduleTest extends TestCase
{
    public function testSinglePaymentCoversTheFullRentalPeriod(): void
    {
        $schedule = (new RentalPaymentSchedule())->build(
            '2026-07-01',
            '2026-07-31',
            '2026-07-05',
            'single'
        );

        $this->assertCount(1, $schedule);
        $this->assertSame('2026-07-01', $schedule[0]['period_start']);
        $this->assertSame('2026-07-31', $schedule[0]['period_end']);
        $this->assertSame('2026-07-05', $schedule[0]['due_date']);
    }

    public function testWeeklyPlanCreatesConsecutiveInstallments(): void
    {
        $schedule = (new RentalPaymentSchedule())->build(
            '2026-07-01',
            '2026-07-15',
            '2026-07-03',
            'weekly'
        );

        $this->assertCount(3, $schedule);
        $this->assertSame('2026-07-07', $schedule[0]['period_end']);
        $this->assertSame('2026-07-08', $schedule[1]['period_start']);
        $this->assertSame('2026-07-15', $schedule[2]['period_end']);
        $this->assertSame('2026-07-17', $schedule[2]['due_date']);
    }

    public function testInvalidDateRangeIsRejected(): void
    {
        $this->expectException(InvalidArgumentException::class);

        (new RentalPaymentSchedule())->build(
            '2026-08-01',
            '2026-07-31',
            '2026-08-01',
            'monthly'
        );
    }
}
