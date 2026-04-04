<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class QuoteStatusSeeder extends Seeder
{
    public function run()
    {
        $now = Carbon::now();

        DB::table('quote_status')->upsert([
            [
                'key' => 'draft',
                'name' => 'Borrador',
                'description' => 'Cotización en edición',
                'color' => 'gray',
                'is_final' => false,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'key' => 'sent',
                'name' => 'Enviada',
                'description' => 'Cotización enviada al cliente',
                'color' => 'blue',
                'is_final' => false,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'key' => 'accepted',
                'name' => 'Aceptada',
                'description' => 'Cotización aceptada por el cliente',
                'color' => 'green',
                'is_final' => true,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'key' => 'rejected',
                'name' => 'Rechazada',
                'description' => 'Cliente rechazó la cotización',
                'color' => 'red',
                'is_final' => true,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'key' => 'expired',
                'name' => 'Vencida',
                'description' => 'Cotización vencida',
                'color' => 'orange',
                'is_final' => true,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'key' => 'cancelled',
                'name' => 'Cancelada',
                'description' => 'Cancelada manualmente',
                'color' => 'dark',
                'is_final' => true,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ], ['key'], ['name', 'description', 'color', 'is_final', 'is_active', 'updated_at']);
    }
}
