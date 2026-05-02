<?php

namespace App\Http\Controllers;

use App\Models\Entities\Agency;
use App\Models\Entities\Cliente;
use App\Models\Entities\Company;
use App\Models\Entities\CompanyLetterhead;
use App\Models\Entities\Lead;
use App\Models\Entities\Quote;
use App\Models\Entities\QuoteItem;
use App\Models\Entities\Rental;
use App\Models\Entities\RentalItem;
use App\Models\Entities\QuoteStatus;
use App\Models\Entities\QuoteStatusHistory;
use App\Models\Entities\ServiceCatalog;
use App\Models\Entities\Space;
use App\Services\QuoteCalculator;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;

class QuoteController extends Controller
{
    private QuoteCalculator $calculator;

    public function __construct()
    {
        $this->calculator = new QuoteCalculator();
    }

    public function catalogs()
    {
        return response()->json([
            'data' => [
                'companies' => Company::query()
                    ->where('is_active', true)
                    ->orderBy('name')
                    ->get(),
                'letterheads' => CompanyLetterhead::query()
                    ->where('is_active', true)
                    ->orderBy('company_id')
                    ->orderByDesc('is_default')
                    ->orderBy('name')
                    ->get(),
                'agencies' => Agency::query()
                    ->where('is_active', true)
                    ->orderBy('name')
                    ->get(),
                'services' => ServiceCatalog::query()
                    ->where('is_active', true)
                    ->orderBy('name')
                    ->get(),
                'statuses' => QuoteStatus::query()
                    ->where('is_active', true)
                    ->orderBy('id')
                    ->get(),
            ],
        ]);
    }

    public function searchCustomers(Request $request)
    {
        $type = $request->query('type', 'lead');
        $q = trim((string)$request->query('q', ''));

        if (!in_array($type, ['lead', 'cliente', 'sin_cliente'], true)) {
            return response()->json([
                'message' => 'Tipo de cliente inválido',
            ], 422);
        }

        if ($type === 'sin_cliente') {
            return response()->json(['data' => []]);
        }

        if ($type === 'lead') {
            $results = Lead::query()
                ->when($q !== '', function ($query) use ($q) {
                    $query->where(function ($inner) use ($q) {
                        $inner->where('nombre', 'like', "%{$q}%")
                            ->orWhere('apellido_paterno', 'like', "%{$q}%")
                            ->orWhere('apellido_materno', 'like', "%{$q}%")
                            ->orWhere('negocio', 'like', "%{$q}%")
                            ->orWhere('razon_social', 'like', "%{$q}%")
                            ->orWhere('email', 'like', "%{$q}%")
                            ->orWhere('telefono', 'like', "%{$q}%")
                            ->orWhere('rfc', 'like', "%{$q}%");
                    });
                })
                ->orderByDesc('id')
                ->limit(20)
                ->get()
                ->map(fn (Lead $lead) => $this->mapLeadCustomer($lead))
                ->values();

            return response()->json(['data' => $results]);
        }

        if (!Schema::hasTable('clientes')) {
            return response()->json(['data' => []]);
        }

        $rows = DB::table('clientes')
            ->when($q !== '', function ($query) use ($q) {
                $query->where(function ($inner) use ($q) {
                    $inner->where('nombre', 'like', "%{$q}%")
                        ->orWhere('apellido_paterno', 'like', "%{$q}%")
                        ->orWhere('apellido_materno', 'like', "%{$q}%")
                        ->orWhere('negocio', 'like', "%{$q}%")
                        ->orWhere('razon_social', 'like', "%{$q}%")
                        ->orWhere('email', 'like', "%{$q}%")
                        ->orWhere('telefono', 'like', "%{$q}%")
                        ->orWhere('curp', 'like', "%{$q}%")
                        ->orWhere('rfc', 'like', "%{$q}%");
                });
            })
            ->orderByDesc('id')
            ->limit(20)
            ->get()
            ->map(fn ($cliente) => $this->mapLegacyCustomer($cliente))
            ->values();

        return response()->json(['data' => $rows]);
    }

