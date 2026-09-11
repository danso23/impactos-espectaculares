<?php

use App\Models\Entities\Agency;
use App\Services\QuoteCalculator;
use PHPUnit\Framework\TestCase;

class QuoteCalculatorTest extends TestCase
{
    public function testQuoteDoesNotCalculateCommission(): void
    {
        $agency = new Agency();
        $agency->commission_type = 'percent';
        $agency->commission_value = 12;

        $result = (new QuoteCalculator())->calculate([
            'includes_tax' => false,
            'commission' => ['type' => 'percent', 'value' => 20],
            'items' => [[
                'item_type' => 'rental',
                'concept' => 'Espacio',
                'qty' => 1,
                'unit_price' => 10000,
            ]],
        ], $agency);

        $this->assertSame('none', $result['totals']['commission_type']);
        $this->assertSame(0.0, $result['totals']['commission_amount']);
        $this->assertArrayNotHasKey('commission', $result['resolved']);
    }
}
