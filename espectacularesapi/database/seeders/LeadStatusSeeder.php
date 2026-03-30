<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LeadStatusSeeder extends Seeder
{
    public function run()
    {
        collect([
            ['key' => 'new', 'name' => 'Nuevo', 'color' => 'gray', 'is_final' => false, 'is_active' => true],
            ['key' => 'contacted', 'name' => 'Contactado', 'color' => 'blue', 'is_final' => false, 'is_active' => true],
            ['key' => 'quoted', 'name' => 'Cotizado', 'color' => 'purple', 'is_final' => false, 'is_active' => true],
            ['key' => 'won', 'name' => 'Ganado', 'color' => 'green', 'is_final' => true, 'is_active' => true],
            ['key' => 'lost', 'name' => 'Perdido', 'color' => 'red', 'is_final' => true, 'is_active' => true],
        ])->each(function (array $status) {
            DB::table('lead_status')->updateOrInsert(
                ['key' => $status['key']],
                array_merge($status, [
                    'updated_at' => Carbon::now(),
                    'created_at' => Carbon::now(),
                ])
            );
        });
    }
}