    public function index(Request $request)
    {
        $perPage = max(1, min(100, (int)$request->query('per_page', 15)));
        $status = $request->query('status');
        $q = trim((string)$request->query('q', ''));

        $query = Quote::query()
            ->with(['status', 'company', 'letterhead', 'agency', 'rental', 'acceptedByUser', 'convertedToRentalByUser'])
            ->orderByDesc('created_at')
            ->orderByDesc('id');

        if ($status) {
            $query->whereHas('status', function ($inner) use ($status) {
                if (is_numeric($status)) {
                    $inner->where('id', (int)$status);
                    return;
                }

                $inner->where('key', $status);
            });
        }

        foreach (['customer_type', 'customer_id', 'agency_id', 'issuer_company_id', 'folio'] as $filter) {
            $value = $request->query($filter);
            if ($value !== null && $value !== '') {
                $query->where($filter, $value);
            }
        }

        if ($request->query('date_from')) {
            $query->whereDate('created_at', '>=', $request->query('date_from'));
        }

        if ($request->query('date_to')) {
            $query->whereDate('created_at', '<=', $request->query('date_to'));
        }

        if ($q !== '') {
            $query->where(function ($inner) use ($q) {
                $inner->where('folio', 'like', "%{$q}%")
                    ->orWhere('notes', 'like', "%{$q}%");
            });
        }

        $page = $query->paginate($perPage);

        return response()->json([
            'data' => collect($page->items())->map(fn (Quote $quote) => $this->serializeQuote($quote, false)),
            'meta' => [
                'page' => $page->currentPage(),
                'perPage' => $page->perPage(),
                'total' => $page->total(),
                'totalPages' => $page->lastPage(),
            ],
        ]);
    }

    public function show($id)
    {
        $quote = Quote::query()
            ->with([
                'items.space',
                'items.service',
                'status',
                'company',
                'letterhead',
                'agency',
                'rental',
                'acceptedByUser',
                'convertedToRentalByUser',
            ])
            ->findOrFail($id);

        return response()->json([
            'data' => $this->serializeQuote($quote, true),
        ]);
    }

    public function history($id)
    {
        $quote = Quote::query()->findOrFail($id);

        $history = QuoteStatusHistory::query()
            ->with(['fromStatus', 'toStatus', 'changedByUser'])
            ->where('quote_id', $quote->id)
            ->orderByDesc('changed_at')
            ->orderByDesc('id')
            ->get()
            ->map(function (QuoteStatusHistory $entry) {
                return [
                    'id' => $entry->id,
                    'changed_at' => optional($entry->changed_at)->toDateTimeString(),
                    'reason' => $entry->reason,
                    'notes' => $entry->notes,
                    'from_status' => $entry->fromStatus ? [
                        'id' => $entry->fromStatus->id,
                        'key' => $entry->fromStatus->key,
                        'name' => $entry->fromStatus->name,
                    ] : null,
                    'to_status' => $entry->toStatus ? [
                        'id' => $entry->toStatus->id,
                        'key' => $entry->toStatus->key,
                        'name' => $entry->toStatus->name,
                    ] : null,
                    'changed_by' => $entry->changedByUser ? [
                        'id' => $entry->changedByUser->id,
                        'name' => $entry->changedByUser->name,
                        'username' => $entry->changedByUser->username,
                        'email' => $entry->changedByUser->email,
                    ] : null,
                    'meta' => $entry->meta,
                ];
            });

        return response()->json([
            'data' => $history,
        ]);
    }

    public function preview(Request $request)
    {
        [$validated, $company, $letterhead, $agency, $customerSummary] = $this->validateAndResolvePayload($request);
        $calculated = $this->calculator->calculate($validated, $agency, $company);

        return response()->json([
            'data' => [
                'customer' => $customerSummary,
                'company' => $company,
                'letterhead' => $letterhead,
                'agency' => $agency,
                'items' => $calculated['items'],
                'totals' => $calculated['totals'],
                'resolved' => $calculated['resolved'],
            ],
        ]);
    }

