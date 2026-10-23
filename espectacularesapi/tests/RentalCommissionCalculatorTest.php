<?php

use App\Models\Entities\Agency;
use App\Services\RentalCommissionCalculator;
use PHPUnit\Framework\TestCase;

class RentalCommissionCalculatorTest extends TestCase
{
    public function testCalculatesPercentageCommissionForRental(): void
    {
        $commission = (new RentalCommissionCalculator())->calculate([
            'type' => 'percent',
            'value' => 12,
        ], 10000);

        $this->assertSame(10000.0, $commission['commission_base']);
        $this->assertSame('percent', $commission['commission_type']);
        $this->assertSame(12.0, $commission['commission_value']);
        $this->assertSame(1200.0, $commission['commission_amount']);
    }

    public function testUsesAgencyDefaultsWhenRentalPayloadOmitsCommission(): void
    {
        $agency = new Agency();
        $agency->commission_type = 'fixed';
        $agency->commission_value = 750;

        $commission = (new RentalCommissionCalculator())->calculate([], 10000, $agency);

        $this->assertSame('fixed', $commission['commission_type']);
        $this->assertSame(750.0, $commission['commission_amount']);
    }
}
