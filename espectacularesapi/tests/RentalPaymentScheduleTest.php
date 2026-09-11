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

    public function testMonthlyRenewalsCalculateTheEndDateAndExactNumberOfPayments(): void
    {
        $service = new RentalPaymentSchedule();
        $schedule = $service->buildForRenewals('2026-01-15', '2026-01-15', 'monthly', 12);

        $this->assertCount(12, $schedule);
        $this->assertSame('2027-01-14', $service->endDate('2026-01-15', 'monthly', 12));
        $this->assertSame('2027-01-14', $schedule[11]['period_end']);
    }

    public function testSinglePaymentForcesOneRenewalAndSameEndDate(): void
    {
        $service = new RentalPaymentSchedule();
        $schedule = $service->buildForRenewals('2026-04-08', '2026-04-08', 'single', 24);

        $this->assertCount(1, $schedule);
        $this->assertSame('2026-04-08', $service->endDate('2026-04-08', 'single', 24));
        $this->assertSame('2026-04-08', $schedule[0]['period_end']);
    }

    public function testAnnualRenewalsAreSupported(): void
    {
        $service = new RentalPaymentSchedule();
        $schedule = $service->buildForRenewals('2026-06-01', '2026-06-01', 'annual', 2);

        $this->assertCount(2, $schedule);
        $this->assertSame('2028-05-31', $service->endDate('2026-06-01', 'annual', 2));
        $this->assertSame('2027-06-01', $schedule[1]['due_date']);
    }
}
