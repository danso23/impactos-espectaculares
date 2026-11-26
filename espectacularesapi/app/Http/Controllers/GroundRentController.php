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

    /**
     * Edita el importe de un pago (p. ej. ajuste anual por inflación).
     * Con apply_to_following, el nuevo importe también se aplica a los pagos
     * siguientes del mismo contrato que sigan pendientes o vencidos.
     */
    public function updatePaymentAmount(Request $request, $id)
    {
        $data = $this->validated($request, [
            'amount' => ['required', 'numeric', 'min:0.01'],
            'apply_to_following' => ['sometimes', 'boolean'],
        ]);
        $payment = GroundRentPayment::query()->findOrFail($id);
        if (in_array($payment->status, ['paid', 'cancelled'], true)) {
            return response()->json(['message' => 'Solo se puede modificar el importe de pagos pendientes o vencidos.'], 422);
        }

        $updated = DB::transaction(function () use ($payment, $data) {
            $query = GroundRentPayment::query()
                ->where('ground_rent_contract_id', $payment->ground_rent_contract_id)
                ->whereIn('status', ['pending', 'overdue']);
            if (!empty($data['apply_to_following'])) {
                $query->where('installment_number', '>=', $payment->installment_number);
            } else {
                $query->whereKey($payment->id);
            }
            return $query->update(['amount' => round((float) $data['amount'], 2)]);
        });

        return response()->json([
            'message' => $updated > 1 ? "Importe actualizado en {$updated} pagos." : 'Importe actualizado.',
            'data' => $payment->fresh(),
            'updated' => $updated,
        ]);
    }

    /** Reporte de pagos a caseros por rango de fechas de vencimiento. */
    public function paymentsReport(Request $request)
    {
        $data = $this->validated($request, [
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'status' => ['nullable', 'in:pending,paid,overdue,cancelled'],
            'casero_id' => ['nullable', 'integer'],
        ]);
        $this->refreshOverduePayments();

        $payments = GroundRentPayment::query()
            ->with(['contract.property.casero', 'contract.property.spaces:id,ground_property_id,title,assigned_id'])
            ->when($data['from'] ?? null, fn ($query, $from) => $query->whereDate('due_date', '>=', $from))
            ->when($data['to'] ?? null, fn ($query, $to) => $query->whereDate('due_date', '<=', $to))
            ->when($data['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->when($data['casero_id'] ?? null, fn ($query, $caseroId) => $query->whereHas('contract.property', fn ($property) => $property->where('casero_id', $caseroId)))
            ->orderBy('due_date')
            ->orderBy('id')
            ->get();

        $rows = $payments->map(function (GroundRentPayment $payment) {
            $contract = $payment->contract;
            $property = $contract?->property;
            $casero = $property?->casero;
            return [
                'id' => $payment->id,
                'month' => $payment->due_date?->format('Y-m'),
                'due_date' => $payment->due_date?->format('Y-m-d'),
                'period_start' => $payment->period_start?->format('Y-m-d'),
                'period_end' => $payment->period_end?->format('Y-m-d'),
                'installment_number' => $payment->installment_number,
                'payment_count' => $contract?->payment_count,
                'amount' => (float) $payment->amount,
                'status' => $payment->status,
                'paid_at' => $payment->paid_at?->format('Y-m-d'),
                'reference' => $payment->reference,
                'contract_id' => $contract?->id,
                'contract_number' => $contract?->contract_number,
                'payment_frequency' => $contract?->payment_frequency,
                'property_name' => $property?->name,
                'property_address' => $property?->address,
                'casero_id' => $casero?->id,
                'casero_name' => $casero ? trim(implode(' ', array_filter([$casero->nombre, $casero->apellido_paterno, $casero->apellido_materno]))) : null,
                'spaces' => $property ? $property->spaces->map(fn ($space) => ['id' => $space->id, 'assigned_id' => $space->assigned_id, 'title' => $space->title])->values() : [],
            ];
        })->values();

        $months = $rows->groupBy('month')->map(fn ($items, $month) => [
            'month' => $month,
            'count' => $items->count(),
            'total' => round($items->where('status', '!=', 'cancelled')->sum('amount'), 2),
            'paid' => round($items->where('status', 'paid')->sum('amount'), 2),
            'pending' => round($items->whereIn('status', ['pending', 'overdue'])->sum('amount'), 2),
        ])->values();

        return response()->json([
            'data' => $rows,
            'months' => $months,
            'totals' => [
                'count' => $rows->count(),
                'total' => round($months->sum('total'), 2),
                'paid' => round($months->sum('paid'), 2),
                'pending' => round($months->sum('pending'), 2),
            ],
        ]);
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