    public function store(Request $request)
    {
        [$validated, $company, $letterhead, $agency, $customerSummary] = $this->validateAndResolvePayload($request);
        $calculated = $this->calculator->calculate($validated, $agency, $company);
        $draftStatus = QuoteStatus::query()->where('key', 'draft')->first();

        if (!$draftStatus) {
            return response()->json([
                'message' => 'No existe el estatus draft en quote_status',
            ], 500);
        }

        $quote = DB::transaction(function () use ($validated, $company, $letterhead, $agency, $customerSummary, $calculated, $draftStatus, $request) {
            $quote = Quote::create([
                'lead_id' => $validated['customer']['type'] === 'lead' ? $validated['customer']['id'] : null,
                'customer_type' => $validated['customer']['type'],
                'customer_id' => $validated['customer']['id'] ?? null,
                'user_id' => $this->authUserId($request),
                'quote_status_id' => $draftStatus->id,
                'agency_id' => $agency?->id,
                'issuer_company_id' => $company->id,
                'letterhead_id' => $letterhead?->id,
                'folio' => null,
                'version' => 1,
                'currency' => 'MXN',
                'includes_tax' => $calculated['resolved']['includes_tax'],
                'tax_rate' => $calculated['resolved']['tax_rate'],
                'rentals_subtotal' => $calculated['totals']['rentals_subtotal'],
                'services_subtotal' => $calculated['totals']['services_subtotal'],
                'subtotal' => $calculated['totals']['subtotal'],
                'discount_base' => $calculated['totals']['discount_base'],
                'discount_type' => $calculated['totals']['discount_type'],
                'discount_value' => $calculated['totals']['discount_value'],
                'discount' => $calculated['totals']['discount_amount'],
                'commission_base' => $calculated['totals']['commission_base'],
                'commission_type' => $calculated['totals']['commission_type'],
                'commission_value' => $calculated['totals']['commission_value'],
                'commission_amount' => $calculated['totals']['commission_amount'],
                'tax' => $calculated['totals']['tax'],
                'total' => $calculated['totals']['total'],
                'valid_until' => $validated['valid_until'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'terms_html' => $calculated['resolved']['terms_html'],
                'pdf_path' => null,
                'pdf_generated_at' => null,
                'snapshot_json' => [],
            ]);

            $quote->folio = $this->buildFolio($quote->id);
            $quote->snapshot_json = $this->buildSnapshot($quote, $customerSummary, $company, $letterhead, $agency, $calculated);
            $quote->save();

            foreach ($calculated['items'] as $item) {
                QuoteItem::create([
                    'quote_id' => $quote->id,
                    'space_id' => $item['space_id'],
                    'service_id' => $item['service_id'],
                    'item_type' => $item['item_type'],
                    'concept' => $item['concept'],
                    'description' => $item['description'],
                    'start_date' => $item['start_date'],
                    'end_date' => $item['end_date'],
                    'unit_price' => $item['unit_price'],
                    'qty' => $item['qty'],
                    'subtotal' => $item['subtotal'],
                    'faces' => $item['faces'],
                    'production_cost' => $item['production_cost'],
                    'notes' => $item['notes'],
                    'sort_order' => $item['sort_order'],
                    'discount_applies' => $item['discount_applies'],
                    'tax_rate' => $item['tax_rate'],
                    'tax_amount' => $item['tax_amount'],
                    'total' => $item['total'],
                ]);
            }

            $this->recordHistory(
                quote: $quote,
                fromStatusId: null,
                toStatusId: $draftStatus->id,
                request: $request,
                reason: 'created',
                notes: 'Cotización creada',
                meta: [
                    'snapshot_version' => 1,
                    'totals' => $calculated['totals'],
                    'pdf_path' => null,
                ],
            );

            return $quote;
        });

        $quote->load(['items.space', 'items.service', 'status', 'company', 'letterhead', 'agency', 'rental', 'acceptedByUser', 'convertedToRentalByUser']);

        return response()->json([
            'message' => 'Cotización creada correctamente',
            'data' => $this->serializeQuote($quote, true),
        ], 201);
    }

    public function changeStatus(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'to_status' => ['required'],
            'reason' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $quote = Quote::query()->with(['status'])->findOrFail($id);
        $toStatus = QuoteStatus::query()
            ->when(
                is_numeric($request->input('to_status')),
                fn ($query) => $query->where('id', (int)$request->input('to_status')),
                fn ($query) => $query->where('key', $request->input('to_status'))
            )
            ->first();

        if (!$toStatus) {
            return response()->json([
                'message' => 'Estatus destino inválido',
            ], 422);
        }

        if ((int)$quote->quote_status_id === (int)$toStatus->id) {
            return response()->json([
                'message' => 'La cotización ya tiene ese estatus',
            ], 422);
        }

        if (!$this->canTransitionQuoteStatus($quote->status?->key, $toStatus->key)) {
            return response()->json([
                'message' => 'La transición de estatus no está permitida.',
            ], 422);
        }

        $fromStatusId = $quote->quote_status_id;
        $quote->quote_status_id = $toStatus->id;
        if ($toStatus->key === 'accepted' && !$quote->accepted_at) {
            $quote->accepted_at = Carbon::now();
            $quote->accepted_by = $this->authUserId($request);
        }
        $quote->save();

        $this->recordHistory(
            quote: $quote,
            fromStatusId: $fromStatusId,
            toStatusId: $toStatus->id,
            request: $request,
            reason: $request->input('reason'),
            notes: $request->input('notes'),
            meta: [
                'snapshot_version' => $quote->version,
                'totals' => [
                    'subtotal' => (float)$quote->subtotal,
                    'discount' => (float)$quote->discount,
                    'tax' => (float)$quote->tax,
                    'total' => (float)$quote->total,
                ],
                'pdf_path' => $quote->pdf_path,
            ],
        );

        $quote->load(['items.space', 'items.service', 'status', 'company', 'letterhead', 'agency', 'rental', 'acceptedByUser', 'convertedToRentalByUser']);

        return response()->json([
            'message' => 'Estatus actualizado correctamente',
            'data' => $this->serializeQuote($quote, true),
        ]);
    }

    public function convertToRental(Request $request, $id)
    {
        $quote = Quote::query()
            ->with(['items', 'status', 'company', 'agency', 'rental'])
            ->findOrFail($id);

        if (($quote->status?->key ?? null) !== 'accepted') {
            return response()->json([
                'message' => 'Solo las cotizaciones aceptadas pueden convertirse a renta.',
            ], 422);
        }

        if ($quote->converted_to_rental_at || $quote->rental) {
            return response()->json([
                'message' => 'La cotización ya fue convertida a renta.',
            ], 422);
        }

        $customerType = $quote->customer_type;
        $customerId = $quote->customer_id;
        $customerSummary = $quote->snapshot_json['customer'] ?? null;

        if (($quote->customer_type ?? null) === 'sin_cliente' || empty($quote->customer_id)) {
            $customerPayload = $request->input('customer', []);
            $customerType = $customerPayload['type'] ?? null;
            $customerId = $customerPayload['id'] ?? null;

            if (!in_array($customerType, ['lead', 'cliente'], true) || empty($customerId)) {
                return response()->json([
                    'message' => 'Debes asignar un cliente o prospecto antes de convertir a renta.',
                ], 422);
            }

            if ($customerType === 'lead' && !Lead::query()->whereKey($customerId)->exists()) {
                return response()->json([
                    'message' => 'El lead seleccionado no existe.',
                ], 422);
            }

            if ($customerType === 'cliente') {
                if (!Schema::hasTable('clientes') || !DB::table('clientes')->where('id', $customerId)->exists()) {
                    return response()->json([
                        'message' => 'El cliente seleccionado no existe.',
                    ], 422);
                }
            }

            $customerSummary = $this->resolveCustomerSummary($customerType, (int) $customerId);
        }

        $rentalItems = $quote->items
            ->where('item_type', 'rental')
            ->values();

        if ($rentalItems->isEmpty()) {
            return response()->json([
                'message' => 'La cotización no contiene rentas para convertir.',
            ], 422);
        }

        $userId = $this->authUserId($request);

        $rental = DB::transaction(function () use ($quote, $rentalItems, $userId, $request, $customerType, $customerId, $customerSummary) {
            $startsAt = $rentalItems->min(fn (QuoteItem $item) => optional($item->start_date)->format('Y-m-d'));
            $endsAt = $rentalItems->max(fn (QuoteItem $item) => optional($item->end_date)->format('Y-m-d'));
            $subtotal = round((float) $rentalItems->sum(fn (QuoteItem $item) => (float) $item->subtotal), 2);
            $tax = round((float) $rentalItems->sum(fn (QuoteItem $item) => (float) $item->tax_amount), 2);
            $total = round((float) $rentalItems->sum(fn (QuoteItem $item) => (float) $item->total), 2);

            if (($quote->customer_type ?? null) === 'sin_cliente' || empty($quote->customer_id)) {
                $snapshot = is_array($quote->snapshot_json) ? $quote->snapshot_json : [];
                $snapshot['customer'] = $customerSummary;

                $quote->customer_type = $customerType;
                $quote->customer_id = (int) $customerId;
                $quote->lead_id = $customerType === 'lead' ? (int) $customerId : null;
                $quote->snapshot_json = $snapshot;
                $quote->save();
            }

            $rental = Rental::create([
                'quote_id' => $quote->id,
                'customer_type' => $quote->customer_type,
                'customer_id' => $quote->customer_id,
                'agency_id' => $quote->agency_id,
                'issuer_company_id' => $quote->issuer_company_id,
                'created_by' => $userId,
                'status' => 'draft',
                'starts_at' => $startsAt,
                'ends_at' => $endsAt,
                'subtotal' => $subtotal,
                'tax' => $tax,
                'total' => $total,
                'notes' => $quote->notes,
                'snapshot_json' => [
                    'quote' => [
                        'id' => $quote->id,
                        'folio' => $quote->folio,
                        'version' => $quote->version,
                        'accepted_at' => optional($quote->accepted_at)->toDateTimeString(),
                    ],
                    'customer' => $quote->snapshot_json['customer'] ?? null,
                    'company' => $quote->snapshot_json['company'] ?? null,
                    'agency' => $quote->snapshot_json['agency'] ?? null,
                    'items' => $rentalItems->map(function (QuoteItem $item) {
                        return [
                            'quote_item_id' => $item->id,
                            'space_id' => $item->space_id,
                            'concept' => $item->concept,
                            'start_date' => optional($item->start_date)->format('Y-m-d'),
                            'end_date' => optional($item->end_date)->format('Y-m-d'),
                            'qty' => (int) $item->qty,
                            'unit_price' => (float) $item->unit_price,
                            'subtotal' => (float) $item->subtotal,
                            'tax_amount' => (float) $item->tax_amount,
                            'total' => (float) $item->total,
                            'notes' => $item->notes,
                        ];
                    })->values()->all(),
                ],
            ]);

            foreach ($rentalItems as $item) {
                RentalItem::create([
                    'rental_id' => $rental->id,
                    'quote_item_id' => $item->id,
                    'space_id' => $item->space_id,
                    'start_date' => optional($item->start_date)->format('Y-m-d'),
                    'end_date' => optional($item->end_date)->format('Y-m-d'),
                    'unit_price' => $item->unit_price,
                    'qty' => $item->qty,
                    'subtotal' => $item->subtotal,
                    'status' => 'active',
                ]);
            }

            $quote->converted_to_rental_at = Carbon::now();
            $quote->converted_to_rental_by = $userId;
            $quote->save();

            $this->recordHistory(
                quote: $quote,
                fromStatusId: $quote->quote_status_id,
                toStatusId: $quote->quote_status_id,
                request: $request,
                reason: 'converted_to_rental',
                notes: "Renta #{$rental->id} creada desde cotización aceptada.",
                meta: [
                    'event' => 'converted_to_rental',
                    'rental_id' => $rental->id,
                    'quote_folio' => $quote->folio,
                ],
            );

            return $rental;
        });

        $quote->load(['items.space', 'items.service', 'status', 'company', 'letterhead', 'agency', 'rental', 'acceptedByUser', 'convertedToRentalByUser']);

        return response()->json([
            'message' => "Cotización convertida a renta #{$rental->id}.",
            'data' => $this->serializeQuote($quote, true),
        ]);
    }

    private function validateAndResolvePayload(Request $request): array
    {
        $validator = Validator::make($request->all(), [
            'customer.type' => ['required', 'in:lead,cliente,sin_cliente'],
            'customer.id' => ['nullable', 'integer', 'min:1'],
            'issuer_company_id' => ['required', 'integer', 'exists:companies,id'],
            'letterhead_id' => ['nullable', 'integer', 'exists:company_letterheads,id'],
            'agency_id' => ['nullable', 'integer', 'exists:agencies,id'],
            'valid_until' => ['nullable', 'date'],
            'includes_tax' => ['nullable', 'boolean'],
            'tax_rate' => ['nullable', 'numeric', 'min:0'],
            'discount.type' => ['nullable', 'in:none,percent,fixed'],
            'discount.value' => ['nullable', 'numeric', 'min:0'],
            'commission.type' => ['nullable', 'in:none,percent,fixed'],
            'commission.value' => ['nullable', 'numeric', 'min:0'],
            'terms_html' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.item_type' => ['required', 'in:rental,service'],
            'items.*.space_id' => ['nullable', 'integer', 'exists:spaces,id'],
            'items.*.service_id' => ['nullable', 'integer', 'exists:services,id'],
            'items.*.concept' => ['nullable', 'string', 'max:255'],
            'items.*.description' => ['nullable', 'string'],
            'items.*.start_date' => ['nullable', 'date'],
            'items.*.end_date' => ['nullable', 'date'],
            'items.*.qty' => ['nullable', 'integer', 'min:1'],
            'items.*.unit_price' => ['nullable', 'numeric', 'min:0'],
            'items.*.faces' => ['nullable', 'integer', 'min:1'],
            'items.*.production_cost' => ['nullable', 'numeric', 'min:0'],
            'items.*.notes' => ['nullable', 'string', 'max:255'],
            'items.*.sort_order' => ['nullable', 'integer', 'min:0'],
            'items.*.discount_applies' => ['nullable', 'boolean'],
            'items.*.tax_rate' => ['nullable', 'numeric', 'min:0'],
        ]);

        $validator->after(function ($validator) use ($request) {
            $customer = $request->input('customer', []);
            $customerType = $customer['type'] ?? null;
            $customerId = $customer['id'] ?? null;

            if ($customerType !== 'sin_cliente' && empty($customerId)) {
                $validator->errors()->add('customer.id', 'Debes seleccionar un cliente o prospecto.');
            }

            if ($customerType === 'lead' && !empty($customerId) && !Lead::query()->whereKey($customerId)->exists()) {
                $validator->errors()->add('customer.id', 'El lead seleccionado no existe.');
            }

            if ($customerType === 'cliente' && !empty($customerId) && Schema::hasTable('clientes')) {
                $exists = DB::table('clientes')->where('id', $customerId)->exists();
                if (!$exists) {
                    $validator->errors()->add('customer.id', 'El cliente seleccionado no existe.');
                }
            }

            foreach ((array)$request->input('items', []) as $index => $item) {
                $type = $item['item_type'] ?? null;
                if ($type === 'rental') {
                    if (empty($item['space_id'])) {
                        $validator->errors()->add("items.{$index}.space_id", 'El espacio es obligatorio para rentas.');
                    }
                    if (empty($item['start_date'])) {
                        $validator->errors()->add("items.{$index}.start_date", 'La fecha inicial es obligatoria para rentas.');
                    }
                    if (empty($item['end_date'])) {
                        $validator->errors()->add("items.{$index}.end_date", 'La fecha final es obligatoria para rentas.');
                    }
                }

                if ($type === 'service' && empty($item['service_id']) && empty($item['concept'])) {
                    $validator->errors()->add("items.{$index}.concept", 'El concepto es obligatorio para servicios libres.');
                }

                if (!empty($item['start_date']) && !empty($item['end_date']) && $item['end_date'] < $item['start_date']) {
                    $validator->errors()->add("items.{$index}.end_date", 'La fecha final no puede ser menor a la inicial.');
                }
            }
        });

        if ($validator->fails()) {
            throw new HttpResponseException(response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422));
        }

        $validated = $validator->validated();

        $company = Company::query()->findOrFail($validated['issuer_company_id']);
        $letterhead = isset($validated['letterhead_id'])
            ? CompanyLetterhead::query()->findOrFail($validated['letterhead_id'])
            : CompanyLetterhead::query()->where('company_id', $company->id)->where('is_default', true)->first();
        $agency = isset($validated['agency_id'])
            ? Agency::query()->findOrFail($validated['agency_id'])
            : null;

        if ($letterhead && (int)$letterhead->company_id !== (int)$company->id) {
            throw new HttpResponseException(response()->json([
                'message' => 'La hoja membretada no pertenece a la empresa seleccionada',
            ], 422));
        }

        $validated['items'] = $this->normalizeItems($validated['items'] ?? []);
        $customerSummary = $this->resolveCustomerSummary(
            $validated['customer']['type'],
            isset($validated['customer']['id']) ? (int)$validated['customer']['id'] : null
        );

        return [$validated, $company, $letterhead, $agency, $customerSummary];
    }

