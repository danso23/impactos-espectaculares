<?php

namespace App\Http\Controllers;

use App\Models\Entities\Casero;
use App\Models\Entities\GroundProperty;
use App\Models\Entities\GroundRentContract;
use App\Models\Entities\GroundRentPayment;
use App\Models\Entities\Space;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class GroundRentController extends Controller
{
    public function indexForCasero($id)
    {
        Casero::query()->findOrFail($id);
        $this->refreshOverduePayments();

        return response()->json([
            'data' => GroundProperty::query()
                ->where('casero_id', $id)
                ->with(['spaces:id,ground_property_id,title,assigned_id,type,view_type,has_lights,width_m,height_m', 'contracts.payments'])
                ->orderByDesc('id')
                ->get(),
        ]);
    }

    public function availableSpaces()
    {
        return response()->json([
            'data' => Space::query()
                ->whereNull('ground_property_id')
                ->select(['id', 'title'])
                ->orderBy('title')
                ->get(),
        ]);
    }

    public function storeProperty(Request $request, $id)
    {
        Casero::query()->findOrFail($id);
        $data = $this->validated($request, [
            'name' => ['required', 'string', 'max:150'],
            'address' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'space_ids' => ['nullable', 'array'],
            'space_ids.*' => ['integer', 'distinct', 'exists:spaces,id'],
        ]);

        try {
            $property = DB::transaction(function () use ($data, $id) {
                $property = GroundProperty::create([
                    'casero_id' => $id,
                    'name' => $data['name'],
                    'address' => $data['address'] ?? null,
                    'notes' => $data['notes'] ?? null,
                ]);
                $this->assignSpaces($property, $data['space_ids'] ?? []);
                return $property;
            });
        } catch (\DomainException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json(['message' => 'Predio creado correctamente.', 'data' => $property->load('spaces')], 201);
    }

    public function updateProperty(Request $request, $id)
    {
        $property = GroundProperty::query()->findOrFail($id);
        $data = $this->validated($request, [
            'name' => ['sometimes', 'required', 'string', 'max:150'],
            'address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'notes' => ['sometimes', 'nullable', 'string'],
            'space_ids' => ['sometimes', 'array'],
            'space_ids.*' => ['integer', 'distinct', 'exists:spaces,id'],
        ]);

        try {
            DB::transaction(function () use ($property, $data) {
                $property->fill(collect($data)->except('space_ids')->all())->save();
                if (array_key_exists('space_ids', $data)) $this->assignSpaces($property, $data['space_ids']);
            });
        } catch (\DomainException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json(['message' => 'Predio actualizado correctamente.', 'data' => $property->fresh('spaces')]);
    }

    public function storeContract(Request $request)
    {
        $data = $this->validated($request, [
            'ground_property_id' => ['required', 'integer', 'exists:ground_properties,id'],
            'contract_number' => ['required', 'string', 'max:80'],
            'starts_at' => ['required', 'date'],
            'first_payment_date' => ['required', 'date'],
            'payment_frequency' => ['required', 'in:monthly,quarterly,semiannual,annual'],
            'payment_count' => ['required', 'integer', 'min:1', 'max:120'],
            'payment_amount' => ['required', 'numeric', 'min:0.01'],
            'notes' => ['nullable', 'string'],
        ]);

        $contract = DB::transaction(function () use ($data) {
            $contract = GroundRentContract::create($data);
            $months = ['monthly' => 1, 'quarterly' => 3, 'semiannual' => 6, 'annual' => 12][$data['payment_frequency']];
            $startsAt = Carbon::parse($data['starts_at'])->startOfDay();
            $firstPayment = Carbon::parse($data['first_payment_date'])->startOfDay();

            for ($index = 0; $index < (int) $data['payment_count']; $index++) {
                $periodStart = $startsAt->copy()->addMonthsNoOverflow($months * $index);
                GroundRentPayment::create([
                    'ground_rent_contract_id' => $contract->id,
                    'installment_number' => $index + 1,
                    'period_start' => $periodStart,
                    'period_end' => $periodStart->copy()->addMonthsNoOverflow($months)->subDay(),
                    'due_date' => $firstPayment->copy()->addMonthsNoOverflow($months * $index),
                    'amount' => $data['payment_amount'],
                ]);
            }
            return $contract;
        });

        return response()->json(['message' => 'Contrato y calendario creados correctamente.', 'data' => $contract->load('payments')], 201);
    }

    public function markPaymentPaid(Request $request, $id)
    {
        $data = $this->validated($request, [
            'paid_at' => ['nullable', 'date'],
            'reference' => ['nullable', 'string', 'max:100'],
        ]);
        $payment = GroundRentPayment::query()->findOrFail($id);
        if ($payment->status === 'cancelled') return response()->json(['message' => 'No se puede pagar una parcialidad cancelada.'], 422);

        $payment->update([
            'status' => 'paid',
            'paid_at' => isset($data['paid_at']) ? Carbon::parse($data['paid_at']) : Carbon::now(),
            'reference' => $data['reference'] ?? $payment->reference,
        ]);

        return response()->json(['message' => 'Pago de renta de piso marcado como pagado.', 'data' => $payment->fresh()]);
    }

    private function assignSpaces(GroundProperty $property, array $spaceIds): void
    {
        $spaceIds = collect($spaceIds)->map(fn ($id) => (int) $id)->unique()->values();
        DB::table('spaces')->where('ground_property_id', $property->id)->whereNotIn('id', $spaceIds)->update(['ground_property_id' => null]);
        if ($spaceIds->isEmpty()) return;
        $alreadyAssigned = DB::table('spaces')->whereIn('id', $spaceIds)->whereNotNull('ground_property_id')->where('ground_property_id', '!=', $property->id)->exists();
        if ($alreadyAssigned) throw new \DomainException('Uno de los espacios ya pertenece a otro predio.');
        DB::table('spaces')->whereIn('id', $spaceIds)->update(['ground_property_id' => $property->id]);
    }

    private function refreshOverduePayments(): void
    {
        GroundRentPayment::query()->where('status', 'pending')->whereDate('due_date', '<', Carbon::today())->update(['status' => 'overdue']);
    }

    private function validated(Request $request, array $rules): array
    {
        $validator = Validator::make($request->all(), $rules);
        if ($validator->fails()) {
            throw new \Illuminate\Http\Exceptions\HttpResponseException(
                response()->json(['message' => 'Completa los datos requeridos.', 'errors' => $validator->errors()], 422)
            );
        }
        return $validator->validated();
    }
}
