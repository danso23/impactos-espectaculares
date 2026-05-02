<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Entities\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Exception;

class UserController extends Controller
{
    public function index()
    {
        try {
            $users = User::with('roles')
                ->where('username', '!=', 'admin')
                ->select('id', 'name', 'username', 'email', 'role', 'is_active', 'created_at')
                ->orderBy('id', 'desc')
                ->get();

            // Formatear para enviar los nombres de los roles de forma plana
            $users->transform(function ($user) {
                $user->roles_array = $user->getRoleNames();
                return $user;
            });

            return response()->json([
                'success' => true,
                'message' => 'Usuarios obtenidos correctamente.',
                'data' => $users,
            ], 200);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Ha ocurrido un error, intenta más tarde.',
                'errors' => $e->getMessage(),
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $user = User::with('roles')->select('id', 'name', 'username', 'email', 'role', 'is_active')
                ->find($id);

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no encontrado.',
                ], 404);
            }

            $user->roles_array = $user->getRoleNames();

            return response()->json([
                'success' => true,
                'message' => 'Usuario obtenido correctamente.',
                'data' => $user,
            ], 200);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Ha ocurrido un error, intenta más tarde.',
                'errors' => $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $this->validate($request, [
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'roles' => 'required|array|min:1',
                'roles.*' => 'string|exists:roles,name',
                'password' => 'required|string|min:8',
                'is_active' => 'nullable|boolean',
                'username' => 'nullable|string|max:255|unique:users,username',
            ]);

            // Mantenemos 'role' string temporalmente por compatibilidad con código anterior, usando el primero
            $primaryRole = !empty($request->input('roles')) ? $request->input('roles')[0] : 'regular';

            $user = User::create([
                'name' => $request->input('name'),
                'username' => $request->input('username'),
                'email' => $request->input('email'),
                'password' => Hash::make($request->input('password')),
                'role' => $primaryRole,
                'is_active' => $request->input('is_active', true),
            ]);

            // Asignar roles de Spatie
            $user->syncRoles($request->input('roles'));

            $user->load('roles');
            $user->roles_array = $user->getRoleNames();

            return response()->json([
                'success' => true,
                'message' => 'Usuario creado exitosamente.',
                'data' => $user,
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Datos inválidos.',
                'errors' => $e->errors(),
            ], 422);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Ha ocurrido un error, intenta más tarde.',
                'errors' => $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $user = User::find($id);

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no encontrado.',
                ], 404);
            }

            $this->validate($request, [
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email,' . $id,
                'roles' => 'required|array',
                'roles.*' => 'string|exists:roles,name',
                'password' => 'nullable|string|min:8',
                'is_active' => 'nullable|boolean',
                'username' => 'nullable|string|max:255|unique:users,username,' . $id,
            ]);

            $primaryRole = !empty($request->input('roles')) ? $request->input('roles')[0] : 'regular';

            $data = [
                'name' => $request->input('name'),
                'username' => $request->input('username'),
                'email' => $request->input('email'),
                'role' => $primaryRole,
                'is_active' => $request->input('is_active', $user->is_active),
            ];

            if ($request->filled('password')) {
                $data['password'] = Hash::make($request->input('password'));
            }

            if ($user->username === 'admin') {
                $data['is_active'] = true;
                $data['role'] = 'admin'; // Forzar rol admin también
            }

            $user->update($data);

            // Asignar roles de Spatie
            $user->syncRoles($request->input('roles'));

            $user->load('roles');
            $user->roles_array = $user->getRoleNames();

            return response()->json([
                'success' => true,
                'message' => 'Usuario actualizado correctamente.',
                'data' => $user,
            ], 200);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Datos inválidos.',
                'errors' => $e->errors(),
            ], 422);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Ha ocurrido un error, intenta más tarde.',
                'errors' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $user = User::find($id);

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no encontrado.',
                ], 404);
            }

            if ($user->username === 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'El usuario administrador no puede ser desactivado.',
                ], 403);
            }

            $user->update([
                'is_active' => false,
                'api_token' => null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Usuario desactivado correctamente.',
            ], 200);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Ha ocurrido un error, intenta más tarde.',
                'errors' => $e->getMessage(),
            ], 500);
        }
    }
}