    private function normalizeItems(array $items): array
    {
        $spaceIds = collect($items)
            ->pluck('space_id')
            ->filter()
            ->map(fn ($id) => (int)$id)
            ->unique()
            ->values();

        $serviceIds = collect($items)
            ->pluck('service_id')
            ->filter()
            ->map(fn ($id) => (int)$id)
            ->unique()
            ->values();

        $spaces = Space::query()
            ->whereIn('id', $spaceIds)
            ->get()
            ->keyBy('id');

        $services = ServiceCatalog::query()
            ->whereIn('id', $serviceIds)
            ->get()
            ->keyBy('id');

        return collect($items)->values()->map(function (array $item, int $index) use ($spaces, $services) {
            $type = $item['item_type'];
            $space = !empty($item['space_id']) ? $spaces->get((int)$item['space_id']) : null;
            $service = !empty($item['service_id']) ? $services->get((int)$item['service_id']) : null;

            return [
                'item_type' => $type,
                'space_id' => $space?->id,
                'service_id' => $service?->id,
                'concept' => trim((string)($item['concept'] ?? ($space?->title ?? $service?->name ?? ''))),
                'description' => $item['description'] ?? ($service?->description ?? null),
                'start_date' => $type === 'rental' ? ($item['start_date'] ?? null) : null,
                'end_date' => $type === 'rental' ? ($item['end_date'] ?? null) : null,
                'qty' => (int)($item['qty'] ?? 1),
                'unit_price' => $item['unit_price'] ?? ($service?->base_price ?? $space?->price ?? 0),
                'faces' => $item['faces'] ?? ($space?->faces ?? null),
                'production_cost' => $item['production_cost'] ?? null,
                'notes' => $item['notes'] ?? null,
                'sort_order' => $item['sort_order'] ?? $index,
                'discount_applies' => array_key_exists('discount_applies', $item)
                    ? $item['discount_applies']
                    : $type === 'rental',
                'tax_rate' => $item['tax_rate'] ?? ($service?->tax_rate ?? 16),
            ];
        })->all();
    }

