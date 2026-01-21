<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Entities\User;
use Illuminate\Support\Facades\Hash;
use Exception;

class UserController extends Controller
{
    public function Register(Request $request){
        try{
            $exists = User::where([['username', 'admin'] ])->exists();
            if($exists){
                return response()->json([
                    'message' => 'El usuario ya existe.',
                ], 400);
            }
            $user = User::create([
                'name' => 'Admin User',
                'username' => 'admin',
                'email' => 'admin@espectaculares.com',
                'password' => Hash::make('password'), // Encripta la contraseña
            ]);
            return response()->json([
                'success' => true,
                'message' => 'Usuario creado exitosamente.',
            ], 200);
        }
        catch(Exception $e){
            return response()->json([
                'success' => false,
                'message' => 'Ha ocurrido un error, intenta más tarde',
                'errors'  => $e->getMessage(),
            ], 500);
        }
        
    }
}
