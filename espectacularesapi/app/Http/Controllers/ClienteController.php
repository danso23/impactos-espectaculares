<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use App\Models\Entities\Cliente;
use App\Models\Entities\Prestamo;
use Carbon\Carbon;
use App\Support\ResolvesUsuarioFromToken;

class ClienteController extends Controller
{
    use ResolvesUsuarioFromToken;

    public function show(Request $request){
        try{
            $usuario = $this->resolveUsuarioFromToken($request);
            if (!$usuario) {
                return response()->json([
                    'success' => false,
                    'message' => 'Token inválido o ausente en X-Requested-With',
                ], 401);
            }

            $id        = $request->input('id');
            $nombre    = $request->input('nombre');
            $apPaterno = $request->input('apellido_paterno');
            $apMaterno = $request->input('apellido_materno');
            $curp      = $request->input('curp');

            $ESTADO_VIGENTE  = 1;
            $CUOTA_PENDIENTE = 0;

            $hoy = Carbon::today('America/Merida')->toDateString();

            // Subquery: por cliente, la PRIMERA cuota vencida y pendiente en préstamos vigentes
            $sub = DB::table('prestamos as p')
                ->join('detalle_prestamo as d', 'd.prestamo_id', '=', 'p.id')
                ->where('p.estado', $ESTADO_VIGENTE)
                ->where('d.esta_pagado', $CUOTA_PENDIENTE)
                ->whereDate('d.fecha_pago', '<', $hoy)
                ->groupBy('p.cliente_id')
                ->select('p.cliente_id', DB::raw('MIN(d.fecha_pago) as primera_vencida'));

            $query = Cliente::query()
                ->leftJoinSub($sub, 'mora', function ($join) {
                    $join->on('mora.cliente_id', '=', 'clientes.id');
                })
                ->select('clientes.*')
                ->selectRaw("
                    (
                        SELECT MIN(d.fecha_pago)
                        FROM prestamos p
                        JOIN detalle_prestamo d ON d.prestamo_id = p.id
                        WHERE p.cliente_id = clientes.id
                        AND p.estado = ?
                        AND d.esta_pagado = ?
                        AND d.fecha_pago < ?
                    ) AS primera_fecha_vencida
                    ", [$ESTADO_VIGENTE, $CUOTA_PENDIENTE, $hoy]
                )
                ->visibleForUsuario('clientes.usuario', $usuario);

            if($id){
                $query->where('clientes.id', (int)$id);
            }
            if($nombre){
                $query->where('clientes.nombre', 'LIKE', "%{$nombre}%");
            }
            if($apPaterno){
                $query->where('clientes.apellido_paterno', 'LIKE', "%{$apPaterno}%");
            }
            if($apMaterno){
                $query->where('clientes.apellido_materno', 'LIKE', "%{$apMaterno}%");
            }
            if($curp){
                $query->where('clientes.curp', 'LIKE', "%{$curp}%");
            }

            

            $clientes = $query->get()->map(function ($c) {
                $dias = (int)$c->dias_morosidad;
                $c->dias_morosidad_text = $dias === 1 ? "1 día" : "{$dias} días";
                return $c;
            });

            return response()->json([
                'success' => true,
                'message' => 'Consulta exitosa',
                'data'    => $clientes
            ],200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al generar la consulta clientes',
                'errors'  => $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try{
            $validated = $this->validate($request, [
                'nombre' => 'required|string|max:100',
                'apellido_paterno' => 'required|string|max:100',
                'apellido_materno' => 'nullable|string|max:100',
                'curp' => 'required|string|max:18|unique:clientes',
                'direccion' => 'required|string',
                'negocio' => 'nullable|string|max:150',
                'telefono' => 'nullable|string|max:15',
                'nombre_aval' => 'required|string|max:100',
                'telefono_aval' => 'nullable|string|max:15',
                'direccion_aval' => 'required|string',
            ]);

            $usuario = $this->resolveUsuarioFromToken($request);
            if (!$usuario) {
                return response()->json(['success'=>false,'message'=>'Token inválido o ausente'], 401);
            }
            $validated['usuario'] = $usuario;

            $cliente = Cliente::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Cliente registrado exitosamente',
            ], 200);
        }
        catch (\Illuminate\Validation\ValidationException $e) {
            // Manejo de errores de validación
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $e->errors(),
            ], 422);
        }
        catch (\Exception $e) {
            // Manejo de errores
            return response()->json([
                'success' => false,
                'message' => 'Algo ha fallado',
                'errors'  => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            // Buscar el cliente
            $cliente = Cliente::findOrFail($id);

            // Validar los datos
            $validated = $this->validate($request, [
                'nombre' => 'required|string|max:100',
                'apellido_paterno' => 'required|string|max:100',
                'apellido_materno' => 'nullable|string|max:100',
                'curp' => 'required|string|max:18|unique:clientes,curp,' . $cliente->id,
                'direccion' => 'required|string',
                'negocio' => 'nullable|string|max:150',
                'telefono' => 'nullable|string|max:15',
                'nombre_aval' => 'required|string|max:100',
                'telefono_aval' => 'nullable|string|max:15',
                'direccion_aval' => 'required|string',
            ]);

            // Actualizar el cliente
            $cliente->update($validated);

            // Respuesta en caso de éxito
            return response()->json([
                'success' => true,
                'message' => 'Cliente actualizado exitosamente'
            ], 200);
        } 
        catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            // Error si el cliente no se encuentra
            return response()->json([
                'success' => false,
                'message' => 'Cliente no encontrado',
            ], 404);
        } 
        catch (\Illuminate\Validation\ValidationException $e) {
            // Error de validación
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'erros'   => $e->getMessage(),
            ], 422);
        } 
        catch (\Exception $e) {
            // Cualquier otro error
            return response()->json([
                'success' => false,
                'message' => 'Ocurrió un error inesperado',
                'errors'  => $e->getMessage(),
            ], 500);
        }
    }
}