    private function resolveCustomerSummary(string $type, ?int $id): array
    {
        if ($type === 'sin_cliente') {
            return [
                'type' => 'sin_cliente',
                'id' => null,
                'display_name' => 'Sin cliente',
                'contact_name' => null,
                'email' => null,
                'phone' => null,
                'rfc' => null,
            ];
        }

        if ($type === 'lead') {
            $lead = Lead::query()->find($id);
            if ($lead) {
                return $this->mapLeadCustomer($lead);
            }
        }

        if ($type === 'cliente' && Schema::hasTable('clientes')) {
            $cliente = Cliente::query()->find($id);
            if ($cliente) {
                return $this->mapLegacyCustomer($cliente);
            }
        }

        return [
            'type' => $type,
            'id' => $id,
            'display_name' => $id ? "{$type} #{$id}" : 'Sin cliente',
            'contact_name' => null,
            'email' => null,
            'phone' => null,
            'rfc' => null,
        ];
    }

    private function mapLeadCustomer(Lead $lead): array
    {
        $contact = trim(implode(' ', array_filter([
            $lead->nombre,
            $lead->apellido_paterno,
            $lead->apellido_materno,
        ])));

        return [
            'type' => 'lead',
            'id' => $lead->id,
            'display_name' => $lead->negocio ?: $lead->razon_social ?: $contact,
            'contact_name' => $contact ?: null,
            'email' => $lead->email,
            'phone' => $lead->telefono,
            'rfc' => $lead->rfc,
        ];
    }

