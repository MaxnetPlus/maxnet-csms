<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use App\Models\CustomerFollowUp;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SubscriptionController extends Controller
{
    /**
     * Display a listing of subscriptions
     */
    public function index(Request $request): Response
    {
        $query = Subscription::with([
            'customer:customer_id,customer_name,customer_email,customer_phone'
        ])
            ->select([
                'subscription_id',
                'customer_id',
                'serv_id',
                'subscription_status',
                'subscription_address',
                'subscription_price',
                'subscription_start_date',
                'subscription_billing_cycle',
                'group',
                'created_at',
                'updated_at',
                'dismantle_at',
                'suspend_at',
                'installed_at',
                'subscription_description'
            ]);

        // Apply search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('subscription_id', 'like', "%{$search}%")
                    ->orWhere('serv_id', 'like', "%{$search}%")
                    ->orWhere('subscription_address', 'like', "%{$search}%")
                    ->orWhere('subscription_description', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($customerQuery) use ($search) {
                        $customerQuery->where('customer_name', 'like', "%{$search}%")
                            ->orWhere('customer_email', 'like', "%{$search}%")
                            ->orWhere('customer_phone', 'like', "%{$search}%");
                    });
            });
        }

        // Apply status filter
        if ($request->filled('status')) {
            $query->where('subscription_status', $request->status);
        }

        // Apply group filter
        if ($request->filled('group')) {
            $query->where('group', $request->group);
        }

        // Apply date range filter
        if ($request->filled('date_from')) {
            $query->whereDate('updated_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('updated_at', '<=', $request->date_to);
        }

        // Apply sorting
        $sortField = $request->get('sort', 'updated_at');
        $sortDirection = $request->get('direction', 'desc');

        // Validate sort field to prevent SQL injection
        $allowedSortFields = [
            'subscription_id',
            'serv_id',
            'subscription_status',
            'subscription_price',
            'subscription_start_date',
            'group',
            'created_at',
            'updated_at',
            'customer_name'
        ];

        if (in_array($sortField, $allowedSortFields)) {
            if ($sortField === 'customer_name') {
                $query->leftJoin('customers', 'subscriptions.customer_id', '=', 'customers.customer_id')
                    ->orderBy('customers.customer_name', $sortDirection);
            } else {
                $query->orderBy($sortField, $sortDirection);
            }
        } else {
            $query->orderBy('updated_at', 'desc');
        }

        $perPage = $request->get('per_page', 15);
        $subscriptions = $query->paginate($perPage)->withQueryString();

        // Get statistics
        $stats = $this->getSubscriptionStats();

        // Get available groups for filter
        $groups = Subscription::distinct()->pluck('group')->filter()->sort()->values();

        return Inertia::render('Admin/Subscription/Index', [
            'subscriptions' => $subscriptions,
            'filters' => $request->only(['search', 'status', 'group', 'date_from', 'date_to', 'sort', 'direction', 'per_page']),
            'stats' => $stats,
            'groups' => $groups,
        ]);
    }

    /**
     * Get subscription statistics
     */
    private function getSubscriptionStats(): array
    {
        $total = Subscription::count();
        $active = Subscription::where('subscription_status', 'ACTIVE')->count();
        $canceled = Subscription::where('subscription_status', 'CANCELED')->count();
        $suspended = Subscription::where('subscription_status', 'SUSPEND')->count();
        $dismantled = Subscription::where('subscription_status', 'DISMANTLE')->count();

        return [
            'total' => $total,
            'active' => $active,
            'canceled' => $canceled,
            'suspended' => $suspended,
            'dismantled' => $dismantled,
        ];
    }

    /**
     * Show the specified subscription
     */
    public function show(Request $request, string $id): Response
    {
        $subscription = Subscription::with('customer')->findOrFail($id);

        return Inertia::render('Admin/Subscription/Show', [
            'subscription' => $subscription,
        ]);
    }

    /**
     * Export subscriptions data
     */
    public function export(Request $request)
    {
        $query = Subscription::with('customer')
            ->select([
                'subscription_id',
                'customer_id',
                'serv_id',
                'subscription_status',
                'subscription_address',
                'subscription_price',
                'subscription_start_date',
                'subscription_billing_cycle',
                'group',
                'created_at',
                'dismantle_at',
                'suspend_at',
                'installed_at'
            ]);

        // Apply same filters as index
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('subscription_id', 'like', "%{$search}%")
                    ->orWhere('serv_id', 'like', "%{$search}%")
                    ->orWhere('subscription_address', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($customerQuery) use ($search) {
                        $customerQuery->where('customer_name', 'like', "%{$search}%")
                            ->orWhere('customer_email', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('status')) {
            $query->where('subscription_status', $request->status);
        }

        if ($request->filled('group')) {
            $query->where('group', $request->group);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $subscriptions = $query->get();

        $format = $request->get('format', 'csv');

        if ($format === 'csv') {
            $filename = 'subscriptions_' . now()->format('Y-m-d_H-i-s') . '.csv';

            $headers = [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => "attachment; filename=\"$filename\"",
            ];

            $callback = function () use ($subscriptions) {
                $file = fopen('php://output', 'w');

                // Add CSV headers
                fputcsv($file, [
                    'Subscription ID',
                    'Customer Name',
                    'Customer Email',
                    'Service ID',
                    'Status',
                    'Address',
                    'Price',
                    'Start Date',
                    'Billing Cycle',
                    'Group',
                    'Created At',
                    'Installed At',
                    'Dismantled At',
                    'Suspended At'
                ]);

                // Add data rows
                foreach ($subscriptions as $subscription) {
                    fputcsv($file, [
                        $subscription->subscription_id,
                        $subscription->customer->customer_name ?? '',
                        $subscription->customer->customer_email ?? '',
                        $subscription->serv_id,
                        $subscription->subscription_status,
                        $subscription->subscription_address,
                        $subscription->subscription_price,
                        $subscription->subscription_start_date,
                        $subscription->subscription_billing_cycle,
                        $subscription->group,
                        $subscription->created_at?->format('Y-m-d H:i:s'),
                        $subscription->installed_at?->format('Y-m-d H:i:s'),
                        $subscription->dismantle_at?->format('Y-m-d H:i:s'),
                        $subscription->suspend_at?->format('Y-m-d H:i:s'),
                    ]);
                }

                fclose($file);
            };

            return response()->stream($callback, 200, $headers);
        }

        // Default to JSON export
        return response()->json($subscriptions);
    }

    /**
     * Get paginated table data for subscriptions (API endpoint)
     */
    public function tableData(Request $request)
    {
        $query = Subscription::with([
            'customer:customer_id,customer_name,customer_email,customer_phone'
        ])
            ->select([
                'subscription_id',
                'customer_id',
                'serv_id',
                'subscription_status',
                'subscription_address',
                'subscription_price',
                'subscription_start_date',
                'subscription_billing_cycle',
                'group',
                'created_at',
                'updated_at',
                'dismantle_at',
                'suspend_at',
                'installed_at',
                'subscription_description'
            ]);

        // Apply search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('subscription_id', 'like', "%{$search}%")
                    ->orWhere('serv_id', 'like', "%{$search}%")
                    ->orWhere('subscription_address', 'like', "%{$search}%")
                    ->orWhere('subscription_description', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($customerQuery) use ($search) {
                        $customerQuery->where('customer_name', 'like', "%{$search}%")
                            ->orWhere('customer_email', 'like', "%{$search}%")
                            ->orWhere('customer_phone', 'like', "%{$search}%");
                    });
            });
        }

        // Apply status filter
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('subscription_status', $request->status);
        }

        // Apply group filter
        if ($request->filled('group') && $request->group !== 'all') {
            $query->where('group', $request->group);
        }

        // Apply date range filter
        if ($request->filled('date_from')) {
            $query->whereDate('updated_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('updated_at', '<=', $request->date_to);
        }

        // Apply sorting
        $sortField = $request->get('sort', 'updated_at');
        $sortDirection = $request->get('direction', 'desc');

        // Validate sort field to prevent SQL injection
        $allowedSortFields = [
            'subscription_id',
            'serv_id',
            'subscription_status',
            'subscription_price',
            'subscription_start_date',
            'group',
            'created_at',
            'updated_at',
            'customer_name'
        ];

        if (in_array($sortField, $allowedSortFields)) {
            if ($sortField === 'customer_name') {
                $query->leftJoin('customers', 'subscriptions.customer_id', '=', 'customers.customer_id')
                    ->orderBy('customers.customer_name', $sortDirection);
            } else {
                $query->orderBy($sortField, $sortDirection);
            }
        } else {
            $query->orderBy('updated_at', 'desc');
        }

        $perPage = $request->get('per_page', 15);
        $subscriptions = $query->paginate($perPage);

        // Add has_active_follow_ups attribute to each subscription
        $subscriptions->getCollection()->transform(function ($subscription) {
            // Get active follow ups for this customer
            $activeFollowUps = CustomerFollowUp::where('customer_id', $subscription->customer_id)
                ->whereIn('status', ['pending', 'in_progress'])
                ->orderBy('priority', 'desc')
                ->get();

            $subscription->active_follow_ups = $activeFollowUps;
            $subscription->has_active_follow_ups = $activeFollowUps->isNotEmpty();
            return $subscription;
        });

        return response()->json($subscriptions);
    }

    /**
     * Create follow up for specific subscription
     */
    public function createFollowUp(Request $request, Subscription $subscription)
    {
        // dd($subscription->subscription_id);

        $validated = $request->validate([
            'priority' => 'required|in:low,medium,high,urgent',
            'description' => 'nullable|string|max:1000',
            'notes' => 'nullable|string|max:1000',
            'assigned_to' => 'nullable|string',
        ]);

        // Convert "unassigned" to null
        if ($validated['assigned_to'] === 'unassigned') {
            $validated['assigned_to'] = null;
        }

        // Validate assigned_to is a valid user ID if not null
        if ($validated['assigned_to'] !== null) {
            $request->validate([
                'assigned_to' => 'exists:users,id',
            ]);
        }

        $followUp = CustomerFollowUp::create([
            'subscription_id' => $subscription->subscription_id,
            'customer_id' => $subscription->customer_id,
            'priority' => $validated['priority'],
            'description' => $validated['description'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'assigned_to' => $validated['assigned_to'] ?? null,
            'created_by' => auth()->id(),
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Follow up berhasil dibuat',
            'follow_up' => $followUp->load(['creator', 'assignee'])
        ]);
    }
}
