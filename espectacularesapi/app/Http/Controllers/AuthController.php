<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Entities\User;
use Tymon\JWTAuth\Facades\JWTAuth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;


class AuthController extends Controller
{
    public function login(Request $request)
    {
        // Validar los datos
        $this->validate($request, [
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        // Buscar al usuario por nombre de usuario
        $user = User::where('username', $request->username)->first();
        // Verificar la contraseña
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Credenciales incorrectas'], 401);
        }

        $user->api_token = Str::random(60);
        $user->create_token = Carbon::now();
        // $user->save();
        $user->update([
            'api_token' => $user->api_token,
            'create_token' => $user->create_token,
        ]);

        return response()->json([
            'message' => 'Inicio de sesión exitoso',
            'access_token' => $user->api_token,
            'expires_in' => max(1, (int) env('ACCESS_TTL_MINUTES', 30)) * 60,
            'token_type' => 'Bearer',
            //'user' => $user,
        ],200);
    }

    public function sendResetLink(Request $request)
    {
        $this->validate($request, [
            'email' => 'required|string'
        ]);
        
        try {
            $user = User::where('email', $request->email)->first();
            if(!$user){
                throw new \Exception("Usuario no encontrado");
            }

            $token = Str::random(60);
            DB::table('password_resets')->insert([
                'email' => $user->email,
                'token' => $token,
                'created_at' => Carbon::now(),
            ]);
    
            // Enviar correo
            
            $template = view('emails.password-reset', ['token' => $token, 'email' => $user->email]);

            Mail::html($template, function($message) use($user) {
                $mailDire[] = $user->email;
                $mailDire[] = 'danielsolis023@gmail.com';
                $message->subject('Restablecimiento de contraseña')->to($mailDire);
            });
    
            return response()->json(['success' => true, 'message' => 'Enlace de recuperación enviado.'], 200);
        } 
        catch (\Illuminate\Validation\ValidationException $e) {
            // Errores de validación
            return response()->json(['success' => false, 'error' => 'Datos no válidos', 'details' => $e->errors()], 422);
        } catch (\Illuminate\Database\QueryException $e) {
            // Errores de base de datos
            return response()->json(['success' => false, 'error' => 'Error en la base de datos', 'details' => $e->getMessage()], 500);
        } catch (\Exception $e) {
            // Otros errores generales
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    // Enviar solicitud de cambio de contraseña
    public function resetPassword(Request $request)
    {
        try {

            $this->validate($request,[
                'token' => 'required',
                'password' => 'required|confirmed|min:8',
            ]);

            $reset = DB::table('password_resets')
                // ->where('email', $request->email)
                ->where('token', $request->token)
                ->first();

            if (!$reset || $reset->created_at < Carbon::now()->subHours(2)) {
                return response()->json(['message' => 'El token es inválido o ha expirado.'], 400);
            }

            DB::table('users')->where('email', $reset->email)->update([
                'password' => Hash::make($request->password),
            ]);

            DB::table('password_resets')->where('email', $reset->email)->delete();

            return response()->json([
                'success' => true,
                'message' => 'Contraseña actualizada exitosamente.'
            ], 200);
        }
        catch (ValidationException $e) {
            // Errores de validación
            return response()->json([
                'success' => true,
                'message' => 'Datos no válidos',
                'errors' => $e->errors()
            ], 422);
        }
        catch (\Illuminate\Database\QueryException $e) {
            // Errores de base de datos
            return response()->json([
                'success' => false,
                'message' => 'Error en la base de datos',
                'errors'  => $e->getMessage()
            ], 500);
        }
        catch (\Exception $e) {
            // Otros errores generales
            return response()->json([
                'success' => false,
                'message' => 'Ocurrió un error inesperado', 
                'errors'  => $e->getMessage()
            ], 500);
        }
    }
     
    public function changePassword(Request $request)
    {
        try {
            // Obtener el token de la cabecera X-Requested-With
            $token = $request->header('X-Requested-With');

            // Validar que el token esté presente
            if (!$token) {
                return response()->json(['success' => false, 'error' => 'Token no proporcionado'], 401);
            }

            // Buscar el usuario asociado al token (supongamos que el token es un campo en la tabla 'users')
            $user = User::where('api_token', $token)->first();

            if (!$user) {
                return response()->json(['error' => 'Token inválido'], 401);
            }

            // Validar la nueva contraseña
            $this->validate($request,[
                'new_password' => 'required|min:8|confirmed',
            ]);

            // Cambiar la contraseña
            $user->password = Hash::make($request->input('new_password'));
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Contraseña actualizada correctamente'
            ],200);
        } 
        catch (\Illuminate\Validation\ValidationException $e) {
            // Capturar errores de validación
            return response()->json([
                'success' => false,
                'message' => 'Datos inválidos', 
                'errors' => $e->errors()
            ], 422);
        } 
        catch (\Exception $e) {
            // Capturar cualquier otro error
            return response()->json([
                'success' => false,
                'message' => 'Ocurrió un error inesperado', 
                'errors' => $e->getMessage()
            ], 500);
        }
    }

    public function logout(\Illuminate\Http\Request $request){
        $user = $request->attributes->get('auth_user');

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $user->api_token = null;
        $user->create_token = null;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Sesión cerrada correctamente'
        ], 200);
    }

    


}
