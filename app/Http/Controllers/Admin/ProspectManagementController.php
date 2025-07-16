<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Prospect;
use App\Models\User;
use App\Models\ProspectCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProspectManagementController extends Controller
{
    /**
     * Display a listing of prospects for admin
     */
    public function index(Request $request)
    {
        $query = Prospect::with(['sales', 'category']);

        // Filter by sales
        if ($request->filled('sales_id')) {
            $query->where('sales_id', $request->sales_id);
        }

        // Filter by category
        if ($request->filled('category_id')) {
            $query->where('prospect_category_id', $request->category_id);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('customer_name', 'like', "%{$search}%")
                    ->orWhere('customer_email', 'like', "%{$search}%")
                    ->orWhere('customer_number', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%");
            });
        }

        // Date range filter
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $prospects = $query->latest()->paginate(15);

        // Get filter options
        $salesUsers = User::role('sales')->get(['id', 'name']);
        $categories = ProspectCategory::active()->get(['id', 'name', 'points']);

        return Inertia::render('Admin/ProspectManagement/Index', [
            'prospects' => $prospects,
            'filters' => $request->only(['sales_id', 'category_id', 'status', 'search', 'date_from', 'date_to']),
            'salesUsers' => $salesUsers,
            'categories' => $categories,
            'stats' => [
                'total' => Prospect::count(),
                'new' => Prospect::where('status', 'new')->count(),
                'contacted' => Prospect::where('status', 'contacted')->count(),
                'qualified' => Prospect::where('status', 'qualified')->count(),
                'converted' => Prospect::where('status', 'converted')->count(),
                'rejected' => Prospect::where('status', 'rejected')->count(),
            ],
        ]);
    }

    /**
     * Display the specified prospect
     */
    public function show(Prospect $prospect)
    {
        $prospect->load(['sales', 'category']);

        return Inertia::render('Admin/ProspectManagement/Show', [
            'prospect' => $prospect,
        ]);
    }

    /**
     * Remove the specified prospect
     */
    public function destroy(Prospect $prospect)
    {
        $prospect->delete();

        return redirect()->route('admin.prospects.index')
            ->with('success', 'Prospek berhasil dihapus!');
    }

    /**
     * Approve a prospect (change status to qualified)
     */
    public function approve(Prospect $prospect)
    {
        $prospect->update([
            'status' => 'qualified',
        ]);

        return redirect()->back()->with('success', 'Prospek berhasil disetujui!');
    }

    /**
     * Update prospect status
     */
    public function updateStatus(Request $request, Prospect $prospect)
    {
        $validated = $request->validate([
            'status' => 'required|in:new,contacted,qualified,converted,rejected',
        ]);

        $prospect->update([
            'status' => $validated['status'],
        ]);

        $statusText = [
            'new' => 'direset ke baru',
            'contacted' => 'diubah ke dihubungi',
            'qualified' => 'disetujui/dikualifikasi',
            'converted' => 'dikonversi',
            'rejected' => 'ditolak'
        ];

        return redirect()->back()->with('success', "Prospek berhasil {$statusText[$validated['status']]}!");
    }

    /**
     * Bulk approve prospects
     */
    public function bulkApprove(Request $request)
    {
        $validated = $request->validate([
            'prospect_ids' => 'required|array',
            'prospect_ids.*' => 'exists:prospects,id',
        ]);

        Prospect::whereIn('id', $validated['prospect_ids'])
            ->update(['status' => 'qualified']);

        return response()->json([
            'message' => count($validated['prospect_ids']) . ' prospek berhasil disetujui!',
        ]);
    }

    /**
     * Get table data for AJAX requests (SSR approach)
     */
    public function tableData(Request $request)
    {
        $query = Prospect::with(['sales', 'category']);

        // Filter by sales
        if ($request->filled('sales_id') && $request->sales_id !== 'all') {
            $query->where('sales_id', $request->sales_id);
        }

        // Filter by category
        if ($request->filled('category_id') && $request->category_id !== 'all') {
            $query->where('prospect_category_id', $request->category_id);
        }

        // Filter by status
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('customer_name', 'like', "%{$search}%")
                    ->orWhere('customer_email', 'like', "%{$search}%")
                    ->orWhere('customer_number', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        // Date range filter
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to . ' 23:59:59');
        }

        // Sorting
        $sortField = $request->get('sort', 'created_at');
        $sortDirection = $request->get('direction', 'desc');

        // Map frontend sort fields to database fields
        $sortMapping = [
            'id' => 'id',
            'customer' => 'customer_name',
            'sales' => 'sales_id',
            'status' => 'status',
            'created' => 'created_at',
        ];

        $dbSortField = $sortMapping[$sortField] ?? 'created_at';
        $query->orderBy($dbSortField, $sortDirection);

        // Pagination
        $perPage = $request->get('per_page', 15);
        $prospects = $query->paginate($perPage, ['*'], 'page', $request->get('page', 1));

        return response()->json($prospects);
    }

    /**
     * Export prospects to Excel
     */
    public function export(Request $request)
    {
        $query = Prospect::with(['sales', 'category']);

        // Apply same filters as table data
        if ($request->filled('sales_id') && $request->sales_id !== 'all') {
            $query->where('sales_id', $request->sales_id);
        }

        if ($request->filled('category_id') && $request->category_id !== 'all') {
            $query->where('prospect_category_id', $request->category_id);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('customer_name', 'like', "%{$search}%")
                    ->orWhere('customer_email', 'like', "%{$search}%")
                    ->orWhere('customer_number', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%");
            });
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $prospects = $query->orderBy('created_at', 'desc')->get();

        // Create CSV content
        $csvContent = "ID,Customer Name,Customer Email,Customer Phone,Address,Sales Person,Category,Points,Status,Created At,Converted At\n";

        foreach ($prospects as $prospect) {
            $csvContent .= sprintf(
                "%d,\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",%d,\"%s\",\"%s\",\"%s\"\n",
                $prospect->id,
                str_replace('"', '""', $prospect->customer_name),
                str_replace('"', '""', $prospect->customer_email ?? ''),
                str_replace('"', '""', $prospect->customer_number ?? ''),
                str_replace('"', '""', $prospect->address ?? ''),
                str_replace('"', '""', $prospect->sales->name ?? ''),
                str_replace('"', '""', $prospect->category->name ?? ''),
                $prospect->category->points ?? 0,
                ucfirst($prospect->status),
                $prospect->created_at->format('Y-m-d H:i:s'),
                $prospect->converted_at ? $prospect->converted_at->format('Y-m-d H:i:s') : ''
            );
        }

        $filename = 'prospects_export_' . now()->format('Y-m-d_H-i-s') . '.csv';

        return response($csvContent)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }
}
