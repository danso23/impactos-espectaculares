<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\JsonResponse;
use App\Models\Entities\Transaccion;
use App\Support\ResolvesUsuarioFromToken;


class TransaccionController extends Controller
{
    use ResolvesUsuarioFromToken;

    public function obtenerMontoActual(Request $request): JsonResponse {
        try{
            $usuario = $this->resolveUsuarioFromToken($request);
            if (!$usuario) {
                return response()->json([
                    'success' => false,
                    'message' => 'Token inválido o ausente en X-Requested-With',
                ], 401);
            }

            $monto_actual = Transaccion::query()
            ->visibleForUsuario('transacciones.usuario', $usuario)
            ->selectRaw("
                COALESCE(SUM(
                    CASE 
                        WHEN LOWER(tipo_transaccion) = 'ingreso' THEN monto
                        WHEN LOWER(tipo_transaccion) = 'egreso'  THEN -monto
                        ELSE 0
                    END
                ), 0) AS monto_actual
            ")
            ->value('monto_actual');


            $monto_actual = $monto_actual ?? 0;
            return response()->json([
                'success' => true,
                'message' => number_format($monto_actual, 2)
            ], 200);
        }
        catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al calcular el monto actual',
                'errors'  => $e->getMessage(),
            ], 500);
        }
    }

    public function detalleTransacciones(Request $request){
        try{
            $usuario = $this->resolveUsuarioFromToken($request);
            if (!$usuario) {
                return response()->json([
                    'success' => false,
                    'message' => 'Token inválido o ausente en X-Requested-With',
                ], 401);
            }

            $transacciones = Transaccion::query()
                ->visibleForUsuario('transacciones.usuario', $usuario)
                ->orderByDesc('fecha')
                ->orderByDesc('id')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Consulta exitosa',
                'data'    => $transacciones
            ], 200);
        }
        catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener las transacciones',
                'errors'  => $e->getMessage(),
            ], 500);
        }
    }


    public function crearTransaccion(Request $request)
    {
        try{
            // Validación
            $validated = $this->validate($request, [
                'tipo_transaccion' => 'required|in:Ingreso,Egreso',
                'monto' => 'required|numeric|min:0',
                'fecha' => 'required|date',
                'descripcion' => 'nullable|string|max:255',
                'metodo_pago' => 'required|in:Efectivo,Transferencia,Tarjeta',
                'referencia' => 'nullable|string|max:255',
            ]);

            $usuario = $this->resolveUsuarioFromToken($request);
            if (!$usuario) {
                return response()->json(['success'=>false,'message'=>'Token inválido o ausente'], 401);
            }
            $validated['usuario'] = $usuario;

            $transaccion = Transaccion::create($validated);
            
            return response()->json([
                'success'     => true,
                'message'     => 'Transacción registrada exitosamente.',
                'transaccion' => $transaccion,
            ], 200);
        }
        catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors'  => $e->errors(),
            ], 422);
    
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Ocurrió un error al registrar la transacción.',
                'errors'  => $e->getMessage(),
            ], 500);
        }
    }
    
}
