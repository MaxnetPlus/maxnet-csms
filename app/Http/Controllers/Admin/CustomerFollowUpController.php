<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CustomerFollowUp;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\CustomerFollowUpExport;

class CustomerFollowUpController extends Controller
{
    /**
     * Display a listing of the follow ups.
     */
    public function index(Request $request)
    {
        $query = CustomerFollowUp::with(['customer', 'subscription', 'creator', 'assignee']);        // Apply filters
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('customer', function ($customerQuery) use ($search) {
                    $customerQuery->where('customer_name', 'like', "%{$search}%")
                        ->orWhere('customer_id', 'like', "%{$search}%")
                        ->orWhere('customer_email', 'like', "%{$search}%");
                })
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        if ($request->filled('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);
        }

        if ($request->filled('date_from')) {
            $query->where('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->where('created_at', '<=', $request->date_to . ' 23:59:59');
        }

        // Sorting
        $sortField = $request->get('sort', 'created_at');
        $sortDirection = $request->get('direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        // Pagination
        $perPage = $request->get('per_page', 15);
        $followUps = $query->paginate($perPage);        // Get filter options
        $users = User::select('id', 'name')->get();
        $statuses = ['pending', 'in_progress', 'completed', 'cancelled'];
        $priorities = ['low', 'medium', 'high', 'urgent'];

        // Statistics
        $stats = [
            'total' => CustomerFollowUp::count(),
            'pending' => CustomerFollowUp::where('status', 'pending')->count(),
            'in_progress' => CustomerFollowUp::where('status', 'in_progress')->count(),
            'completed' => CustomerFollowUp::where('status', 'completed')->count(),
        ];

        return Inertia::render('Admin/CustomerFollowUp/Index', [
            'followUps' => $followUps,
            'filters' => $request->only(['search', 'status', 'priority', 'assigned_to', 'date_from', 'date_to', 'sort', 'direction']),
            'users' => $users,
            'statuses' => $statuses,
            'priorities' => $priorities,
            'stats' => $stats,
        ]);
    }

    /**
     * Show the form for creating a new follow up.
     */
    public function create(Request $request)
    {
        $customers = Customer::select('customer_id', 'customer_name', 'customer_email')
            ->orderBy('customer_name')
            ->get();

        $users = User::select('id', 'name')->get();

        $subscription = null;
        if ($request->filled('subscription_id')) {
            $subscription = Subscription::with('customer')
                ->where('subscription_id', $request->subscription_id)
                ->first();
        }

        return Inertia::render('Admin/CustomerFollowUp/Create', [
            'customers' => $customers,
            'users' => $users,
            'subscription' => $subscription,
        ]);
    }

    /**
     * Store a newly created follow up in storage.
     */    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,customer_id',
            'subscription_id' => 'nullable|exists:subscriptions,subscription_id',
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

        $validated['created_by'] = auth()->id();
        $validated['status'] = 'pending';

        CustomerFollowUp::create($validated);

        return redirect()->route('admin.follow-ups.index')
            ->with('success', 'Follow up berhasil dibuat.');
    }

    /**
     * Display the specified follow up.
     */
    public function show(CustomerFollowUp $followUp)
    {
        $followUp->load(['customer', 'subscription', 'creator', 'assignee']);

        return Inertia::render('Admin/CustomerFollowUp/Show', [
            'followUp' => $followUp,
        ]);
    }

    /**
     * Show the form for editing the specified follow up.
     */
    public function edit(CustomerFollowUp $followUp)
    {
        $followUp->load(['customer', 'subscription', 'assignee']);

        // Load more customers for better search experience
        $customers = Customer::select('customer_id', 'customer_name', 'customer_email')
            ->orderBy('customer_name')
            ->limit(500) // Increased limit for better search
            ->get();

        $users = User::select('id', 'name')
            ->orderBy('name')
            ->get();

        return Inertia::render('Admin/CustomerFollowUp/Edit', [
            'followUp' => $followUp,
            'customers' => $customers,
            'users' => $users,
        ]);
    }

    /**
     * Update the specified follow up in storage.
     */    public function update(Request $request, CustomerFollowUp $followUp)
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,customer_id',
            'subscription_id' => 'nullable|exists:subscriptions,subscription_id',
            'priority' => 'required|in:low,medium,high,urgent',
            'status' => 'required|in:pending,in_progress,completed,cancelled',
            'description' => 'nullable|string|max:1000',
            'notes' => 'nullable|string|max:1000',
            'resolution' => 'nullable|string|max:1000',
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

        // Set completed_at if status is completed
        if ($validated['status'] === 'completed' && !$followUp->completed_at) {
            $validated['completed_at'] = now();
        } elseif ($validated['status'] !== 'completed') {
            $validated['completed_at'] = null;
        }

        $followUp->update($validated);

        return redirect()->route('admin.follow-ups.index')
            ->with('success', 'Follow up berhasil diperbarui.');
    }

    /**
     * Remove the specified follow up from storage.
     */
    public function destroy(CustomerFollowUp $followUp)
    {
        $followUp->delete();

        return redirect()->route('admin.follow-ups.index')
            ->with('success', 'Follow up berhasil dihapus.');
    }

    /**
     * Export follow ups to Excel.
     */    public function export(Request $request)
    {
        $filters = $request->only(['search', 'status', 'priority', 'assigned_to', 'date_from', 'date_to']);

        return Excel::download(new CustomerFollowUpExport($filters), 'customer-follow-ups-' . now()->format('Y-m-d') . '.xlsx');
    }

    /**
     * Create follow up from subscription page.
     */
    public function createFromSubscription(Request $request)
    {
        $subscription = Subscription::with('customer')
            ->where('subscription_id', $request->subscription_id)
            ->firstOrFail();

        $users = User::select('id', 'name')->get();

        return Inertia::render('Admin/CustomerFollowUp/CreateFromSubscription', [
            'subscription' => $subscription,
            'users' => $users,
        ]);
    }

    /**
     * Get table data for AJAX requests (SSR approach)
     */
    public function tableData(Request $request)
    {
        $query = CustomerFollowUp::with(['customer', 'subscription', 'creator', 'assignee']);

        // Apply filters
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('customer', function ($customerQuery) use ($search) {
                    $customerQuery->where('customer_name', 'like', "%{$search}%")
                        ->orWhere('customer_id', 'like', "%{$search}%")
                        ->orWhere('customer_email', 'like', "%{$search}%");
                })
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('priority') && $request->priority !== 'all') {
            $query->where('priority', $request->priority);
        }

        if ($request->filled('assigned_to') && $request->assigned_to !== 'all') {
            if ($request->assigned_to === 'unassigned') {
                $query->whereNull('assigned_to');
            } else {
                $query->where('assigned_to', $request->assigned_to);
            }
        }

        if ($request->filled('date_from')) {
            $query->where('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->where('created_at', '<=', $request->date_to . ' 23:59:59');
        }

        // Sorting
        $sortField = $request->get('sort', 'created_at');
        $sortDirection = $request->get('direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        // Pagination
        $perPage = $request->get('per_page', 15);
        $followUps = $query->paginate($perPage, ['*'], 'page', $request->get('page', 1));

        return response()->json($followUps);
    }
}
