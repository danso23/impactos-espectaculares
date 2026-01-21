<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Entities\Prestamo;
use App\Models\Entities\DetallePrestamo;
use App\Models\Entities\CatPeriodoPago;
use App\Models\Entities\Cliente;
use App\Models\Entities\Transaccion;
use Carbon\Carbon;
use DB;
use App\Support\ResolvesUsuarioFromToken;

class PrestamoController extends Controller
{
    use ResolvesUsuarioFromToken;
    /**
     * Helper: registra una transacción.
     */
    private function registrarTransaccion(
        string $tipo,                // 'Ingreso' | 'Egreso'
        float $monto,
        string $descripcion,
        string $metodo = 'Efectivo', // 'Efectivo' | 'Transferencia' | 'Tarjeta'
        ?string $referencia = null,
        ?string $fecha = null,
        ?string $usuario = null
    ): Transaccion {
        return Transaccion::create([
            'tipo_transaccion' => $tipo, // 'Ingreso' o 'Egreso'
            'monto'            => $monto,
            'fecha'            => $fecha ? Carbon::parse($fecha) : Carbon::now(),
            'descripcion'      => $descripcion,
            'metodo_pago'      => $metodo,
            'referencia'       => $referencia,
            'usuario'          => $usuario,
        ]);
    }


    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request){
        $usuario = $this->resolveUsuarioFromToken($request);
        if (!$usuario) {
            return response()->json([
                'success' => false,
                'message' => 'Token inválido o ausente en X-Requested-With',
            ], 401);
        }
        // Puedes filtrar por cliente si mandas un cliente_id
        $query = Prestamo::with(['cliente', 'periodoPago'])->visibleForUsuario('prestamos.usuario', $usuario);

        if ($request->has('cliente_id')) {
            $query->where('cliente_id', $request->cliente_id);
        }

        $prestamos = $query->orderBy('created_at', 'desc')->get();

        // Puedes formatear si quieres convertir estado a texto o añadir fecha legible
        $data = $prestamos->map(function ($p) {
            return [
                'id' => $p->id,
                'cliente' => $p->cliente->nombre ?? 'N/A',
                'periodo_pago' => $p->periodoPago->nombre ?? 'N/A',
                'monto' => $p->monto,
                'interes' => $p->interes,
                'plazo' => $p->plazo,
                'total_pagar' => $p->total_pagar,
                'estado' => $p->estado == 1 ? 'Activo' : 'Finalizado',
                'fecha' => $p->created_at->format('Y-m-d')
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Consulta exitosa',
            'data' => $data,
        ], 200);

    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request){
        $this->validate($request, [
            'cliente_id' => 'required|exists:clientes,id',
            'periodo_pago_id' => 'required|exists:cat_periodo_pago,id',
            'monto' => 'required|numeric|min:1',
            'interes' => 'required|numeric|min:0',
            'plazo' => 'required|integer|min:1',
        ]);

        DB::beginTransaction();
        try {

            $prestamoActivo = Prestamo::where('cliente_id', $request->cliente_id)
                ->where('estado', 1)
                ->first();

            if ($prestamoActivo) {
                return response()->json([
                    'error' => 'El cliente ya tiene un préstamo activo'
                ], 400);
            }
            // Obtener datos del periodo de pago
            $periodo = CatPeriodoPago::findOrFail($request->periodo_pago_id);
            $dias = $periodo->periodo_pago;

            $monto = $request->monto;
            $interes = $request->interes;
            $plazo = $request->plazo;

            // Total a pagar (monto + interés)
            $total_pagar = $monto + ($monto * ($interes / 100));
            $monto_por_pago = round($total_pagar / $plazo, 2);

            $usuario = $this->resolveUsuarioFromToken($request);
            if (!$usuario) {
                return response()->json(['success'=>false,'message'=>'Token inválido o ausente'], 401);
            }

            // Crear el préstamo
            $prestamo = Prestamo::create([
                'cliente_id' => $request->cliente_id,
                'periodo_pago_id' => $request->periodo_pago_id,
                'monto' => $monto,
                'interes' => $interes,
                'plazo' => $plazo,
                'total_pagar' => $total_pagar,
                'estado' => 1,
                'usuario' => $usuario
            ]);

            // Crear los pagos en detalle_prestamo
            $fecha_inicio = Carbon::now();
            for ($i = 0; $i < $plazo; $i++) {
                DetallePrestamo::create([
                    'prestamo_id' => $prestamo->id,
                    'fecha_pago' => $fecha_inicio->copy()->addDays($i * $dias),
                    'monto_pago' => $monto_por_pago,
                    'esta_pagado' => 0,
                    'usuario' => $usuario
                ]);
            }

            $metodo = $request->get('metodo_pago', 'Efectivo');
            $this->registrarTransaccion(
                'Egreso',
                (float)$monto,
                "Desembolso préstamo #{$prestamo->id} para cliente #{$prestamo->cliente_id}",
                $metodo,
                "prestamo:{$prestamo->id}",
                null,
                $usuario
            );

            DB::commit();
            return response()->json([
                'success' => true,
                'message' => 'Préstamo creado exitosamente',
                'data' => $prestamo,
            ], 200);

        }
        catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Ocurrió un error inesperado',
                'errors'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Detalle Prestamo.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function detalle(Request $request,$id){
        $usuario = $this->resolveUsuarioFromToken($request);
        if (!$usuario) {
            return response()->json([
                'success' => false,
                'message' => 'Token inválido o ausente en X-Requested-With',
            ], 401);
        }

        $prestamo = Prestamo::query()
            ->visibleForUsuario('prestamos.usuario', $usuario)
            ->with(['detalles' => function ($q) use ($usuario) {
                $q->visibleForUsuario('detalle_prestamo.usuario', $usuario)
                ->orderBy('fecha_pago')
                ->orderBy('id');
            }])
            ->where('id', $id)
            ->first();

        if (!$prestamo) {
            // Si no existe o no es visible para el usuario, responde 404 (no filtra que existe)
            return response()->json(['error' => 'Préstamo no encontrado'], 404);
        }

        $today = Carbon::now('America/Merida')->startOfDay();

        $data = $prestamo->detalles->map(function ($d) use ($today) {
            // Normaliza fecha de pago con timezone seguro
            $fecha = $d->fecha_pago instanceof Carbon
                ? $d->fecha_pago->copy()->startOfDay()
                : ($d->fecha_pago ? Carbon::parse($d->fecha_pago, 'America/Merida')->startOfDay() : null);

            $estaPagadoBool = isset($d->esta_pagado)
                ? (int)$d->esta_pagado === 1
                : (int)($d->estado ?? 0) === 1;

            // Moroso: cuota pendiente y fecha de pago < hoy
            $esMoroso = !$estaPagadoBool && $fecha && $fecha->lt($today);
            $diasMora = $esMoroso ? $fecha->diffInDays($today) : 0;

            return [
                'id'            => $d->id,
                'fecha_pago'    => $fecha ? $fecha->toDateString() : null,
                'monto_pago'    => $d->monto_pago,
                'esta_pagado'   => $estaPagadoBool ? 'Pagado' : 'Pendiente',
                'es_moroso'     => $esMoroso,
                'dias_mora'     => $diasMora,
                'monto_abonado' => $d->monto_abonado ?? 0,
                'usuario'       => $d->usuario ?? null, // 👈 visible en la respuesta
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Consulta exitosa',
            'data'    => $data,
        ], 200);
    }
    
    /**
     * Pagar una cuota del préstamo.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id  ID del detalle del préstamo (cuota)
     * @return \Illuminate\Http\Response
     */

    public function pagarCuota(Request $request, $id){
        try {
            return DB::transaction(function () use ($request, $id) {

                $detalle = DetallePrestamo::lockForUpdate()->findOrFail($id);

                // 1) Validar cantidad si viene en el request
                $cantidad = $request->cantidad ?? null; 
                if ($cantidad !== null) {
                    if (!is_numeric($cantidad)) {
                        return response()->json([
                            'success' => false,
                            'message' => 'La cantidad debe ser numérica.'
                        ], 422);
                    }
                    if ((float)$cantidad <= 0) {
                        return response()->json([
                            'success' => false,
                            'message' => 'La cantidad debe ser mayor a 0.'
                        ], 422);
                    }
                }

                // 2) Verificar si ya está liquidada
                if ((int)$detalle->esta_pagado === 1) {
                    return response()->json([
                        'success' => false,
                        'message' => 'La cuota ya fue pagada previamente.'
                    ], 400);
                }

                // 3) Monto total de la cuota
                $importeCuota = (float) (
                    $detalle->monto_cuota
                    ?? $detalle->monto
                    ?? $detalle->monto_pago // tu campo del total
                    ?? 0
                );

                // 4) Lo que ya lleva abonado
                $pagadoActual = (float) ($detalle->monto_abonado ?? 0);
                $restante     = max($importeCuota - $pagadoActual, 0);

                // 5) Determinar cuánto abonar
                if ($cantidad === null) {
                    $abono = $restante; // liquidar todo si no mandan cantidad
                } else {
                    $abono = min((float)$cantidad, $restante);
                }

                // 6) Si ya no queda nada, marcar liquidado
                if ($restante <= 1e-8) {
                    $detalle->esta_pagado = 1;
                    $detalle->fecha_pago = $detalle->fecha_pago ?? Carbon::now();
                    $detalle->save();
                    $this->cerrarPrestamoSiCorresponde($detalle->prestamo_id);

                    return response()->json([
                        'success'  => true,
                        'message'  => 'La cuota se ha liquidado.',
                        'data'     => [
                            'detalle'   => $detalle,
                            'pagado'    => 0,
                            'restante'  => 0,
                            'liquidada' => true,
                        ],
                    ], 200);
                }

                // 7) Aplicar abono
                $detalle->monto_abonado = $pagadoActual + $abono;

                if ($detalle->monto_abonado + 1e-8 >= $importeCuota) {
                    $detalle->esta_pagado = 1; // pagado
                    $detalle->fecha_pago = Carbon::now();
                }
                $detalle->usuario = $this->resolveUsuarioFromToken($request);

                $detalle->save();

                if ($abono > 0) {
                    $metodo = $request->get('metodo_pago', 'Efectivo');
                    $this->registrarTransaccion(
                        'Ingreso',
                        (float)$abono,
                        "Pago de cuota detalle #{$detalle->id} del préstamo #{$detalle->prestamo_id}",
                        $metodo,
                        "prestamo:{$detalle->prestamo_id}|detalle:{$detalle->id}",
                        null,
                        $detalle->usuario
                    );
                }

                if ((int)$detalle->esta_pagado === 1) {
                    $this->cerrarPrestamoSiCorresponde($detalle->prestamo_id);
                }

                return response()->json([
                    'success' => true,
                    'message' => (int)$detalle->esta_pagado === 1
                        ? 'Cuota liquidada correctamente'
                        : 'Abono registrado correctamente',
                    'data' => [
                        'detalle'   => $detalle,
                        'pagado'    => $abono,
                        'restante'  => max($importeCuota - (float)$detalle->monto_abonado, 0),
                        'liquidada' => (int)$detalle->esta_pagado === 1,
                    ],
                ], 200);
            });

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Detalle de préstamo no encontrado',
                'errors'  => $e->getMessage(),
            ], 404);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al procesar el pago de la cuota',
                'errors'  => $e->getMessage(),
            ], 500);
        }
    }

    



    /**
     * Si todas las cuotas están pagadas, cerrar el préstamo.
     */
    private function cerrarPrestamoSiCorresponde(int $prestamoId): void{
        $pendientes = DetallePrestamo::where('prestamo_id', $prestamoId)
            ->where('esta_pagado', 0)
            ->count();

        if ($pendientes === 0) {
            Prestamo::where('id', $prestamoId)->update(['estado' => 0]);
        }
    }


    public function verificarSiFinalizado(){
        if ($this->detalles()->where('esta_pagado', 0)->count() === 0) {
            $this->esta_pagado = 0;
            $this->save();
        }
    }


}