    private function mapLegacyCustomer($cliente): array
    {
        $contact = trim(implode(' ', array_filter([
            $cliente->nombre ?? null,
            $cliente->apellido_paterno ?? null,
            $cliente->apellido_materno ?? null,
        ])));

        return [
            'type' => 'cliente',
            'id' => $cliente->id,
            'display_name' => $cliente->negocio ?: ($cliente->razon_social ?: $contact),
            'contact_name' => $contact ?: null,
            'email' => $cliente->email ?? null,
            'phone' => $cliente->telefono ?? null,
            'rfc' => $cliente->rfc ?? null,
        ];
    }

    private function serializeQuote(Quote $quote, bool $withItems): array
    {
        $snapshot = is_array($quote->snapshot_json) ? $quote->snapshot_json : [];
        $customerType = $quote->customer_type ?: ($quote->lead_id ? 'lead' : null);
        $customerId = $quote->customer_id ?: $quote->lead_id;
        $resolvedCustomer = ($customerType && ($customerId || $customerType === 'sin_cliente'))
            ? $this->resolveCustomerSummary($customerType, $customerId ? (int)$customerId : null)
            : null;

        return [
            'id' => $quote->id,
            'folio' => $quote->folio,
            'version' => $quote->version,
            'customer_type' => $customerType,
            'customer_id' => $customerId,
            'customer' => $snapshot['customer'] ?? $resolvedCustomer,
            'status' => $quote->status ? [
                'id' => $quote->status->id,
                'key' => $quote->status->key,
                'name' => $quote->status->name,
                'color' => $quote->status->color,
            ] : null,
            'company' => $quote->company ? [
                'id' => $quote->company->id,
                'name' => $quote->company->name,
                'legal_name' => $quote->company->legal_name,
                'rfc' => $quote->company->rfc,
            ] : ($snapshot['company'] ?? null),
            'letterhead' => $quote->letterhead ? [
                'id' => $quote->letterhead->id,
                'name' => $quote->letterhead->name,
                'template_key' => $quote->letterhead->template_key,
            ] : ($snapshot['letterhead'] ?? null),
            'agency' => $quote->agency ? [
                'id' => $quote->agency->id,
                'name' => $quote->agency->name,
                'discount_type' => $quote->agency->discount_type,
                'discount_value' => (float)$quote->agency->discount_value,
                'commission_type' => $quote->agency->commission_type,
                'commission_value' => (float)$quote->agency->commission_value,
            ] : ($snapshot['agency'] ?? null),
            'includes_tax' => (bool)$quote->includes_tax,
            'tax_rate' => (float)$quote->tax_rate,
            'totals' => [
                'rentals_subtotal' => (float)$quote->rentals_subtotal,
                'services_subtotal' => (float)$quote->services_subtotal,
                'subtotal' => (float)$quote->subtotal,
                'discount_base' => (float)$quote->discount_base,
                'discount_type' => $quote->discount_type,
                'discount_value' => (float)$quote->discount_value,
                'discount_amount' => (float)$quote->discount,
                'commission_base' => (float)$quote->commission_base,
                'commission_type' => $quote->commission_type,
                'commission_value' => (float)$quote->commission_value,
                'commission_amount' => (float)$quote->commission_amount,
                'tax' => (float)$quote->tax,
                'total' => (float)$quote->total,
            ],
            'accepted_at' => optional($quote->accepted_at)->toDateTimeString(),
            'accepted_by' => $quote->acceptedByUser ? [
                'id' => $quote->acceptedByUser->id,
                'name' => $quote->acceptedByUser->name,
                'username' => $quote->acceptedByUser->username,
                'email' => $quote->acceptedByUser->email,
            ] : null,
            'converted_to_rental_at' => optional($quote->converted_to_rental_at)->toDateTimeString(),
            'converted_to_rental_by' => $quote->convertedToRentalByUser ? [
                'id' => $quote->convertedToRentalByUser->id,
                'name' => $quote->convertedToRentalByUser->name,
                'username' => $quote->convertedToRentalByUser->username,
                'email' => $quote->convertedToRentalByUser->email,
            ] : null,
            'rental' => $quote->rental ? [
                'id' => $quote->rental->id,
                'status' => $quote->rental->status,
                'starts_at' => optional($quote->rental->starts_at)->format('Y-m-d'),
                'ends_at' => optional($quote->rental->ends_at)->format('Y-m-d'),
                'total' => (float) $quote->rental->total,
            ] : null,
            'valid_until' => optional($quote->valid_until)->format('Y-m-d'),
            'notes' => $quote->notes,
            'terms_html' => $quote->terms_html,
            'pdf_path' => $quote->pdf_path,
            'pdf_generated_at' => optional($quote->pdf_generated_at)->toDateTimeString(),
            'created_at' => optional($quote->created_at)->toDateTimeString(),
            'updated_at' => optional($quote->updated_at)->toDateTimeString(),
            'items' => $withItems
                ? $quote->items->map(function (QuoteItem $item) {
                    return [
                        'id' => $item->id,
                        'item_type' => $item->item_type,
                        'space_id' => $item->space_id,
                        'service_id' => $item->service_id,
                        'concept' => $item->concept,
                        'description' => $item->description,
                        'start_date' => optional($item->start_date)->format('Y-m-d'),
                        'end_date' => optional($item->end_date)->format('Y-m-d'),
                        'qty' => (int)$item->qty,
                        'unit_price' => (float)$item->unit_price,
                        'subtotal' => (float)$item->subtotal,
                        'discount_applies' => (bool)$item->discount_applies,
                        'tax_rate' => (float)$item->tax_rate,
                        'tax_amount' => (float)$item->tax_amount,
                        'total' => (float)$item->total,
                        'faces' => $item->faces,
                        'notes' => $item->notes,
                    ];
                })->values()
                : [],
        ];
    }

