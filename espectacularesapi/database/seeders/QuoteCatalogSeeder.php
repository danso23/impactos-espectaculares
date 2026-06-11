<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

class QuoteCatalogSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        DB::table('companies')->upsert([
            [
                'key' => 'espectaculares_principal',
                'name' => 'Espectaculares',
                'legal_name' => 'Espectaculares S.A. de C.V.',
                'rfc' => 'ESP010101ABC',
                'email' => 'ventas@espectaculares.mx',
                'phone' => '9990000000',
                'city' => 'Merida',
                'state' => 'Yucatan',
                'country' => 'MX',
                'default_terms_html' => '<p>Precios sujetos a disponibilidad y cambio sin previo aviso.</p><p>Vigencia de 15 dias naturales.</p>',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'key' => 'espectaculares_corporativo',
                'name' => 'Espectaculares Corporativo',
                'legal_name' => 'Corporativo Espectaculares del Sureste S.A. de C.V.',
                'rfc' => 'COR010101ABC',
                'email' => 'corporativo@espectaculares.mx',
                'phone' => '9990000001',
                'city' => 'Merida',
                'state' => 'Yucatan',
                'country' => 'MX',
                'default_terms_html' => '<p>Condiciones corporativas aplican para esta emision.</p>',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ], ['key'], ['name', 'legal_name', 'rfc', 'email', 'phone', 'city', 'state', 'country', 'default_terms_html', 'is_active', 'updated_at']);

        $companies = DB::table('companies')->get()->keyBy('key');

        foreach ([
            [
                'company_id' => $companies['espectaculares_principal']->id ?? null,
                'name' => 'Membretado Principal',
                'code' => 'MAIN',
                'description' => 'Plantilla principal para cotizaciones comerciales',
                'template_key' => 'default_blue',
                'primary_color' => '#1D6FA5',
                'secondary_color' => '#2CA6D9',
                'is_default' => true,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'company_id' => $companies['espectaculares_corporativo']->id ?? null,
                'name' => 'Membretado Corporativo',
                'code' => 'CORP',
                'description' => 'Plantilla corporativa',
                'template_key' => 'corporate_dark',
                'primary_color' => '#16324F',
                'secondary_color' => '#4F6D8A',
                'is_default' => true,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ] as $letterhead) {
            DB::table('company_letterheads')->updateOrInsert(
                [
                    'company_id' => $letterhead['company_id'],
                    'code' => $letterhead['code'],
                ],
                $letterhead
            );
        }

        foreach ([
            [
                'name' => 'Agencia Demo',
                'legal_name' => 'Agencia Demo S.A. de C.V.',
                'contact_name' => 'Ejecutivo Demo',
                'email' => 'agencia@demo.mx',
                'phone' => '9991000000',
                'discount_type' => 'percent',
                'discount_value' => 10,
                'discount_applies_to' => 'rentals_only',
                'commission_type' => 'percent',
                'commission_value' => 12,
                'commission_applies_to' => 'subtotal_after_discount',
                'notes' => 'Configuracion inicial para pruebas',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ] as $agency) {
            DB::table('agencies')->updateOrInsert(
                ['name' => $agency['name']],
                $agency
            );
        }

        foreach ([
            [
                'key' => 'instalacion',
                'name' => 'Instalacion',
                'description' => 'Instalacion de lona o material publicitario',
                'base_price' => 1500,
                'tax_rate' => 16,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'key' => 'impresion',
                'name' => 'Impresion',
                'description' => 'Impresion de lona',
                'base_price' => 2500,
                'tax_rate' => 16,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'key' => 'desinstalacion',
                'name' => 'Desinstalacion',
                'description' => 'Retiro de material existente',
                'base_price' => 900,
                'tax_rate' => 16,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ] as $service) {
            DB::table('services')->updateOrInsert(
                ['key' => $service['key']],
                $service
            );
        }

        if (Schema::hasTable('configurations')) {
            DB::table('configurations')->updateOrInsert(
                ['id' => 1],
                [
                    'price_per_square_meter' => 0,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }
    }
}
