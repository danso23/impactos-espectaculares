<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\Entities\Grupo;
use App\Support\ResolvesUsuarioFromToken;

class GrupoController extends Controller
{
    use ResolvesUsuarioFromToken;

    public function show(Request $request)
    {
        try {
            $usuario = $this->resolveUsuarioFromToken($request);
            if (!$usuario) {
                return response()->json([
                    'success' => false,
                    'message' => 'Token inválido o ausente en X-Requested-With',
                ], 401);
            }
            
            // Traer todos los grupos con sus relaciones
            $grupos = Grupo::with('clientes')
            ->visibleForUsuario('grupos.usuario', $usuario)
            ->get();

            return response()->json([
                'success' => true,
                'message' => 'Grupos obtenidos exitosamente',
                'data'    => $grupos,
            ], 200);
        }
        catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Ocurrió un error inesperado',
                'errors'   => $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            // Validar los datos
            $validated = $this->validate($request, [
                'nombre'        => 'required|string|max:100',
                'localidad'     => 'required',
                'num_grupo_id'  => 'required|unique:grupos,num_grupo_id'
            ],
            [
                'nombre.required'      => 'El nombre del grupo es requerido',

                'cliente_id.exists'    => 'El cliente no existe, verifique de nuevo',

                'num_grupo_id'         => 'El campo de id grupo es requerido',
                'num_grupo_id.unique'  => 'Este grupo ya existe'
            ]);

            $usuario = $this->resolveUsuarioFromToken($request);
            if (!$usuario) {
                return response()->json(['success'=>false,'message'=>'Token inválido o ausente'], 401);
            }
            $validated['usuario'] = $usuario;

            // Crear el grupo
            $grupo = Grupo::create($validated);

            // Respuesta de éxito
            return response()->json([
                'success' => true,
                'message' => 'Grupo creado exitosamente',
                'data' => $grupo,
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
            // Manejo de errores generales
            return response()->json([
                'message' => 'Ocurrió un error inesperado',
                'errors' => $e->getMessage(),
            ], 500);
        }
    }

    public function attachCliente(Request $request, $grupoId)
    {
        try {
            // Validar los datos
            $validated = $this->validate($request, [
                'cliente_ids' => 'required|array',
                'cliente_ids.*' => 'exists:clientes,id',
            ]);

            // Buscar el grupo
            $grupo = Grupo::findOrFail($grupoId);

            // Asociar clientes al grupo
            $grupo->clientes()->syncWithoutDetaching($validated['cliente_ids']);

            return response()->json([
                'success' => true,
                'message' => 'Clientes asociados al grupo exitosamente',
                'data' => $grupo->load('clientes'),
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Ocurrió un error inesperado',
                'errors' => $e->getMessage(),
            ], 500);
        }
    }
}
