<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class QuoteStatusSeeder extends Seeder
{
    public function run()
    {
        DB::table('quote_status')->insert([
            [
                'key' => 'draft',
                'name' => 'Borrador',
                'description' => 'Cotización en edición',
                'color' => 'gray',
                'is_final' => false,
            ],
            [
                'key' => 'sent',
                'name' => 'Enviada',
                'description' => 'Cotización enviada al cliente',
                'color' => 'blue',
                'is_final' => false,
            ],
            [
                'key' => 'accepted',
                'name' => 'Aceptada',
                'description' => 'Cotización aceptada por el cliente',
                'color' => 'green',
                'is_final' => true,
            ],
            [
                'key' => 'rejected',
                'name' => 'Rechazada',
                'description' => 'Cliente rechazó la cotización',
                'color' => 'red',
                'is_final' => true,
            ],
            [
                'key' => 'expired',
                'name' => 'Vencida',
                'description' => 'Cotización vencida',
                'color' => 'orange',
                'is_final' => true,
            ],
            [
                'key' => 'cancelled',
                'name' => 'Cancelada',
                'description' => 'Cancelada manualmente',
                'color' => 'dark',
                'is_final' => true,
            ],
        ]);
    }
}