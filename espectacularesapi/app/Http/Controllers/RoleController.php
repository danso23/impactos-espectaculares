<?php

namespace App\Http\Controllers;

use Spatie\Permission\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class RoleController extends Controller
{
    public function index()
    {
        try {
            $guard = config('auth.defaults.guard') ?? 'api';
            $allowedPermissions = $this->allowedPermissions();
            $roles = Role::where('guard_name', $guard)
                ->where('name', '!=', 'admin')
                ->with(['permissions' => function ($query) {
                    $query->select('permissions.id', 'permissions.name');
                }])
                ->select('id', 'name', 'guard_name')
                ->get();

            $roles = $roles->map(function ($role) use ($allowedPermissions) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'permissions' => $role->permissions->pluck('name')->filter(function ($permission) use ($allowedPermissions) {
                        return in_array($permission, $allowedPermissions, true);
                    })->values()->all(),
                ];
            });

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

    public function permissionCatalog()
    {
        $actions = config('access.actions', []);
        $modules = collect(config('access.modules', []))->map(function ($label, $key) use ($actions) {
            return [
                'key' => $key,
                'label' => $label,
                'permissions' => collect($actions)->mapWithKeys(function ($actionLabel, $action) use ($key) {
                    return [$action => $key . '.' . $action];
                })->all(),
            ];
        })->values();

        return response()->json([
            'success' => true,
            'message' => 'Catálogo de permisos obtenido correctamente.',
            'data' => [
                'actions' => $actions,
                'modules' => $modules,
            ],
        ]);
    }

    public function store(Request $request)
    {
        try {
            $this->validate($request, [
                'name' => 'required|string|unique:roles,name',
                'permissions' => 'present|array',
                'permissions.*' => ['string', Rule::in($this->allowedPermissions())],
            ]);

            $guard = config('auth.defaults.guard') ?? 'api';
            
            $role = DB::transaction(function () use ($request, $guard) {
                $role = Role::create([
                    'name' => $request->name,
                    'guard_name' => $guard,
                ]);
                $role->syncPermissions($request->input('permissions', []));
                return $role;
            });

            $roleData = [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions()->pluck('name')->values()->all(),
            ];

            return response()->json([
                'success' => true,
                'message' => 'Rol creado correctamente.',
                'data' => $roleData,
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Datos inválidos.',
                'errors' => $e->errors(),
            ], 422);
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
                'permissions' => 'present|array',
                'permissions.*' => ['string', Rule::in($this->allowedPermissions())],
            ]);

            DB::transaction(function () use ($request, $role) {
                $role->update(['name' => $request->name]);
                $role->syncPermissions($request->input('permissions', []));
            });

            $roleData = [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions()->pluck('name')->values()->all(),
            ];

            return response()->json([
                'success' => true,
                'message' => 'Rol actualizado correctamente.',
                'data' => $roleData,
            ], 200);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Datos inválidos.',
                'errors' => $e->errors(),
            ], 422);
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

    private function allowedPermissions(): array
    {
        $permissions = [];

        foreach (array_keys(config('access.modules', [])) as $module) {
            foreach (array_keys(config('access.actions', [])) as $action) {
                $permissions[] = $module . '.' . $action;
            }
        }

        return $permissions;
    }
}