    private function buildSnapshot(
        Quote $quote,
        array $customerSummary,
        Company $company,
        ?CompanyLetterhead $letterhead,
        ?Agency $agency,
        array $calculated
    ): array {
        return [
            'snapshot_version' => $quote->version,
            'customer' => $customerSummary,
            'company' => [
                'id' => $company->id,
                'name' => $company->name,
                'legal_name' => $company->legal_name,
                'rfc' => $company->rfc,
                'default_terms_html' => $company->default_terms_html,
            ],
            'letterhead' => $letterhead ? [
                'id' => $letterhead->id,
                'name' => $letterhead->name,
                'template_key' => $letterhead->template_key,
                'primary_color' => $letterhead->primary_color,
                'secondary_color' => $letterhead->secondary_color,
            ] : null,
            'agency' => $agency ? [
                'id' => $agency->id,
                'name' => $agency->name,
                'discount_type' => $agency->discount_type,
                'discount_value' => (float)$agency->discount_value,
                'commission_type' => $agency->commission_type,
                'commission_value' => (float)$agency->commission_value,
            ] : null,
            'terms_html' => $quote->terms_html,
            'totals' => $calculated['totals'],
            'items' => $calculated['items'],
            'pdf_path' => $quote->pdf_path,
        ];
    }

    private function buildFolio(int $id): string
    {
        return sprintf('COT-%s-%05d', date('Y'), $id);
    }

