<?php

namespace App\Http\Controllers;

use App\Models\Entities\Agency;
use App\Models\Entities\Configuration;
use App\Models\Entities\Cliente;
use App\Models\Entities\Company;
use App\Models\Entities\CompanyLetterhead;
use App\Models\Entities\Lead;
use App\Models\Entities\Quote;
use App\Models\Entities\QuoteImage;
use App\Models\Entities\QuoteItem;
use App\Models\Entities\Rental;
use App\Models\Entities\RentalItem;
use App\Models\Entities\QuoteStatus;
use App\Models\Entities\QuoteStatusHistory;
use App\Models\Entities\ServiceCatalog;
use App\Models\Entities\Space;
use App\Services\QuoteCalculator;
use App\Services\RentalCommissionCalculator;
use App\Services\RentalPaymentSchedule;
use App\Services\SpaceAvailability;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class QuoteController extends Controller
{
    private QuoteCalculator $calculator;
    private RentalPaymentSchedule $paymentSchedule;
    private RentalCommissionCalculator $commissionCalculator;
    private SpaceAvailability $spaceAvailability;

    public function __construct()
    {
        $this->calculator = new QuoteCalculator();
        $this->paymentSchedule = new RentalPaymentSchedule();
        $this->commissionCalculator = new RentalCommissionCalculator();
        $this->spaceAvailability = new SpaceAvailability();
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
                'configuration' => $this->quoteConfiguration(),
                'statuses' => QuoteStatus::query()
                    ->where('is_active', true)
                    ->orderBy('id')
                    ->get(),
                'quoted_customers' => $this->quotedCustomers(),
            ],
        ]);
    }

    /**
     * Clientes que ya tienen al menos una cotización, para el filtro del listado.
     * El nombre sale del snapshot de su cotización más reciente (el mismo que muestra la tabla).
     */
    private function quotedCustomers(): array
    {
        $latestIds = Quote::query()
            ->whereNotNull('customer_type')
            ->where('customer_type', '<>', 'sin_cliente')
            ->whereNotNull('customer_id')
            ->groupBy('customer_type', 'customer_id')
            ->selectRaw('MAX(id) as id')
            ->pluck('id');

        return Quote::query()
            ->whereIn('id', $latestIds)
            ->get(['id', 'customer_type', 'customer_id', 'snapshot_json'])
            ->map(function (Quote $quote) {
                $snapshot = is_array($quote->snapshot_json)
                    ? $quote->snapshot_json
                    : (json_decode((string) $quote->snapshot_json, true) ?: []);
                $name = trim((string) ($snapshot['customer']['display_name'] ?? ''));

                return [
                    'type' => $quote->customer_type,
                    'id' => (int) $quote->customer_id,
                    'name' => $name !== '' ? $name : ucfirst((string) $quote->customer_type) . ' #' . $quote->customer_id,
                ];
            })
            ->sortBy('name', SORT_NATURAL | SORT_FLAG_CASE)
            ->values()
            ->all();
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

        // El folio se arma con el id, así que ordenar por id es ordenar por folio.
        $direction = $request->query('direction') === 'asc' ? 'asc' : 'desc';
        $query = Quote::query()
            ->with(['status', 'company', 'letterhead', 'agency', 'rental', 'acceptedByUser', 'convertedToRentalByUser'])
            ->orderBy('id', $direction);

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
                'images',
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

    /**
     * Elimina una cotización en Borrador: nunca se envió al cliente ni tiene renta.
     * Las demás solo cambian de estatus para conservar su historial.
     */
    public function destroy($id)
    {
        $quote = Quote::query()->with(['status', 'images'])->findOrFail($id);

        if ($quote->status?->key !== 'draft') {
            return response()->json(['message' => 'Solo se pueden eliminar cotizaciones en Borrador.'], 422);
        }

        if ($quote->converted_to_rental_at || $quote->rental()->exists()) {
            return response()->json(['message' => 'La cotización tiene una renta ligada y no se puede eliminar.'], 422);
        }

        $paths = $quote->images->map(fn (QuoteImage $image) => [$image->disk ?: 'public', $image->path])->all();

        DB::transaction(function () use ($quote) {
            // Una cotización duplicada a partir de esta conserva su folio; solo pierde la referencia.
            Quote::query()->where('duplicated_from_quote_id', $quote->id)->update(['duplicated_from_quote_id' => null]);
            // Partidas, imágenes e historial se borran en cascada.
            $quote->delete();
        });

        foreach ($paths as [$disk, $path]) {
            if ($path) {
                Storage::disk($disk)->delete($path);
            }
        }

        return response()->json(['message' => "Cotización {$quote->folio} eliminada."]);
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
                    'changed_at' => optional($entry->changed_at)->toIso8601String(),
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
                'quote_kind' => $validated['quote_kind'],
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

        $sourceQuote = null;
        if (!empty($validated['duplicate_of_quote_id'])) {
            $sourceQuote = Quote::query()->with(['status', 'rental'])->findOrFail($validated['duplicate_of_quote_id']);
        }
        // Una cotización convertida se puede copiar (p. ej. para revender el espacio),
        // pero no se cancela: su renta sigue vigente.
        $sourceIsConverted = $sourceQuote && ($sourceQuote->converted_to_rental_at || $sourceQuote->rental);

        $cancelledStatus = QuoteStatus::query()->where('key', 'cancelled')->first();

        $quote = DB::transaction(function () use ($validated, $company, $letterhead, $agency, $customerSummary, $calculated, $draftStatus, $request, $sourceQuote, $cancelledStatus, $sourceIsConverted) {
            $duplicateColumn = $sourceQuote && $this->hasColumn('quotes', 'duplicated_from_quote_id')
                ? ['duplicated_from_quote_id' => $sourceQuote->id]
                : [];

            $quote = Quote::create($duplicateColumn + [
                'quote_kind' => $validated['quote_kind'],
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
            ] + $this->calculatedQuoteAttributes($validated, $calculated) + [
                'pdf_path' => null,
                'pdf_generated_at' => null,
                'snapshot_json' => [],
            ]);

            $quote->folio = $this->buildFolio($quote->id);
            $quote->snapshot_json = $this->buildSnapshot($quote, $customerSummary, $company, $letterhead, $agency, $calculated);
            $quote->save();

            $this->createQuoteItems($quote, $calculated['items']);

            $this->storeQuoteImages($quote, $request);

            $this->recordHistory(
                quote: $quote,
                fromStatusId: null,
                toStatusId: $draftStatus->id,
                request: $request,
                reason: $sourceQuote ? 'duplicated' : 'created',
                notes: $sourceQuote
                    ? "Cotización creada como duplicado de {$sourceQuote->folio}"
                    : 'Cotización creada',
                meta: [
                    'snapshot_version' => 1,
                    'totals' => $calculated['totals'],
                    'pdf_path' => null,
                    'duplicated_from' => $sourceQuote ? [
                        'id' => $sourceQuote->id,
                        'folio' => $sourceQuote->folio,
                    ] : null,
                ],
            );

            if ($sourceQuote && !$sourceIsConverted) {
                $this->cancelReplacedQuote($sourceQuote, $quote, $cancelledStatus, $request);
            }

            return $quote;
        });

        $quote->load(['items.space', 'items.service', 'images', 'status', 'company', 'letterhead', 'agency', 'rental', 'acceptedByUser', 'convertedToRentalByUser']);

        return response()->json([
            'message' => 'Cotización creada correctamente',
            'data' => $this->serializeQuote($quote, true),
        ], 201);
    }

    /**
     * Edita una cotización sin generar folio nuevo. Solo en Borrador o Enviada
     * y mientras no se haya convertido a renta; recalcula totales, reemplaza
     * las partidas y deja registro en el historial.
     */
    public function update(Request $request, $id)
    {
        $quote = Quote::query()->with(['status', 'rental', 'items'])->findOrFail($id);
        $statusKey = $quote->status?->key;

        if ($quote->converted_to_rental_at || $quote->rental) {
            return response()->json(['message' => 'No se puede editar una cotización que ya fue convertida a renta.'], 422);
        }
        if (!in_array($statusKey, ['draft', 'sent'], true)) {
            return response()->json([
                'message' => 'Solo se pueden editar cotizaciones en Borrador o Enviada. Para cambiar una aceptada, rechazada o cancelada, duplícala.',
            ], 422);
        }

        $request->request->remove('duplicate_of_quote_id');
        [$validated, $company, $letterhead, $agency, $customerSummary] = $this->validateAndResolvePayload($request);
        $calculated = $this->calculator->calculate($validated, $agency, $company);
        $previousTotals = ['total' => (float) $quote->total, 'items' => $quote->items->count()];

        DB::transaction(function () use ($quote, $validated, $company, $letterhead, $agency, $customerSummary, $calculated, $request, $previousTotals) {
            $quote->fill([
                'quote_kind' => $validated['quote_kind'],
                'lead_id' => $validated['customer']['type'] === 'lead' ? $validated['customer']['id'] : null,
                'customer_type' => $validated['customer']['type'],
                'customer_id' => $validated['customer']['id'] ?? null,
                'agency_id' => $agency?->id,
                'issuer_company_id' => $company->id,
                'letterhead_id' => $letterhead?->id,
                'version' => ((int) $quote->version) + 1,
                'pdf_path' => null,
                'pdf_generated_at' => null,
            ] + $this->calculatedQuoteAttributes($validated, $calculated));
            $quote->snapshot_json = $this->buildSnapshot($quote, $customerSummary, $company, $letterhead, $agency, $calculated);
            $quote->save();

            $quote->items()->delete();
            $this->createQuoteItems($quote, $calculated['items']);
            $this->storeQuoteImages($quote, $request);

            $this->recordHistory(
                quote: $quote,
                fromStatusId: $quote->quote_status_id,
                toStatusId: $quote->quote_status_id,
                request: $request,
                reason: 'edited',
                notes: "Cotización editada (versión {$quote->version})",
                meta: [
                    'snapshot_version' => $quote->version,
                    'previous' => $previousTotals,
                    'totals' => $calculated['totals'],
                ],
            );
        });

        $quote->refresh()->load(['items.space', 'items.service', 'images', 'status', 'company', 'letterhead', 'agency', 'rental', 'acceptedByUser', 'convertedToRentalByUser']);

        return response()->json([
            'message' => "Cotización {$quote->folio} actualizada correctamente",
            'data' => $this->serializeQuote($quote, true),
        ]);
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

        if (($quote->status?->key === 'accepted') && ($quote->converted_to_rental_at || $quote->rental()->exists())) {
            return response()->json([
                'message' => 'La cotización ya fue convertida a renta; cancela o ajusta la renta directamente.',
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

        $planValidator = Validator::make($request->all(), [
            'rental.starts_at' => ['required', 'date'],
            'rental.is_rotating' => ['nullable', 'boolean'],
            'payment.frequency' => ['required', 'in:single,weekly,biweekly,monthly,annual'],
            'payment.first_payment_date' => ['required', 'date'],
            'payment.renewals' => ['required', 'integer', 'min:1', 'max:120'],
            // Importe sin IVA de cada pago; si no viene se calcula
            // (renta por periodo en cada pago + servicios en el primero).
            'payment.installment_amounts' => ['nullable', 'array', 'max:120'],
            'payment.installment_amounts.*' => ['required', 'numeric', 'min:0'],
            'commission.type' => ['nullable', 'in:none,percent,fixed'],
            'commission.value' => ['nullable', 'numeric', 'min:0'],
        ]);

        if ($planValidator->fails()) {
            return response()->json([
                'message' => 'Define la vigencia y el plan de pagos de la renta.',
                'errors' => $planValidator->errors(),
            ], 422);
        }

        $planPayload = $planValidator->validated();
        $startsAt = $planPayload['rental']['starts_at'];
        $paymentFrequency = $planPayload['payment']['frequency'];
        $renewals = $paymentFrequency === 'single' ? 1 : (int) $planPayload['payment']['renewals'];
        $firstPaymentDate = $planPayload['payment']['first_payment_date'];
        $isRotating = (bool) ($planPayload['rental']['is_rotating'] ?? false);
        $commissionPayload = $planPayload['commission'] ?? [];

        try {
            $endsAt = $this->paymentSchedule->endDate($startsAt, $paymentFrequency, $renewals);
            $paymentSchedule = $this->paymentSchedule->buildForRenewals(
                $startsAt,
                $firstPaymentDate,
                $paymentFrequency,
                $renewals
            );
        } catch (\InvalidArgumentException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
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

        // Todas las partidas pasan a la renta: la renta del espacio se cobra en
        // cada periodo y los servicios (impresión, instalación…) una sola vez,
        // en el primer pago.
        $conversionItems = $quote->items->values();
        $netAmount = fn (QuoteItem $item) => max(0, (float) $item->total - (float) $item->tax_amount);
        $rentPerPeriod = round((float) $conversionItems
            ->filter(fn (QuoteItem $item) => !empty($item->space_id))
            ->sum($netAmount), 2);
        $oneTimeServices = round((float) $conversionItems
            ->filter(fn (QuoteItem $item) => empty($item->space_id))
            ->sum($netAmount), 2);

        $customAmounts = $planPayload['payment']['installment_amounts'] ?? null;
        if (is_array($customAmounts) && count($customAmounts) !== count($paymentSchedule)) {
            return response()->json([
                'message' => 'El número de importes no coincide con el número de pagos.',
            ], 422);
        }

        $installmentAmounts = is_array($customAmounts)
            ? array_map(fn ($amount) => round((float) $amount, 2), array_values($customAmounts))
            : array_map(
                fn ($index) => round($rentPerPeriod + ($index === 0 ? $oneTimeServices : 0), 2),
                array_keys($paymentSchedule)
            );
        $taxRate = $quote->includes_tax ? (float) $quote->tax_rate : 0.0;

        // Concepto de cada cobro: qué espacios cubre y, en el primero, qué
        // servicios de cargo único incluye. Se marca si el importe se ajustó.
        $money = fn (float $value) => '$' . number_format($value, 2);
        $rentConcept = 'Renta: ' . ($conversionItems
            ->filter(fn (QuoteItem $item) => !empty($item->space_id))
            ->map(fn (QuoteItem $item) => $item->concept)
            ->filter()
            ->implode(', ') ?: 'periodo');
        $servicesConcept = $conversionItems
            ->filter(fn (QuoteItem $item) => empty($item->space_id))
            ->map(fn (QuoteItem $item) => sprintf('%s (%s)', $item->concept, $money($netAmount($item))))
            ->implode(', ');
        $installmentConcepts = array_map(function ($index) use ($installmentAmounts, $rentPerPeriod, $oneTimeServices, $rentConcept, $servicesConcept) {
            $concept = $rentConcept;
            if ($index === 0 && $servicesConcept !== '') {
                $concept .= ' + ' . $servicesConcept;
            }
            $expected = round($rentPerPeriod + ($index === 0 ? $oneTimeServices : 0), 2);
            if (abs($installmentAmounts[$index] - $expected) > 0.009) {
                $concept .= ' · Importe ajustado manualmente';
            }
            return $concept;
        }, array_keys($installmentAmounts));

        // Partidas que ocupan un espacio: rentas y anuncios (servicio ligado a
        // un espacio). Al convertir, la renta queda confirmada y estos espacios
        // se bloquean durante la vigencia.
        $occupancyItems = $quote->items
            ->filter(fn (QuoteItem $item) => !empty($item->space_id)
                && ($item->item_type === 'rental' || $item->item_type === 'service'))
            ->unique('space_id')
            ->values();

        // La renta puede iniciar después de la fecha cotizada; solo se exige
        // que su vigencia cubra el final de las partidas cotizadas.
        $quotedEndsAt = $rentalItems->max(fn (QuoteItem $item) => optional($item->end_date)->format('Y-m-d'));

        if ($quotedEndsAt && Carbon::parse($endsAt)->lt(Carbon::parse($quotedEndsAt))) {
            return response()->json([
                'message' => "La renta debe finalizar al menos el {$quotedEndsAt} para cubrir las partidas cotizadas.",
            ], 422);
        }

        $userId = $this->authUserId($request);

        try {
        $rental = DB::transaction(function () use ($quote, $occupancyItems, $conversionItems, $userId, $request, $customerType, $customerId, $customerSummary, $startsAt, $endsAt, $paymentFrequency, $renewals, $firstPaymentDate, $paymentSchedule, $commissionPayload, $isRotating, $installmentAmounts, $taxRate, $rentPerPeriod, $oneTimeServices, $installmentConcepts) {
            $periods = $occupancyItems->map(fn (QuoteItem $item) => [
                'space_id' => (int) $item->space_id,
                'start_date' => $startsAt,
                'end_date' => $endsAt,
            ])->all();

            if (!empty($periods)) {
                $spaceIds = collect($periods)->pluck('space_id')->unique()->sort()->values();
                DB::table('spaces')->whereIn('id', $spaceIds)->lockForUpdate()->get();
                $conflicts = $this->spaceAvailability->conflictingSpaceIds($periods);

                if ($conflicts->isNotEmpty()) {
                    throw new \DomainException('Espacios no disponibles para la vigencia: ' . $conflicts->implode(', ') . '.');
                }
            }

            $subtotal = round(array_sum($installmentAmounts), 2);
            $tax = round(array_sum(array_map(fn ($amount) => round($amount * $taxRate / 100, 2), $installmentAmounts)), 2);
            $total = round($subtotal + $tax, 2);
            $commissionBase = $subtotal;
            $commission = $this->commissionCalculator->calculate($commissionPayload, $commissionBase, $quote->agency);

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
                // Al convertir desde una cotización aceptada la renta queda
                // confirmada: espacios ocupados y cobros emitidos.
                'status' => 'active',
                'is_rotating' => $isRotating,
                'starts_at' => $startsAt,
                'ends_at' => $endsAt,
                'payment_frequency' => $paymentFrequency,
                'first_payment_date' => $firstPaymentDate,
                'payment_installments' => count($paymentSchedule),
                ...$commission,
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
                    'is_rotating' => $isRotating,
                    'customer' => $quote->snapshot_json['customer'] ?? null,
                    'company' => $quote->snapshot_json['company'] ?? null,
                    'agency' => $quote->snapshot_json['agency'] ?? null,
                    'payment' => [
                        'frequency' => $paymentFrequency,
                        'renewals' => $renewals,
                        'rent_per_period' => $rentPerPeriod,
                        'one_time_services' => $oneTimeServices,
                        'installment_amounts' => $installmentAmounts,
                        'tax_rate' => $taxRate,
                    ],
                    'commission' => $commission,
                    'items' => $conversionItems->map(function (QuoteItem $item) {
                        return [
                            'quote_item_id' => $item->id,
                            'item_type' => $item->item_type,
                            'space_id' => $item->space_id,
                            'service_id' => $item->service_id,
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

            foreach ($occupancyItems as $item) {
                RentalItem::create([
                    'rental_id' => $rental->id,
                    'quote_item_id' => $item->id,
                    'space_id' => $item->space_id,
                    'start_date' => $startsAt,
                    'end_date' => $endsAt,
                    'unit_price' => $item->unit_price,
                    'qty' => $item->qty,
                    'subtotal' => $item->subtotal,
                    'status' => 'active',
                ]);
            }

            $this->paymentSchedule->createInvoicesFromAmounts($rental, $paymentSchedule, $installmentAmounts, $taxRate, $installmentConcepts);
            $rental->invoices()
                ->where('status', 'issued')
                ->whereDate('due_date', '<', Carbon::today())
                ->update(['status' => 'overdue']);

            $quote->converted_to_rental_at = Carbon::now();
            $quote->converted_to_rental_by = $userId;
            $quote->save();

            $this->recordHistory(
                quote: $quote,
                fromStatusId: $quote->quote_status_id,
                toStatusId: $quote->quote_status_id,
                request: $request,
                reason: 'converted_to_rental',
                notes: "Renta #{$rental->id} creada y confirmada desde cotización aceptada.",
                meta: [
                    'event' => 'converted_to_rental',
                    'rental_id' => $rental->id,
                    'quote_folio' => $quote->folio,
                ],
            );

            return $rental->load('invoices');
        });
        } catch (\DomainException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        $quote->load(['items.space', 'items.service', 'status', 'company', 'letterhead', 'agency', 'rental', 'acceptedByUser', 'convertedToRentalByUser']);

        return response()->json([
            'message' => "Cotización convertida a renta #{$rental->id}.",
            'data' => $this->serializeQuote($quote, true),
        ]);
    }

    /** Columnas de la cotización que salen del cálculo (totales, IVA, vigencia, notas). */
    private function calculatedQuoteAttributes(array $validated, array $calculated): array
    {
        return [
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
        ];
    }

    private function createQuoteItems(Quote $quote, array $items): void
    {
        $hasUnitColumn = $this->hasColumn('quote_items', 'unit');
        foreach ($items as $item) {
            QuoteItem::create(($hasUnitColumn ? ['unit' => $item['unit']] : []) + [
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
                'width_m' => $item['width_m'],
                'height_m' => $item['height_m'],
                'square_meters' => $item['square_meters'],
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
    }

    private function validateAndResolvePayload(Request $request): array
    {
        $validator = Validator::make($request->all(), [
            'quote_kind' => ['nullable', 'in:advertisement,space'],
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
            'terms_html' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'duplicate_of_quote_id' => ['nullable', 'integer', 'exists:quotes,id'],
            'images' => ['nullable', 'array', 'max:10'],
            'images.*' => ['file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.item_type' => ['required', 'in:rental,service'],
            'items.*.space_id' => ['nullable', 'integer', 'exists:spaces,id'],
            'items.*.service_id' => ['nullable', 'integer', 'exists:services,id'],
            'items.*.concept' => ['nullable', 'string', 'max:255'],
            'items.*.description' => ['nullable', 'string'],
            'items.*.start_date' => ['nullable', 'date'],
            'items.*.end_date' => ['nullable', 'date'],
            'items.*.qty' => ['nullable', 'integer', 'min:1'],
            'items.*.unit' => ['nullable', 'in:pieza,m2'],
            'items.*.width_m' => ['nullable', 'required_with:items.*.height_m', 'numeric', 'min:0.01'],
            'items.*.height_m' => ['nullable', 'required_with:items.*.width_m', 'numeric', 'min:0.01'],
            'items.*.square_meters' => ['nullable', 'numeric', 'min:0.01'],
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
        $validated['quote_kind'] = $validated['quote_kind'] ?? 'space';

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

        $validated['items'] = $this->normalizeItems(
            $validated['items'] ?? [],
            $this->quoteConfigurationPricePerSquareMeter()
        );

        $rentalPeriods = collect($validated['items'])
            ->where('item_type', 'rental')
            ->map(fn (array $item) => [
                'space_id' => $item['space_id'],
                'start_date' => $item['start_date'],
                'end_date' => $item['end_date'],
            ])
            ->values()
            ->all();
        $conflicts = $this->spaceAvailability->conflictingSpaceIds($rentalPeriods);
        if ($conflicts->isNotEmpty()) {
            throw new HttpResponseException(response()->json([
                'message' => 'Uno o más espacios ya están rentados durante las fechas seleccionadas.',
                'errors' => ['items' => ['Espacios no disponibles: ' . $conflicts->implode(', ')]],
            ], 422));
        }
        $customerSummary = $this->resolveCustomerSummary(
            $validated['customer']['type'],
            isset($validated['customer']['id']) ? (int)$validated['customer']['id'] : null
        );

        return [$validated, $company, $letterhead, $agency, $customerSummary];
    }

    private function normalizeItems(array $items, float $defaultSquareMeterPrice): array
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

        return collect($items)->values()->map(function (array $item, int $index) use ($spaces, $services, $defaultSquareMeterPrice) {
            $type = $item['item_type'];
            $space = !empty($item['space_id']) ? $spaces->get((int)$item['space_id']) : null;
            $service = !empty($item['service_id']) ? $services->get((int)$item['service_id']) : null;
            $unit = $type === 'service'
                ? ($item['unit'] ?? ($service?->unit ?? 'm2'))
                : 'pieza';
            $defaultServicePrice = $unit === 'm2'
                ? ($defaultSquareMeterPrice ?: (float)($service->base_price ?? 0))
                : (float)($service->base_price ?? 0);

            return [
                'item_type' => $type,
                'space_id' => $space?->id,
                'service_id' => $service?->id,
                'concept' => trim((string)($item['concept'] ?? ($space?->title ?? $service?->name ?? ''))),
                'description' => $item['description'] ?? ($service?->description ?? null),
                'start_date' => $type === 'rental' ? ($item['start_date'] ?? null) : null,
                'end_date' => $type === 'rental' ? ($item['end_date'] ?? null) : null,
                'qty' => (int)($item['qty'] ?? 1),
                'unit' => $unit,
                'width_m' => $type === 'service' ? ($item['width_m'] ?? null) : null,
                'height_m' => $type === 'service' ? ($item['height_m'] ?? null) : null,
                'square_meters' => $item['square_meters'] ?? 1,
                'unit_price' => $item['unit_price'] ?? ($type === 'service' ? $defaultServicePrice : ($space?->price ?? 0)),
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
            'duplicated_from_quote_id' => $quote->duplicated_from_quote_id ?? null,
            'quote_kind' => $quote->quote_kind ?: ($snapshot['quote_kind'] ?? 'space'),
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
                'primary_color' => $quote->letterhead->primary_color,
                'secondary_color' => $quote->letterhead->secondary_color,
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
                'commission_base' => 0.0,
                'commission_type' => 'none',
                'commission_value' => 0.0,
                'commission_amount' => 0.0,
                'tax' => (float)$quote->tax,
                'total' => (float)$quote->total,
            ],
            'accepted_at' => optional($quote->accepted_at)->toIso8601String(),
            'accepted_by' => $quote->acceptedByUser ? [
                'id' => $quote->acceptedByUser->id,
                'name' => $quote->acceptedByUser->name,
                'username' => $quote->acceptedByUser->username,
                'email' => $quote->acceptedByUser->email,
            ] : null,
            'converted_to_rental_at' => optional($quote->converted_to_rental_at)->toIso8601String(),
            'converted_to_rental_by' => $quote->convertedToRentalByUser ? [
                'id' => $quote->convertedToRentalByUser->id,
                'name' => $quote->convertedToRentalByUser->name,
                'username' => $quote->convertedToRentalByUser->username,
                'email' => $quote->convertedToRentalByUser->email,
            ] : null,
            'rental' => $quote->rental ? [
                'id' => $quote->rental->id,
                'status' => $quote->rental->status,
                'is_rotating' => (bool) $quote->rental->is_rotating,
                'starts_at' => optional($quote->rental->starts_at)->format('Y-m-d'),
                'ends_at' => optional($quote->rental->ends_at)->format('Y-m-d'),
                'total' => (float) $quote->rental->total,
            ] : null,
            'valid_until' => optional($quote->valid_until)->format('Y-m-d'),
            'notes' => $quote->notes,
            'terms_html' => $quote->terms_html,
            'pdf_path' => $quote->pdf_path,
            'pdf_generated_at' => optional($quote->pdf_generated_at)->toIso8601String(),
            'created_at' => optional($quote->created_at)->toIso8601String(),
            'updated_at' => optional($quote->updated_at)->toIso8601String(),
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
                        'unit' => $item->unit ?? ($item->item_type === 'service' ? 'm2' : 'pieza'),
                        'width_m' => $item->width_m !== null ? (float)$item->width_m : null,
                        'height_m' => $item->height_m !== null ? (float)$item->height_m : null,
                        'square_meters' => (float)$item->square_meters,
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
            'images' => $withItems
                ? $quote->images->map(function (QuoteImage $image) {
                    return [
                        'id' => $image->id,
                        'disk' => $image->disk,
                        'path' => $image->path,
                        'filename' => $image->filename,
                        'original_name' => $image->original_name,
                        'mime_type' => $image->mime_type,
                        'size' => (int) $image->size,
                        'is_cover' => (bool) $image->is_cover,
                        'sort_order' => (int) $image->sort_order,
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
            'quote_kind' => $quote->quote_kind ?: 'space',
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

    private function storeQuoteImages(Quote $quote, Request $request): void
    {
        if (!$request->hasFile('images')) {
            return;
        }

        $files = $request->file('images');
        $files = is_array($files) ? $files : [$files];

        $sortOrder = (int) ($quote->images()->max('sort_order') ?? 0);
        $hasCover = $quote->images()->exists();

        foreach ($files as $file) {
            if (!$file) {
                continue;
            }

            $extension = strtolower($file->getClientOriginalExtension() ?: $file->extension() ?: 'jpg');
            $filename = Carbon::now()->format('Ymd_His') . '_' . Str::random(12) . '.' . $extension;
            $path = $file->storeAs("quotes/{$quote->id}/original", $filename, 'public');

            $quote->images()->create([
                'disk' => 'public',
                'path' => $path,
                'filename' => $filename,
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType() ?: null,
                'size' => (int) $file->getSize(),
                'is_cover' => !$hasCover && $sortOrder === 0,
                'sort_order' => ++$sortOrder,
            ]);

            $hasCover = true;
        }
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
            // Aceptada puede terminar rechazada (el cliente se retracta de los
            // términos) o cancelada (el servicio finalmente no se realizó).
            'accepted' => ['rejected', 'cancelled'],
            'rejected' => [],
            'cancelled' => [],
        ];

        return in_array($toStatusKey, $transitions[$fromStatusKey] ?? [], true);
    }

    private function cancelReplacedQuote(Quote $sourceQuote, Quote $newQuote, ?QuoteStatus $cancelledStatus, Request $request): void
    {
        // Rechazada/cancelada ya son finales: se conservan y solo se registra
        // en el historial qué folio la reemplazó.
        $keepStatus = in_array($sourceQuote->status?->key, ['cancelled', 'rejected'], true) || !$cancelledStatus;
        $fromStatusId = (int)$sourceQuote->quote_status_id;
        $toStatusId = $keepStatus ? $fromStatusId : (int)$cancelledStatus->id;

        if (!$keepStatus) {
            $sourceQuote->quote_status_id = $toStatusId;
            $sourceQuote->save();
        }

        $this->recordHistory(
            quote: $sourceQuote,
            fromStatusId: $fromStatusId,
            toStatusId: $toStatusId,
            request: $request,
            reason: 'replaced_by_duplicate',
            notes: "Reemplazada por la cotización {$newQuote->folio}",
            meta: [
                'snapshot_version' => $sourceQuote->version,
                'replaced_by' => [
                    'id' => $newQuote->id,
                    'folio' => $newQuote->folio,
                ],
                'totals' => [
                    'subtotal' => (float)$sourceQuote->subtotal,
                    'discount' => (float)$sourceQuote->discount,
                    'tax' => (float)$sourceQuote->tax,
                    'total' => (float)$sourceQuote->total,
                ],
                'pdf_path' => $sourceQuote->pdf_path,
            ],
        );
    }

    private function hasColumn(string $table, string $column): bool
    {
        static $cache = [];
        $key = "{$table}.{$column}";

        return $cache[$key] ??= Schema::hasTable($table) && Schema::hasColumn($table, $column);
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

    private function quoteConfiguration(): array
    {
        if (!Schema::hasTable('configurations')) {
            return [
                'id' => null,
                'price_per_square_meter' => 0,
            ];
        }

        $configuration = Configuration::query()->orderBy('id')->first();

        return [
            'id' => $configuration?->id,
            'price_per_square_meter' => (float)($configuration?->price_per_square_meter ?? 0),
        ];
    }

    private function quoteConfigurationPricePerSquareMeter(): float
    {
        return (float)($this->quoteConfiguration()['price_per_square_meter'] ?? 0);
    }
}
