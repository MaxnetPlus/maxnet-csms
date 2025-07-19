<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Maintenance;
use App\Models\CustomerFollowUp;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class MaintenanceController extends Controller
{
    /**
     * Display a listing of maintenances
     */
    public function index(Request $request): Response
    {
        $query = Maintenance::with([
            'customer:customer_id,customer_name,customer_email,customer_phone',
            'subscription:subscription_id,subscription_description'
        ])
            ->select([
                'ticket_id',
                'subscription_id',
                'customer_id',
                'subject_problem',
                'customer_report',
                'technician_update_desc',
                'status',
                'work_by',
                'created_by',
                'ticket_close_date',
                'created_at',
                'updated_at'
            ]);

        // Apply search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('ticket_id', 'like', "%{$search}%")
                    ->orWhere('subject_problem', 'like', "%{$search}%")
                    ->orWhere('customer_report', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($customerQuery) use ($search) {
                        $customerQuery->where('customer_name', 'like', "%{$search}%")
                            ->orWhere('customer_email', 'like', "%{$search}%")
                            ->orWhere('customer_phone', 'like', "%{$search}%");
                    });
            });
        }

        // Apply status filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Apply subject problem filter
        if ($request->filled('subject_problem')) {
            $query->where('subject_problem', 'like', "%{$request->subject_problem}%");
        }

        // Apply date range filter
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Apply sorting
        $sortField = $request->get('sort', 'created_at');
        $sortDirection = $request->get('direction', 'desc');

        // Validate sort field to prevent SQL injection
        $allowedSortFields = [
            'ticket_id',
            'subject_problem',
            'status',
            'created_at',
            'updated_at',
            'ticket_close_date',
            'customer_name'
        ];

        if (in_array($sortField, $allowedSortFields)) {
            if ($sortField === 'customer_name') {
                $query->leftJoin('customers', 'maintenances.customer_id', '=', 'customers.customer_id')
                    ->orderBy('customers.customer_name', $sortDirection);
            } else {
                $query->orderBy($sortField, $sortDirection);
            }
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $perPage = $request->get('per_page', 15);
        $maintenances = $query->paginate($perPage)->withQueryString();

        // Get statistics
        $stats = $this->getMaintenanceStats();

        // Get available statuses and subject problems for filter
        $statuses = Maintenance::distinct()->pluck('status')->filter()->sort()->values();
        $subjectProblems = Maintenance::distinct()->pluck('subject_problem')->filter()->sort()->values();

        return Inertia::render('Admin/Maintenance/Index', [
            'maintenances' => $maintenances,
            'filters' => $request->only(['search', 'status', 'subject_problem', 'date_from', 'date_to', 'sort', 'direction', 'per_page']),
            'stats' => $stats,
            'statuses' => $statuses,
            'subjectProblems' => $subjectProblems,
        ]);
    }

    /**
     * Get maintenance statistics
     */
    private function getMaintenanceStats(): array
    {
        $total = Maintenance::count();
        $open = Maintenance::where('status', 'Open')->count();
        $closed = Maintenance::where('status', 'Closed')->count();
        $inProgress = Maintenance::where('status', 'In Progress')->count();
        $sales = Maintenance::where('subject_problem', 'like', '%sales%')->count();

        return [
            'total' => $total,
            'open' => $open,
            'closed' => $closed,
            'in_progress' => $inProgress,
            'sales' => $sales,
        ];
    }

    /**
     * Show the specified maintenance
     */
    public function show(Request $request, string $id): Response
    {
        $maintenance = Maintenance::with(['customer', 'subscription'])->findOrFail($id);

        return Inertia::render('Admin/Maintenance/Show', [
            'maintenance' => $maintenance,
        ]);
    }

    /**
     * Export maintenances data
     */
    public function export(Request $request)
    {
        $query = Maintenance::with(['customer', 'subscription']);

        // Apply same filters as index
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('ticket_id', 'like', "%{$search}%")
                    ->orWhere('subject_problem', 'like', "%{$search}%")
                    ->orWhere('customer_report', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($customerQuery) use ($search) {
                        $customerQuery->where('customer_name', 'like', "%{$search}%")
                            ->orWhere('customer_email', 'like', "%{$search}%")
                            ->orWhere('customer_phone', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('subject_problem')) {
            $query->where('subject_problem', 'like', "%{$request->subject_problem}%");
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $maintenances = $query->get();

        $format = $request->get('format', 'csv');

        if ($format === 'csv') {
            $callback = function () use ($maintenances) {
                $file = fopen('php://output', 'w');

                // CSV headers
                fputcsv($file, [
                    'Ticket ID',
                    'Subscription ID',
                    'Customer Name',
                    'Customer Phone',
                    'Subject Problem',
                    'Customer Report',
                    'Technician Update',
                    'Status',
                    'Work By',
                    'Created By',
                    'Close Date',
                    'Created At',
                    'Updated At'
                ]);

                foreach ($maintenances as $maintenance) {
                    fputcsv($file, [
                        $maintenance->ticket_id,
                        $maintenance->subscription_id ?? '',
                        $maintenance->customer->customer_name ?? '',
                        $maintenance->customer->customer_phone ?? '',
                        $maintenance->subject_problem ?? '',
                        $maintenance->customer_report ?? '',
                        $maintenance->technician_update_desc ?? '',
                        $maintenance->status ?? '',
                        $maintenance->work_by ?? '',
                        $maintenance->created_by ?? '',
                        $maintenance->ticket_close_date ? $maintenance->ticket_close_date->format('Y-m-d H:i:s') : '',
                        $maintenance->created_at ? $maintenance->created_at->format('Y-m-d H:i:s') : '',
                        $maintenance->updated_at ? $maintenance->updated_at->format('Y-m-d H:i:s') : '',
                    ]);
                }

                fclose($file);
            };

            $headers = [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => 'attachment; filename="maintenances_' . date('Y-m-d') . '.csv"',
            ];

            return response()->stream($callback, 200, $headers);
        }

        // Default to JSON export
        return response()->json($maintenances);
    }

    /**
     * Get paginated table data for maintenances (API endpoint)
     */
    public function tableData(Request $request)
    {
        $query = Maintenance::with([
            'customer:customer_id,customer_name,customer_email,customer_phone',
            'subscription:subscription_id,subscription_description'
        ])
            ->select([
                'ticket_id',
                'subscription_id',
                'customer_id',
                'subject_problem',
                'customer_report',
                'technician_update_desc',
                'status',
                'work_by',
                'created_by',
                'ticket_close_date',
                'created_at',
                'updated_at'
            ]);

        // Apply search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('ticket_id', 'like', "%{$search}%")
                    ->orWhere('subject_problem', 'like', "%{$search}%")
                    ->orWhere('customer_report', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($customerQuery) use ($search) {
                        $customerQuery->where('customer_name', 'like', "%{$search}%")
                            ->orWhere('customer_email', 'like', "%{$search}%")
                            ->orWhere('customer_phone', 'like', "%{$search}%");
                    });
            });
        }

        // Apply status filter
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Apply subject problem filter
        if ($request->filled('subject_problem') && $request->subject_problem !== 'all') {
            $query->where('subject_problem', 'like', "%{$request->subject_problem}%");
        }

        // Apply date range filter
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Apply sorting
        $sortField = $request->get('sort', 'created_at');
        $sortDirection = $request->get('direction', 'desc');

        // Validate sort field to prevent SQL injection
        $allowedSortFields = [
            'ticket_id',
            'subject_problem',
            'status',
            'created_at',
            'updated_at',
            'ticket_close_date',
            'customer_name'
        ];

        if (in_array($sortField, $allowedSortFields)) {
            if ($sortField === 'customer_name') {
                $query->leftJoin('customers', 'maintenances.customer_id', '=', 'customers.customer_id')
                    ->orderBy('customers.customer_name', $sortDirection);
            } else {
                $query->orderBy($sortField, $sortDirection);
            }
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $perPage = $request->get('per_page', 15);
        $maintenances = $query->paginate($perPage);

        // Add has_active_follow_ups attribute and load active follow ups for each maintenance
        foreach ($maintenances->items() as $maintenance) {
            // Get active follow ups for this customer
            $activeFollowUps = CustomerFollowUp::where('customer_id', $maintenance->customer_id)
                ->whereIn('status', ['pending', 'in_progress'])
                ->orderBy('priority', 'desc')
                ->get();

            $maintenance->active_follow_ups = $activeFollowUps;
            $maintenance->has_active_follow_ups = $activeFollowUps->isNotEmpty();
        }

        return response()->json($maintenances);
    }

    /**
     * Create follow up for specific maintenance
     */
    public function createFollowUp(Request $request, Maintenance $maintenance)
    {
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
            'customer_id' => $maintenance->customer_id,
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
