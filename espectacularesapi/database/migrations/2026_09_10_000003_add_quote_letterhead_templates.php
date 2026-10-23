<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

class AddQuoteLetterheadTemplates extends Migration
{
    public function up()
    {
        if (!Schema::hasTable('companies') || !Schema::hasTable('company_letterheads')) {
            return;
        }

        $companyId = DB::table('companies')
            ->where('key', 'espectaculares_principal')
            ->value('id');

        if (!$companyId) {
            $companyId = DB::table('companies')->orderBy('id')->value('id');
        }

        if (!$companyId) {
            return;
        }

        foreach ($this->templates() as $template) {
            DB::table('company_letterheads')->updateOrInsert(
                ['company_id' => $companyId, 'code' => $template['code']],
                array_merge($template, [
                    'company_id' => $companyId,
                    'is_default' => false,
                    'is_active' => true,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ])
            );
        }
    }

    public function down()
    {
        if (!Schema::hasTable('company_letterheads')) {
            return;
        }

        $query = DB::table('company_letterheads')
            ->whereIn('code', array_column($this->templates(), 'code'));

        if (Schema::hasTable('quotes')) {
            $query->whereNotIn('id', DB::table('quotes')->select('letterhead_id')->whereNotNull('letterhead_id'));
        }

        $query->delete();
    }

    private function templates(): array
    {
        return [
            [
                'name' => 'Looking Colors',
                'code' => 'LOOKING_COLORS',
                'description' => 'Hoja membretada Looking Colors',
                'template_key' => 'looking_colors',
                'primary_color' => '#3F8EF7',
                'secondary_color' => '#DD4898',
            ],
            [
                'name' => 'Impactos Espectaculares',
                'code' => 'IMPACTOS',
                'description' => 'Hoja membretada Impactos Espectaculares',
                'template_key' => 'impactos',
                'primary_color' => '#5B4AA5',
                'secondary_color' => '#F36A32',
            ],
            [
                'name' => 'AG Espectaculares',
                'code' => 'AG_ESPECTACULARES',
                'description' => 'Hoja membretada AG Espectaculares',
                'template_key' => 'ag_espectaculares',
                'primary_color' => '#54B5D0',
                'secondary_color' => '#342638',
            ],
        ];
    }
}
