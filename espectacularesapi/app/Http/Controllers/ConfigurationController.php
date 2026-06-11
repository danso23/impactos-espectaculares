<?php

namespace App\Http\Controllers;

use App\Models\Entities\Configuration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;

class ConfigurationController extends Controller
{
    public function show()
    {
        $configuration = $this->resolveConfiguration();

        return response()->json([
            'data' => [
                'id' => $configuration->id,
                'price_per_square_meter' => (float)$configuration->price_per_square_meter,
            ],
        ]);
    }

    public function update(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'price_per_square_meter' => ['required', 'numeric', 'min:0'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $configuration = $this->resolveConfiguration();
        $configuration->update([
            'price_per_square_meter' => $request->input('price_per_square_meter'),
        ]);

        return response()->json([
            'message' => 'Configuración actualizada correctamente',
            'data' => [
                'id' => $configuration->id,
                'price_per_square_meter' => (float)$configuration->price_per_square_meter,
            ],
        ]);
    }

    private function resolveConfiguration(): Configuration
    {
        if (!Schema::hasTable('configurations')) {
            abort(500, 'La tabla configurations no existe');
        }

        $configuration = Configuration::query()->orderBy('id')->first();

        if ($configuration) {
            return $configuration;
        }

        return Configuration::create([
            'price_per_square_meter' => 0,
        ]);
    }
}
