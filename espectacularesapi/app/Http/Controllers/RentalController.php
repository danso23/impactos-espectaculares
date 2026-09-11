<?php

namespace App\Http\Controllers;

use App\Models\Entities\Rental;
use App\Models\Entities\RentalItem;
use App\Models\Entities\Lead;
use App\Models\Entities\Agency;
use App\Services\RentalCommissionCalculator;
use App\Services\RentalPaymentSchedule;
use App\Services\SpaceAvailability;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class RentalController extends BaseCrudController
{
    private RentalPaymentSchedule $paymentSchedule;
    private RentalCommissionCalculator $commissionCalculator;
    private SpaceAvailability $spaceAvailability;

    public function __construct()
    {
        $this->paymentSchedule = new RentalPaymentSchedule();
        $this->commissionCalculator = new RentalCommissionCalculator();
        $this->spaceAvailability = new SpaceAvailability();
    }

    protected function model(): string
    {
        return Rental::class;
    }

    protected function rulesStore(Request $request): array
    {
        return [
            'quote_id' => ['nullable', 'integer', 'exists:quotes,id', 'unique:rentals,quote_id'],
            'customer_type' => ['nullable', 'in:lead,cliente,sin_cliente'],
            'customer_id' => ['nullable', 'integer'],
            'agency_id' => ['nullable', 'integer', 'exists:agencies,id'],
            'issuer_company_id' => ['nullable', 'integer', 'exists:companies,id'],
            'created_by' => ['nullable', 'integer', 'exists:users,id'],
            'status' => ['nullable', 'in:draft,active,completed,cancelled'],
            'is_rotating' => ['nullable', 'boolean'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date'],
            'payment_frequency' => ['nullable', 'in:single,weekly,biweekly,monthly,annual'],
            'first_payment_date' => ['nullable', 'date'],
            'payment_installments' => ['nullable', 'integer', 'min:0'],
            'commission_base' => ['nullable', 'numeric', 'min:0'],
            'commission_type' => ['nullable', 'in:none,percent,fixed'],
            'commission_value' => ['nullable', 'numeric', 'min:0'],
            'commission_amount' => ['nullable', 'numeric', 'min:0'],
            'subtotal' => ['nullable', 'numeric', 'min:0'],
            'tax' => ['nullable', 'numeric', 'min:0'],
            'total' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'snapshot_json' => ['nullable'],
        ];
    }

    protected function rulesUpdate(Request $request): array
    {
        $id = $request->route('id') ?? $request->route()[2]['id'] ?? null;

        return [
            'quote_id' => ['sometimes', 'nullable', 'integer', 'exists:quotes,id', "unique:rentals,quote_id,{$id}"],
            'customer_type' => ['sometimes', 'nullable', 'in:lead,cliente,sin_cliente'],
            'customer_id' => ['sometimes', 'nullable', 'integer'],
            'agency_id' => ['sometimes', 'nullable', 'integer', 'exists:agencies,id'],
            'issuer_company_id' => ['sometimes', 'nullable', 'integer', 'exists:companies,id'],
            'created_by' => ['sometimes', 'nullable', 'integer', 'exists:users,id'],
            'status' => ['sometimes', 'nullable', 'in:draft,active,completed,cancelled'],
            'is_rotating' => ['sometimes', 'nullable', 'boolean'],
            'starts_at' => ['sometimes', 'nullable', 'date'],
            'ends_at' => ['sometimes', 'nullable', 'date'],
            'payment_frequency' => ['sometimes', 'nullable', 'in:single,weekly,biweekly,monthly,annual'],
            'first_payment_date' => ['sometimes', 'nullable', 'date'],
            'payment_installments' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'commission_base' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'commission_type' => ['sometimes', 'nullable', 'in:none,percent,fixed'],
            'commission_value' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'commission_amount' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'subtotal' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'tax' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'total' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'notes' => ['sometimes', 'nullable', 'string'],
            'snapshot_json' => ['sometimes', 'nullable'],
        ];
    }

    protected function applyIndexQuery($query, Request $request)
    {
        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }

        if ($request->filled('customer_type')) {
            $query->where('customer_type', $request->get('customer_type'));
        }

        if ($request->filled('is_rotating')) {
            $query->where('is_rotating', filter_var($request->get('is_rotating'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('q')) {
            $term = $request->get('q');
            $query->where(function ($inner) use ($term) {
                $inner->where('notes', 'like', "%{$term}%")
                    ->orWhere('status', 'like', "%{$term}%")
                    ->orWhere('customer_type', 'like', "%{$term}%")
                    ->orWhere('id', 'like', "%{$term}%");
            });
        }

        return $query;
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'customer.type' => ['required', 'in:lead,cliente'],
            'customer.id' => ['required', 'integer', 'min:1'],
            'issuer_company_id' => ['required', 'integer', 'exists:companies,id'],
            'agency_id' => ['nullable', 'integer', 'exists:agencies,id'],
            'status' => ['nullable', 'in:draft,active'],
            'is_rotating' => ['nullable', 'boolean'],
            'starts_at' => ['required', 'date'],
            'includes_tax' => ['required', 'boolean'],
            'tax_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'notes' => ['nullable', 'string'],
            'payment.frequency' => ['required', 'in:single,weekly,biweekly,monthly,annual'],
            'payment.first_payment_date' => ['required', 'date'],
            'payment.renewals' => ['required', 'integer', 'min:1', 'max:120'],
            'commission.type' => ['nullable', 'in:none,percent,fixed'],
            'commission.value' => ['nullable', 'numeric', 'min:0'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.space_id' => ['required', 'integer', 'distinct', 'exists:spaces,id'],
            'items.*.concept' => ['required', 'string', 'max:255'],
            'items.*.qty' => ['required', 'integer', 'min:1'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Completa los datos operativos de la renta.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();
        $customerType = $data['customer']['type'];
        $customerId = (int) $data['customer']['id'];

        if ($customerType === 'lead' && !Lead::query()->whereKey($customerId)->exists()) {
            return response()->json(['message' => 'El prospecto seleccionado no existe.'], 422);
        }

        if ($customerType === 'cliente' && (!Schema::hasTable('clientes') || !DB::table('clientes')->where('id', $customerId)->exists())) {
            return response()->json(['message' => 'El cliente seleccionado no existe.'], 422);
        }

        $targetStatus = $data['status'] ?? 'draft';
        $frequency = $data['payment']['frequency'];
        $renewals = $frequency === 'single' ? 1 : (int) $data['payment']['renewals'];

        try {
            $endsAt = $this->paymentSchedule->endDate($data['starts_at'], $frequency, $renewals);
            $schedule = $this->paymentSchedule->buildForRenewals(
                $data['starts_at'],
                $data['payment']['first_payment_date'],
                $frequency,
                $renewals
            );
        } catch (\InvalidArgumentException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        $periods = collect($data['items'])->map(fn (array $item) => [
            'space_id' => $item['space_id'],
            'start_date' => $data['starts_at'],
            'end_date' => $endsAt,
        ])->all();
        $conflictingSpaceIds = $targetStatus === 'active'
            ? $this->spaceAvailability->conflictingSpaceIds($periods)
            : collect();

        if ($conflictingSpaceIds->isNotEmpty()) {
            return response()->json([
                'message' => 'Uno o más espacios ya están ocupados durante la vigencia seleccionada.',
                'errors' => ['items' => [
                    'Espacios no disponibles: ' . $conflictingSpaceIds->implode(', '),
                ]],
            ], 422);
        }

        $subtotal = round(collect($data['items'])->sum(
            fn (array $item) => (int) $item['qty'] * (float) $item['unit_price']
        ), 2);
        $tax = $data['includes_tax']
            ? round($subtotal * ((float) $data['tax_rate'] / 100), 2)
            : 0.0;
        $total = round($subtotal + $tax, 2);
        $agency = isset($data['agency_id']) ? Agency::query()->find($data['agency_id']) : null;
        $commission = $this->commissionCalculator->calculate($data['commission'] ?? [], $subtotal, $agency);
        $user = $request->attributes->get('auth_user');

        try {
            $rental = DB::transaction(function () use ($data, $customerType, $customerId, $subtotal, $tax, $total, $commission, $schedule, $user, $periods, $targetStatus, $endsAt, $frequency, $renewals) {
            if ($targetStatus === 'active') {
                $spaceIds = collect($periods)->pluck('space_id')->unique()->sort()->values();
                DB::table('spaces')->whereIn('id', $spaceIds)->lockForUpdate()->get();
                $conflicts = $this->spaceAvailability->conflictingSpaceIds($periods);
                if ($conflicts->isNotEmpty()) {
                    throw new \DomainException('Espacios no disponibles: ' . $conflicts->implode(', ') . '.');
                }
            }

            $rental = Rental::create([
                'quote_id' => null,
                'customer_type' => $customerType,
                'customer_id' => $customerId,
                'agency_id' => $data['agency_id'] ?? null,
                'issuer_company_id' => $data['issuer_company_id'],
                'created_by' => $user ? (int) $user->id : null,
                'status' => $data['status'] ?? 'draft',
                'is_rotating' => (bool) ($data['is_rotating'] ?? false),
                'starts_at' => $data['starts_at'],
                'ends_at' => $endsAt,
                'payment_frequency' => $frequency,
                'first_payment_date' => $data['payment']['first_payment_date'],
                'payment_installments' => count($schedule),
                ...$commission,
                'subtotal' => $subtotal,
                'tax' => $tax,
                'total' => $total,
                'notes' => $data['notes'] ?? null,
                'snapshot_json' => [
                    'origin' => 'manual',
                    'is_rotating' => (bool) ($data['is_rotating'] ?? false),
                    'customer' => ['type' => $customerType, 'id' => $customerId],
                    'payment' => ['frequency' => $frequency, 'renewals' => $renewals],
                    'commission' => $commission,
                    'items' => $data['items'],
                ],
            ]);

            foreach ($data['items'] as $item) {
                RentalItem::create([
                    'rental_id' => $rental->id,
                    'quote_item_id' => null,
                    'space_id' => (int) $item['space_id'],
                    'start_date' => $data['starts_at'],
                    'end_date' => $endsAt,
                    'unit_price' => (float) $item['unit_price'],
                    'qty' => (int) $item['qty'],
                    'subtotal' => round((int) $item['qty'] * (float) $item['unit_price'], 2),
                    'status' => 'active',
                ]);
            }

            if ($rental->status === 'active') {
                $this->paymentSchedule->createInvoices($rental, $schedule);
            }

                return $rental->load(['items.space', 'invoices']);
            });
        } catch (\DomainException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Renta creada con sus espacios y plan de pagos.',
            'data' => $rental,
        ], 201);
    }

    public function confirm($id)
    {
        try {
            $rental = DB::transaction(function () use ($id) {
                /** @var Rental $rental */
                $rental = Rental::query()->with(['items', 'invoices'])->lockForUpdate()->findOrFail($id);

                if ($rental->status === 'active') return $rental;
                if ($rental->status !== 'draft') {
                    throw new \DomainException('Solo una renta en borrador puede confirmarse.');
                }

                $periods = $rental->items->map(fn (RentalItem $item) => [
                    'space_id' => $item->space_id,
                    'start_date' => optional($item->start_date)->format('Y-m-d'),
                    'end_date' => optional($item->end_date)->format('Y-m-d'),
                ])->all();
                $spaceIds = collect($periods)->pluck('space_id')->unique()->sort()->values();
                DB::table('spaces')->whereIn('id', $spaceIds)->lockForUpdate()->get();
                $conflicts = $this->spaceAvailability->conflictingSpaceIds($periods, (int) $rental->id);

                if ($conflicts->isNotEmpty()) {
                    throw new \DomainException('Espacios no disponibles para la vigencia: ' . $conflicts->implode(', ') . '.');
                }

                $rental->status = 'active';
                $rental->save();
                $rental->items()->where('status', '!=', 'cancelled')->update(['status' => 'active']);

                if (!$rental->invoices()->exists()) {
                    try {
                        $schedule = $this->paymentSchedule->build(
                            optional($rental->starts_at)->format('Y-m-d'),
                            optional($rental->ends_at)->format('Y-m-d'),
                            optional($rental->first_payment_date)->format('Y-m-d'),
                            (string) $rental->payment_frequency
                        );
                    } catch (\Throwable $exception) {
                        throw new \DomainException('No fue posible generar el calendario de cobros: ' . $exception->getMessage());
                    }
                    $this->paymentSchedule->createInvoices($rental, $schedule);
                    $rental->payment_installments = count($schedule);
                    $rental->save();
                }

                $rental->invoices()->where('status', 'draft')->whereDate('due_date', '<', Carbon::today())->update(['status' => 'overdue']);
                $rental->invoices()->where('status', 'draft')->update(['status' => 'issued']);

                return $rental->fresh(['items.space', 'invoices']);
            });
        } catch (\DomainException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Renta confirmada; espacios y cobros activados.',
            'data' => $rental,
        ]);
    }

    public function update(Request $request, $id)
    {
        /** @var Rental $rental */
        $rental = Rental::query()->with(['items', 'invoices'])->findOrFail($id);
        $validator = Validator::make($request->all(), $this->rulesUpdate($request));

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation error', 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $targetStatus = $data['status'] ?? $rental->status;

        if ($rental->status === 'draft' && $targetStatus === 'active') {
            $rental->fill(collect($data)->except('status')->all())->save();
            if (isset($data['starts_at']) || isset($data['ends_at'])) {
                $rental->items()->update([
                    'start_date' => $data['starts_at'] ?? $rental->starts_at,
                    'end_date' => $data['ends_at'] ?? $rental->ends_at,
                ]);
            }
            return $this->confirm($id);
        }

        $allowedTransitions = [
            'draft' => ['draft', 'cancelled'],
            'active' => ['active', 'completed', 'cancelled'],
            'completed' => ['completed'],
            'cancelled' => ['cancelled'],
        ];
        if (!in_array($targetStatus, $allowedTransitions[$rental->status] ?? [], true)) {
            return response()->json(['message' => 'La transición de estatus de la renta no es válida.'], 422);
        }

        try {
            $rental = DB::transaction(function () use ($rental, $data, $targetStatus) {
            if ($rental->status === 'active' && $targetStatus === 'active' && (isset($data['starts_at']) || isset($data['ends_at']))) {
                $periods = $rental->items->map(fn (RentalItem $item) => [
                    'space_id' => $item->space_id,
                    'start_date' => $data['starts_at'] ?? optional($item->start_date)->format('Y-m-d'),
                    'end_date' => $data['ends_at'] ?? optional($item->end_date)->format('Y-m-d'),
                ])->all();
                $spaceIds = collect($periods)->pluck('space_id')->unique()->sort()->values();
                DB::table('spaces')->whereIn('id', $spaceIds)->lockForUpdate()->get();
                $conflicts = $this->spaceAvailability->conflictingSpaceIds($periods, (int) $rental->id);
                if ($conflicts->isNotEmpty()) {
                    throw new \DomainException('Espacios no disponibles: ' . $conflicts->implode(', ') . '.');
                }
            }

            $rental->update($data);

            if (isset($data['starts_at']) || isset($data['ends_at'])) {
                $rental->items()->update([
                    'start_date' => $data['starts_at'] ?? $rental->starts_at,
                    'end_date' => $data['ends_at'] ?? $rental->ends_at,
                ]);
            }

            if ($targetStatus === 'cancelled') {
                $rental->items()->where('status', '!=', 'ended')->update(['status' => 'cancelled']);
                $rental->invoices()->whereIn('status', ['draft', 'issued', 'overdue'])->update(['status' => 'cancelled']);
            } elseif ($targetStatus === 'completed') {
                $rental->items()->where('status', 'active')->update(['status' => 'ended']);
            }

            return $rental->fresh(['items.space', 'invoices']);
            });
        } catch (\DomainException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json(['message' => 'Actualizado correctamente', 'data' => $rental]);
    }

    public function index(Request $request)
    {
        $query = Rental::query()->with('invoices');
        $query = $this->applyIndexQuery($query, $request);
        $query = $this->indexOrder($query, $request);

        $perPage = (int) $request->get('perPage', $request->get('per_page', 10));
        $page = (int) $request->get('page', 1);
        $items = $query->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'data' => $items->items(),
            'meta' => [
                'page' => $items->currentPage(),
                'perPage' => $items->perPage(),
                'total' => $items->total(),
                'totalPages' => $items->lastPage(),
            ],
        ]);
    }

    public function find($id)
    {
        return response()->json([
            'data' => Rental::query()->with(['items', 'invoices'])->findOrFail($id),
        ]);
    }
}