    private function canTransitionQuoteStatus(?string $fromStatusKey, ?string $toStatusKey): bool
    {
        if (!$fromStatusKey || !$toStatusKey || $fromStatusKey === $toStatusKey) {
            return false;
        }

        $transitions = [
            'draft' => ['sent', 'cancelled'],
            'sent' => ['draft', 'accepted', 'rejected', 'expired', 'cancelled'],
            'expired' => ['sent', 'cancelled'],
            'accepted' => [],
            'rejected' => [],
            'cancelled' => [],
        ];

        return in_array($toStatusKey, $transitions[$fromStatusKey] ?? [], true);
    }

    private function recordHistory(
        Quote $quote,
        ?int $fromStatusId,
        int $toStatusId,
        Request $request,
        ?string $reason,
        ?string $notes,
        array $meta
    ): void {
        QuoteStatusHistory::create([
            'quote_id' => $quote->id,
            'from_status_id' => $fromStatusId,
            'to_status_id' => $toStatusId,
            'changed_by' => $this->authUserId($request),
            'reason' => $reason,
            'notes' => $notes,
            'changed_at' => Carbon::now(),
            'meta' => $meta,
        ]);
    }

    private function authUserId(Request $request): ?int
    {
        $user = $request->attributes->get('auth_user');
        return $user ? (int)$user->id : null;
    }
}
