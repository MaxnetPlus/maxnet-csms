<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\SalesTarget;
use App\Models\SalesPoint;
use App\Models\Prospect;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class SalesManagementController extends Controller
{
    /**
     * Display a listing of sales users.
     */
    public function index(Request $request)
    {
        $query = User::role('sales')
            ->with(['salesTargets' => function ($q) {
                $q->where('is_active', true)->latest();
            }]);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%");
            });
        }

        $salesUsers = $query->paginate(10);

        // Add statistics for each sales user
        $salesUsers->getCollection()->transform(function ($user) {
            // Get current active target
            $currentTarget = $user->salesTargets->where('is_active', true)->first();

            $user->stats = [
                'today_prospects' => Prospect::where('sales_id', $user->id)->today()->count(),
                'today_points' => (int) (SalesPoint::bySales($user->id)->today()->sum('points_earned') ?? 0),
                'month_prospects' => Prospect::where('sales_id', $user->id)->thisMonth()->count(),
                'month_points' => (int) (SalesPoint::bySales($user->id)->thisMonth()->sum('points_earned') ?? 0),
                'total_points' => (int) (SalesPoint::bySales($user->id)->sum('points_earned') ?? 0),
                'current_target' => $currentTarget,
            ];
            return $user;
        });

        return Inertia::render('Admin/SalesManagement/Index', [
            'salesUsers' => $salesUsers,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Display the specified sales user.
     */
    public function show(User $salesManagement)
    {
        $user = $salesManagement->load(['salesTargets', 'prospects.category']);

        // Get current active target
        $currentTarget = $user->salesTargets->where('is_active', true)->first();

        // Calculate statistics
        $stats = [
            'today_prospects' => $user->prospects()->today()->count(),
            'today_points' => (int) (SalesPoint::bySales($user->id)->today()->sum('points_earned') ?? 0),
            'week_prospects' => $user->prospects()->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])->count(),
            'week_points' => (int) (SalesPoint::bySales($user->id)->whereBetween('date', [now()->startOfWeek(), now()->endOfWeek()])->sum('points_earned') ?? 0),
            'month_prospects' => $user->prospects()->thisMonth()->count(),
            'month_points' => (int) (SalesPoint::bySales($user->id)->thisMonth()->sum('points_earned') ?? 0),
            'total_prospects' => $user->prospects()->count(),
            'total_points' => (int) (SalesPoint::bySales($user->id)->sum('points_earned') ?? 0),
            'current_target' => $currentTarget,
        ];

        // Recent prospects
        $recentProspects = $user->prospects()
            ->with('category')
            ->latest()
            ->take(10)
            ->get()
            ->map(function ($prospect) {
                return [
                    'id' => $prospect->id,
                    'name' => $prospect->customer_name,
                    'phone' => $prospect->customer_number,
                    'address' => $prospect->address,
                    'points_earned' => $prospect->category ? $prospect->category->points : 0,
                    'created_at' => $prospect->created_at->format('Y-m-d H:i:s'),
                    'status' => $prospect->status,
                ];
            });

        return Inertia::render('Admin/SalesManagement/Show', [
            'salesUser' => array_merge($user->toArray(), [
                'stats' => $stats,
                'recent_prospects' => $recentProspects
            ])
        ]);
    }

    /**
     * Show the form for editing the specified sales user.
     */
    public function edit(User $salesManagement)
    {
        $user = $salesManagement->load(['salesTargets' => function ($q) {
            $q->where('is_active', true)->latest();
        }]);

        // Get current target for form pre-population
        $currentTarget = $user->salesTargets->where('is_active', true)->first();

        return Inertia::render('Admin/SalesManagement/Edit', [
            'salesUser' => array_merge($user->toArray(), [
                'current_target' => $currentTarget ? [
                    'daily_target' => $currentTarget->daily_target,
                    'monthly_target' => $currentTarget->monthly_target
                ] : null
            ])
        ]);
    }

    /**
     * Update the specified sales user.
     */
    public function update(Request $request, User $salesManagement)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users,username,' . $salesManagement->id,
            'email' => 'required|string|email|max:255|unique:users,email,' . $salesManagement->id,
            'phone_number' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'department' => 'nullable|string|max:255',
            'daily_target' => 'required|integer|min:1',
            'monthly_target' => 'required|integer|min:1',
        ]);

        // Update user information
        $salesManagement->update([
            'name' => $validated['name'],
            'username' => $validated['username'],
            'email' => $validated['email'],
            'phone_number' => $validated['phone_number'] ?? null,
            'address' => $validated['address'] ?? null,
            'department' => $validated['department'] ?? null,
        ]);

        // Handle sales target updates
        $currentTarget = $salesManagement->salesTargets()->where('is_active', true)->first();

        // Check if target values have changed
        $targetChanged = !$currentTarget ||
            $currentTarget->daily_target != $validated['daily_target'] ||
            $currentTarget->monthly_target != $validated['monthly_target'];

        if ($targetChanged) {
            $today = now()->toDateString();

            // Check if there's already a target for today
            $todayTarget = SalesTarget::where('sales_id', $salesManagement->id)
                ->where('effective_from', $today)
                ->first();

            if ($todayTarget) {
                // Update existing target for today
                $todayTarget->update([
                    'daily_target' => $validated['daily_target'],
                    'monthly_target' => $validated['monthly_target'],
                    'is_active' => true, // Ensure it's active
                ]);

                // Deactivate any other active targets
                SalesTarget::where('sales_id', $salesManagement->id)
                    ->where('id', '!=', $todayTarget->id)
                    ->where('is_active', true)
                    ->update(['is_active' => false]);
            } else {
                // Deactivate current target (close it)
                if ($currentTarget) {
                    $currentTarget->update([
                        'is_active' => false,
                        'effective_to' => now()->subDay()->toDateString()
                    ]);
                }

                // Create new target with today's date (date field, not datetime)
                SalesTarget::create([
                    'sales_id' => $salesManagement->id,
                    'daily_target' => $validated['daily_target'],
                    'monthly_target' => $validated['monthly_target'],
                    'effective_from' => $today, // Use date string for date field
                    'effective_to' => null, // Open-ended until next change
                    'is_active' => true,
                ]);
            }
        }

        return redirect()->route('admin.sales-management.index')
            ->with('success', 'Sales user berhasil diperbarui!');
    }

    /**
     * Remove the specified sales user.
     */
    public function destroy(User $salesManagement)
    {
        // Don't allow deletion if user has prospects
        if ($salesManagement->prospects()->count() > 0) {
            return back()->with('error', 'Tidak dapat menghapus sales yang memiliki data prospek.');
        }

        $salesManagement->delete();

        return redirect()->route('admin.sales-management.index')
            ->with('success', 'Sales user berhasil dihapus!');
    }
}
