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

    public function testServiceAreaAndSubtotalAreCalculatedFromWidthAndHeight(): void
    {
        $result = (new QuoteCalculator())->calculate([
            'includes_tax' => false,
            'items' => [[
                'item_type' => 'service',
                'concept' => 'Impresión de lona',
                'qty' => 1,
                'width_m' => 3.5,
                'height_m' => 2,
                'square_meters' => 999,
                'unit_price' => 80,
            ]],
        ]);

        $this->assertSame(3.5, $result['items'][0]['width_m']);
        $this->assertSame(2.0, $result['items'][0]['height_m']);
        $this->assertSame(7.0, $result['items'][0]['square_meters']);
        $this->assertSame(560.0, $result['items'][0]['subtotal']);
        $this->assertSame(560.0, $result['totals']['services_subtotal']);
    }

    public function testPieceServiceIgnoresSquareMeters(): void
    {
        $result = (new QuoteCalculator())->calculate([
            'includes_tax' => false,
            'items' => [[
                'item_type' => 'service',
                'concept' => 'Instalación de lonas',
                'unit' => 'pieza',
                'qty' => 2,
                'width_m' => 12,
                'height_m' => 6,
                'unit_price' => 1500,
            ]],
        ]);

        $this->assertSame('pieza', $result['items'][0]['unit']);
        $this->assertSame(3000.0, $result['items'][0]['subtotal']);
    }

    public function testServiceWithoutUnitDefaultsToSquareMeters(): void
    {
        $result = (new QuoteCalculator())->calculate([
            'includes_tax' => false,
            'items' => [[
                'item_type' => 'service',
                'qty' => 1,
                'width_m' => 2,
                'height_m' => 2,
                'unit_price' => 100,
            ]],
        ]);

        $this->assertSame('m2', $result['items'][0]['unit']);
        $this->assertSame(400.0, $result['items'][0]['subtotal']);
    }
}
