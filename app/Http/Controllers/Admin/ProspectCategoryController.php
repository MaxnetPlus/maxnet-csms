<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProspectCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ProspectCategoryController extends Controller
{
    /**
     * Display a listing of prospect categories
     */
    public function index(Request $request)
    {
        $search = $request->get('search');

        $query = ProspectCategory::withCount('prospects');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $categories = $query->latest()->paginate(10);

        // Calculate total points awarded for each category
        foreach ($categories as $category) {
            $approvedProspectsCount = DB::table('prospects')
                ->where('prospect_category_id', $category->id)
                ->where('status', 'approved')
                ->count();
            $category->total_points_awarded = $approvedProspectsCount * $category->points;
        }

        // Calculate stats
        $totalPointsAwarded = DB::table('prospects')
            ->join('prospect_categories', 'prospects.prospect_category_id', '=', 'prospect_categories.id')
            ->where('prospects.status', 'approved')
            ->sum('prospect_categories.points');

        $stats = [
            'total_categories' => ProspectCategory::count(),
            'active_categories' => ProspectCategory::where('is_active', true)->count(),
            'total_points_available' => ProspectCategory::where('is_active', true)->sum('points'),
            'total_points_awarded' => $totalPointsAwarded,
        ];

        return Inertia::render('Admin/ProspectCategories/Index', [
            'categories' => $categories,
            'filters' => [
                'search' => $search,
            ],
            'stats' => $stats,
        ]);
    }

    /**
     * Show the form for creating a new category
     */
    public function create()
    {
        return Inertia::render('Admin/ProspectCategories/Create');
    }

    /**
     * Store a newly created category
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:prospect_categories',
            'description' => 'nullable|string',
            'points' => 'required|integer|min:1|max:100',
            'is_active' => 'boolean',
        ]);

        ProspectCategory::create($validated);

        return redirect()->route('admin.prospect-categories.index')
            ->with('success', 'Kategori prospek berhasil dibuat!');
    }

    /**
     * Display the specified category
     */
    public function show(ProspectCategory $prospectCategory)
    {
        // Load relationships with recent prospects
        $prospectCategory->loadCount('prospects');

        // Get recent prospects with user info
        $recentProspects = $prospectCategory->prospects()
            ->with(['user'])
            ->latest()
            ->take(10)
            ->get();

        // Calculate total points awarded (only for approved prospects)
        $approvedProspectsCount = $prospectCategory->prospects()
            ->where('status', 'approved')
            ->count();
        $totalPointsAwarded = $approvedProspectsCount * $prospectCategory->points;

        // Add calculated fields to the category
        $prospectCategory->total_points_awarded = $totalPointsAwarded;
        $prospectCategory->recent_prospects = $recentProspects;

        return Inertia::render('Admin/ProspectCategories/Show', [
            'category' => $prospectCategory,
        ]);
    }

    /**
     * Show the form for editing the specified category
     */
    public function edit(ProspectCategory $prospectCategory)
    {
        return Inertia::render('Admin/ProspectCategories/Edit', [
            'category' => $prospectCategory,
        ]);
    }

    /**
     * Update the specified category
     */
    public function update(Request $request, ProspectCategory $prospectCategory)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:prospect_categories,name,' . $prospectCategory->id,
            'description' => 'nullable|string',
            'points' => 'required|integer|min:1|max:100',
            'is_active' => 'boolean',
        ]);

        $prospectCategory->update($validated);

        return redirect()->route('admin.prospect-categories.index')
            ->with('success', 'Kategori prospek berhasil diperbarui!');
    }

    /**
     * Remove the specified category
     */
    public function destroy(ProspectCategory $prospectCategory)
    {
        // Check if category has prospects
        if ($prospectCategory->prospects()->count() > 0) {
            return back()->with('error', 'Tidak dapat menghapus kategori yang sudah digunakan oleh prospek.');
        }

        $prospectCategory->delete();

        return redirect()->route('admin.prospect-categories.index')
            ->with('success', 'Kategori prospek berhasil dihapus!');
    }

    /**
     * Toggle active status of the category
     */
    public function toggleStatus(Request $request, ProspectCategory $prospectCategory)
    {
        $validated = $request->validate([
            'is_active' => 'required|boolean',
        ]);

        $prospectCategory->update([
            'is_active' => $validated['is_active']
        ]);

        $status = $validated['is_active'] ? 'diaktifkan' : 'dinonaktifkan';

        return redirect()->back()->with('success', "Kategori berhasil {$status}!");
    }
}
