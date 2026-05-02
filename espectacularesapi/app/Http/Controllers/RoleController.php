<?php

namespace App\Http\Controllers;

use Spatie\Permission\Models\Role;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    public function index()
    {
        try {
            $guard = config('auth.defaults.guard') ?? 'api';
            $roles = Role::where('guard_name', $guard)
                ->where('name', '!=', 'admin')
                ->select('id', 'name')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Roles obtenidos correctamente.',
                'data' => $roles,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los roles.',
                'errors' => $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $this->validate($request, [
                'name' => 'required|string|unique:roles,name',
            ]);

            $guard = config('auth.defaults.guard') ?? 'api';
            
            $role = Role::create([
                'name' => $request->name,
                'guard_name' => $guard
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Rol creado correctamente.',
                'data' => $role,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear el rol.',
                'errors' => $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $role = Role::find($id);
            if (!$role) {
                return response()->json(['success' => false, 'message' => 'Rol no encontrado.'], 404);
            }

            if ($role->name === 'admin') {
                return response()->json(['success' => false, 'message' => 'El rol admin no puede ser modificado.'], 403);
            }

            $this->validate($request, [
                'name' => 'required|string|unique:roles,name,' . $id,
            ]);

            $role->update(['name' => $request->name]);

            return response()->json([
                'success' => true,
                'message' => 'Rol actualizado correctamente.',
                'data' => $role,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el rol.',
                'errors' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $role = Role::find($id);
            if (!$role) {
                return response()->json(['success' => false, 'message' => 'Rol no encontrado.'], 404);
            }

            if ($role->name === 'admin') {
                return response()->json(['success' => false, 'message' => 'El rol admin no puede ser eliminado.'], 403);
            }

            $role->delete();

            return response()->json([
                'success' => true,
                'message' => 'Rol eliminado correctamente.',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar el rol.',
                'errors' => $e->getMessage(),
            ], 500);
        }
    }
}
