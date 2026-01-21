<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Model;

abstract class BaseCrudController extends Controller
{
    /** Devuelve el Model class (ej: Space::class) */
    abstract protected function model(): string;

    /** Reglas para store */
    abstract protected function rulesStore(Request $request): array;

    /** Reglas para update (normalmente "sometimes") */
    abstract protected function rulesUpdate(Request $request): array;

    /** Hook opcional: filtros/busqueda/paginación */
    protected function applyIndexQuery($query, Request $request)
    {
        return $query;
    }

    /** Hook opcional: selección de columnas (para index) */
    protected function indexSelect(): array
    {
        return ['*'];
    }

    /** Hook opcional: orden default */
    protected function indexOrder($query, Request $request)
    {
        return $query->orderByDesc('id');
    }

    /** Hook opcional: mutate/normaliza data antes de guardar */
    protected function beforeStore(array $data, Request $request): array
    {
        return $data;
    }

    protected function beforeUpdate(array $data, Request $request, Model $model): array
    {
        return $data;
    }

    /** GET /resource */
    public function index(Request $request)
    {
        $modelClass = $this->model();
        $q = $modelClass::query();

        $q = $this->applyIndexQuery($q, $request);
        $q = $this->indexOrder($q, $request);

        $perPage = (int) $request->get('perPage', 10);

        // paginate() regresa estructura estándar
        $items = $q->select($this->indexSelect())->paginate($perPage);

        return response()->json($items);
    }

    /** GET /resource/{id} */
    public function find($id)
    {
        $modelClass = $this->model();
        $item = $modelClass::findOrFail($id);

        return response()->json(['data' => $item]);
    }

    /** POST /resource */
    public function store(Request $request)
    {
        $data = $request->validate($this->rulesStore($request));
        $data = $this->beforeStore($data, $request);

        $modelClass = $this->model();
        $item = $modelClass::create($data);

        return response()->json([
            'message' => 'Creado correctamente',
            'data' => $item,
        ], 201);
    }

    /** PUT/PATCH /resource/{id} */
    public function update(Request $request, $id)
    {
        $modelClass = $this->model();
        $item = $modelClass::findOrFail($id);

        $data = $request->validate($this->rulesUpdate($request));
        $data = $this->beforeUpdate($data, $request, $item);

        $item->update($data);

        return response()->json([
            'message' => 'Actualizado correctamente',
            'data' => $item->fresh(),
        ]);
    }

    /** DELETE /resource/{id} */
    public function delete($id)
    {
        $modelClass = $this->model();
        $item = $modelClass::findOrFail($id);

        $item->delete();

        return response()->json([
            'message' => 'Eliminado correctamente',
        ]);
    }
}