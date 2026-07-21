<?php

namespace App\Http\Controllers;

use App\Models\Entities\Invoice;
use App\Models\Entities\Payment;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class PaymentController extends Controller
{
    private array $customerNameCache = [];

    public function index(Request $request)
    {
        $this->refreshOverdueStatuses();

        $query = Invoice::query()
            ->with(['rental', 'payments'])
            ->withSum('payments', 'amount')
            ->whereHas('rental', fn ($rental) => $rental->whereIn('status', ['active', 'completed']))
            ->orderByRaw('due_date IS NULL')
            ->orderBy('due_date')
            ->orderBy('id');

        if ($request->filled('q')) {
            $term = trim((string) $request->get('q'));
            $query->where(function ($inner) use ($term) {
                $inner->where('id', 'like', "%{$term}%")
                    ->orWhere('folio', 'like', "%{$term}%")
                    ->orWhereHas('rental', function ($rentalQuery) use ($term) {
                        $rentalQuery->where('id', 'like', "%{$term}%")
                            ->orWhere('customer_type', 'like', "%{$term}%");
                    });
            });
        }

        if ($request->filled('status')) {
            $status = $request->get('status');
            if ($status === 'pending') {
                $query->whereIn('status', ['draft', 'issued']);
            } elseif (in_array($status, ['paid', 'overdue', 'cancelled'], true)) {
                $query->where('status', $status);
            }
        }

        if ($request->filled('date_from')) {
            $query->whereDate('due_date', '>=', $request->get('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('due_date', '<=', $request->get('date_to'));
        }

        $perPage = min(100, max(1, (int) $request->get('per_page', 10)));
        $page = max(1, (int) $request->get('page', 1));
        $items = $query->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'data' => collect($items->items())->map(fn (Invoice $invoice) => $this->serializeInvoice($invoice))->values(),
            'meta' => [
                'page' => $items->currentPage(),
                'perPage' => $items->perPage(),
                'total' => $items->total(),
                'totalPages' => $items->lastPage(),
            ],
            'stats' => $this->stats(),
        ]);
    }

    public function store(Request $request, $invoiceId)
    {
        $validator = Validator::make($request->all(), [
            'amount' => ['required', 'numeric', 'min:0.01'],
            'method' => ['required', 'in:Efectivo,Transferencia,Tarjeta,Paypal,Otro'],
            'reference' => ['nullable', 'string', 'max:100'],
            'paid_at' => ['required', 'date'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Completa los datos del pago.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();

        try {
            $payment = DB::transaction(function () use ($invoiceId, $data) {
                $invoice = Invoice::query()->lockForUpdate()->findOrFail($invoiceId);

                $invoice->loadMissing('rental');
                if (!$invoice->rental || !in_array($invoice->rental->status, ['active', 'completed'], true)) {
                    throw new \DomainException('La renta debe estar confirmada para registrar pagos.');
                }

                if ($invoice->status === 'cancelled') {
                    throw new \DomainException('No se pueden registrar pagos en una parcialidad cancelada.');
                }

                $paid = round((float) $invoice->payments()->sum('amount'), 2);
                $balance = round(max(0, (float) $invoice->total - $paid), 2);
                $amount = round((float) $data['amount'], 2);

                if ($balance <= 0) {
                    throw new \DomainException('La parcialidad ya está liquidada.');
                }
                if ($amount > $balance) {
                    throw new \DomainException('El pago no puede superar el saldo pendiente.');
                }

                $payment = Payment::create([
                    'invoice_id' => $invoice->id,
                    'amount' => $amount,
                    'method' => $data['method'],
                    'reference' => $data['reference'] ?? null,
                    'paid_at' => Carbon::parse($data['paid_at']),
                ]);

                $newPaid = round($paid + $amount, 2);
                if ($newPaid >= (float) $invoice->total) {
                    $invoice->status = 'paid';
                } elseif ($invoice->due_date && $invoice->due_date->lt(Carbon::today())) {
                    $invoice->status = 'overdue';
                } else {
                    $invoice->status = 'issued';
                }
                $invoice->save();

                return $payment;
            });
        } catch (\DomainException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        $invoice = Invoice::query()->with(['rental', 'payments'])->withSum('payments', 'amount')->findOrFail($invoiceId);

        return response()->json([
            'message' => 'Pago registrado correctamente.',
            'data' => [
                'payment' => $payment,
                'invoice' => $this->serializeInvoice($invoice),
            ],
        ], 201);
    }

    private function refreshOverdueStatuses(): void
    {
        Invoice::query()
            ->whereIn('status', ['draft', 'issued'])
            ->whereHas('rental', fn ($rental) => $rental->whereIn('status', ['active', 'completed']))
            ->whereDate('due_date', '<', Carbon::today()->format('Y-m-d'))
            ->update(['status' => 'overdue']);
    }

    private function stats(): array
    {
        $paidByInvoice = DB::table('payments')
            ->selectRaw('invoice_id, SUM(amount) AS paid_amount')
            ->groupBy('invoice_id');

        $balances = DB::table('invoices')
            ->join('rentals', 'rentals.id', '=', 'invoices.rental_id')
            ->leftJoinSub($paidByInvoice, 'payment_totals', function ($join) {
                $join->on('payment_totals.invoice_id', '=', 'invoices.id');
            })
            ->whereIn('rentals.status', ['active', 'completed'])
            ->where('invoices.status', '!=', 'cancelled');

        $receivable = (clone $balances)
            ->selectRaw('COALESCE(SUM(GREATEST(invoices.total - COALESCE(payment_totals.paid_amount, 0), 0)), 0) AS total')
            ->value('total');

        $overdue = (clone $balances)
            ->whereDate('invoices.due_date', '<', Carbon::today()->format('Y-m-d'))
            ->selectRaw('COALESCE(SUM(GREATEST(invoices.total - COALESCE(payment_totals.paid_amount, 0), 0)), 0) AS total')
            ->value('total');

        $dueThisMonth = (clone $balances)
            ->whereBetween('invoices.due_date', [Carbon::now()->startOfMonth()->format('Y-m-d'), Carbon::now()->endOfMonth()->format('Y-m-d')])
            ->selectRaw('COALESCE(SUM(GREATEST(invoices.total - COALESCE(payment_totals.paid_amount, 0), 0)), 0) AS total')
            ->value('total');

        $collectedThisMonth = Payment::query()
            ->whereBetween('paid_at', [Carbon::now()->startOfMonth(), Carbon::now()->endOfMonth()])
            ->sum('amount');

        return [
            'receivable' => round((float) $receivable, 2),
            'overdue' => round((float) $overdue, 2),
            'due_this_month' => round((float) $dueThisMonth, 2),
            'collected_this_month' => round((float) $collectedThisMonth, 2),
        ];
    }

    private function serializeInvoice(Invoice $invoice): array
    {
        $paid = round((float) ($invoice->payments_sum_amount ?? $invoice->payments->sum('amount')), 2);
        $total = round((float) $invoice->total, 2);
        $snapshot = is_array($invoice->rental?->snapshot_json) ? $invoice->rental->snapshot_json : [];
        $customer = $snapshot['customer'] ?? null;

        return [
            'id' => $invoice->id,
            'rental_id' => $invoice->rental_id,
            'rental_status' => $invoice->rental?->status,
            'customer_type' => $invoice->rental?->customer_type,
            'customer_id' => $invoice->rental?->customer_id,
            'customer_name' => $customer['display_name'] ?? $this->resolveCustomerName(
                (string) $invoice->rental?->customer_type,
                $invoice->rental?->customer_id ? (int) $invoice->rental->customer_id : null
            ),
            'folio' => $invoice->folio,
            'status' => $invoice->status,
            'period_start' => optional($invoice->period_start)->format('Y-m-d'),
            'period_end' => optional($invoice->period_end)->format('Y-m-d'),
            'due_date' => optional($invoice->due_date)->format('Y-m-d'),
            'subtotal' => (float) $invoice->subtotal,
            'tax' => (float) $invoice->tax,
            'total' => $total,
            'paid' => $paid,
            'balance' => round(max(0, $total - $paid), 2),
            'payments' => $invoice->payments->map(fn (Payment $payment) => [
                'id' => $payment->id,
                'amount' => (float) $payment->amount,
                'method' => $payment->method,
                'reference' => $payment->reference,
                'paid_at' => optional($payment->paid_at)->toDateTimeString(),
            ])->values(),
        ];
    }

    private function resolveCustomerName(string $type, ?int $id): string
    {
        if (!$id || !in_array($type, ['lead', 'cliente'], true)) {
            return 'Cliente no identificado';
        }

        $cacheKey = "{$type}:{$id}";
        if (isset($this->customerNameCache[$cacheKey])) {
            return $this->customerNameCache[$cacheKey];
        }

        $table = $type === 'cliente' ? 'clientes' : 'leads';
        $customer = DB::table($table)->where('id', $id)->first();
        if (!$customer) {
            return $this->customerNameCache[$cacheKey] = ucfirst($type) . " #{$id}";
        }

        $personName = trim(implode(' ', array_filter([
            $customer->nombre ?? null,
            $customer->apellido_paterno ?? null,
            $customer->apellido_materno ?? null,
        ])));

        return $this->customerNameCache[$cacheKey] = (
            $customer->negocio
            ?? $customer->razon_social
            ?? ($personName ?: ucfirst($type) . " #{$id}")
        );
    }
}
